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

    // 🔍 Détection d'un blocage à l'initialisation
    if (!isReady || !session) {
        console.log('[DIRECTOR] Session non initialisable ou blocage explicite dans l\'initialisation');
        return false;
    }

    // 🔁 Si la propriété est à revenus, forcer certaines specs à 0 dès maintenant
    if (session.specValues.propertyUsage === "income" && !session._incomeSpecsForced) {
        const specsToForce = ["bedrooms", "bathrooms", "garage", "parking"];
        for (const field of specsToForce) {
            session.specValues[field] = 0;
            setAskedSpec(session, field, "asked set to true because income property");
        }
        session._incomeSpecsForced = true;
    }

    console.log(`[DIRECTOR] Taitement du message reçu: "${message}"`);

    const nextSpec = getNextSpec(session.projectType, session.specValues, session.askedSpecs);
    console.log(`[DIRECTOR] État de "${nextSpec}" → specValue = "${session.specValues[nextSpec]}", asked = ${session.askedSpecs[nextSpec]}`);

    const isValid = isValidAnswer(message, session.projectType, nextSpec);

    if (!isValid) {
        console.log(`[DIRECTOR] La réponse fournie pour la spec "${nextSpec}" ne peut être validée`);
        const alreadyAsked = session.askedSpecs[nextSpec] === true;
        setAskedSpec(session, nextSpec, "asked but invalid answer");

        // 🧠 Cas particulier pour projectType
        if (nextSpec === "projectType") {
            const interpreted = await gptClassifyProject(message, session.language || "fr");
            const isValidGPT = isValidAnswer(interpreted, session.projectType, "projectType");

            if (isValidGPT) {
                setProjectType(session, interpreted, "GPT → valide");
            } else {
                setProjectType(session, "?", "GPT → invalide");
            }

            await stepWhatNext(context);
            return true;
        }

        // 🧠 Cas des autres specs invalides
        const current = session.specValues[nextSpec];
        const protectedValues = ["E", 0];

        if (!protectedValues.includes(current)) {
            if (alreadyAsked && current === "?") {
                setSpecValue(session, nextSpec, "E", "runDirector/?→E after 2 invalid");
                console.log(`[DIRECTOR] "${nextSpec}" → est passé de "?" à "E" après deux réponses invalides`);
                await stepWhatNext(context);
                return true;
            } else {
                setSpecValue(session, nextSpec, "?", "set by runDirector due to invalid answer");
            }
        } else {
            console.log(`[DIRECTOR] Réécriture de "${nextSpec}" car déjà à valeur protégée "${current}"`);
        }

        context.deferSpec = true;
        context.gptAllowed = true;
        await chatOnly(senderId, message, session.language || "fr");
        await stepWhatNext(context);
        return true;
    }

    // ✅ Réponse valide
    console.log(`[DIRECTOR] Réponse jugée valide pour "${nextSpec}" = "${message}"`);

    if (nextSpec === "projectType") {
        const interpreted = getProjectTypeFromNumber(message);
        setAskedSpec(session, "projectType", "valid answer");
        setProjectType(session, interpreted, "user input");
    } else {
        setSpecValue(session, nextSpec, message, "runDirector/valid");
    }

    const continued = await stepWhatNext(context);
    if (!continued) {
        console.log('[DIRECTOR] Aucun mouvement supplémentaire possible (whatNext) → passage en mode chatOnly');
        context.gptAllowed = true;
        await chatOnly(senderId, message, session.language || "fr");
        return true;
    }

    return true;
}

module.exports = { runDirector };
