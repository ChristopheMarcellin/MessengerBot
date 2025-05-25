const { isValidAnswer, getProjectTypeFromNumber } = require('./specEngine');
const {
    setProjectType,
    initializeSpecFields,
    setSpecValue,
    gptClassifyProject,
    chatOnly,
    getNextSpec,
    setAskedSpec
} = require('./utils');
const { stepInitializeSession } = require('./steps/index');
const { stepHandleFallback } = require('./steps');
const { stepWhatNext } = require('./steps');

async function runDirector(context) {
    const { message, senderId } = context;

    // 1 - *****************************Initialisation de la session**********************************
    const isReady = await stepInitializeSession(context);
    const session = context.session;

    // 🔍 Blocage volontaire après reset ou erreur
    if (!isReady || !session) {
        console.log('[DIRECTOR] Session non initialisable ou blocage explicite dans l\'initialisation');
        return false;
    }

    // 🔒 Blocage explicite si le projet ou l’usage sont refusés
    if (session.projectType === "E" || session.specValues.propertyUsage === "E") {
        console.log('[DIRECTOR] Session bloquée par refus explicite → arrêt du flux');
        return false;
    }

    console.log(`[DIRECTOR] Message: "${message}"`);

    const nextSpec = getNextSpec(session.projectType, session.specValues, session.askedSpecs);
    if (!nextSpec) {
        console.log('[DIRECTOR] Aucune spec à poser');
        return false;
    }

    if (session.askedSpecs[nextSpec] === undefined) {
        session.askedSpecs[nextSpec] = false;
    }

    console.log(`[DIRECTOR] Identification de la nextSpec à traiter = ${nextSpec}`);
    console.log(`[DIRECTOR] État de "${nextSpec}" → specValue = "${session.specValues[nextSpec]}", asked = ${session.askedSpecs[nextSpec]}`);

    const isValid = isValidAnswer(message, session.projectType, nextSpec);
    console.log(`[DIRECTOR] Réponse jugée ${isValid ? "valide" : "invalide"} pour "${nextSpec}" = "${message}"`);

    // 🧠 Cas particulier : projectType → traitement fusionné (valide + GPT fallback)
    if (nextSpec === "projectType") {
        if (isValid) {
            const interpreted = getProjectTypeFromNumber(message);
            setAskedSpec(session, "projectType", "valid answer");
            setProjectType(session, interpreted, "user input");
        } else {
            setAskedSpec(session, "projectType", "asked but invalid answer");

            const interpreted = await gptClassifyProject(message, session.language || "fr");
            const isValidGPT = isValidAnswer(interpreted, session.projectType, "projectType");

            if (isValidGPT) {
                setProjectType(session, interpreted, "GPT → valide");
            } else {
                setProjectType(session, "?", "GPT → invalide");
            }
        }

        await stepWhatNext(context);
        return true;
    }

    // 🔁 Cas général : réponse invalide pour une autre spec
    if (!isValid) {
        const alreadyAsked = session.askedSpecs[nextSpec] === true;
        setAskedSpec(session, nextSpec, "asked but invalid answer");

        const current = session.specValues[nextSpec];
        const protectedValues = ["E", 0];

        if (!protectedValues.includes(current)) {
            if (alreadyAsked && current === "?") {
                setSpecValue(session, nextSpec, "E", "runDirector/?→E after 2 invalid");
                console.log(`[DIRECTOR] "${nextSpec}" → est passé de "?" à "E" après deux réponses invalides`);
            } else {
                setSpecValue(session, nextSpec, "?", "runDirector/invalid");
            }
        } else {
            console.log(`[DIRECTOR] Réécriture bloquée de "${nextSpec}" car déjà à valeur protégée "${current}"`);
        }

        context.deferSpec = true;
        context.gptAllowed = true;
        await chatOnly(senderId, message, session.language || "fr");
        await stepWhatNext(context);
        return true;
    }

    // ✅ Cas général : réponse valide
    setSpecValue(session, nextSpec, message, "runDirector/valid");
    setAskedSpec(session, nextSpec, "valid answer");

    // 🎯 Si propertyUsage vaut "income", forcer les autres specs immédiatement
    if (nextSpec === "propertyUsage" && message === "income" && !session._incomeSpecsForced) {
        const specsToForce = ["bedrooms", "bathrooms", "garage", "parking"];
        for (const field of specsToForce) {
            session.specValues[field] = 0;
            setAskedSpec(session, field, "asked set to true because income property");
        }
        session._incomeSpecsForced = true;
    }

    const continued = await stepWhatNext(context);
    if (!continued) {
        console.log('[DIRECTOR] Aucun mouvement supplémentaire possible (whatNext) → passage en mode chatOnly');
        context.gptAllowed = true;
        await chatOnly(senderId, message, session.language || "fr");
    }

    return true;
}

module.exports = { runDirector };
