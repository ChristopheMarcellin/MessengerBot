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


    console.log(`[DIRECTOR] Message: "${message}"`);

    const nextSpec = getNextSpec(session.projectType, session.specValues, session.askedSpecs);
    if (!nextSpec) {
        console.log('[DIRECTOR] Aucune spec à poser');
        return false;
    }


    console.log(`[DIRECTOR] Identification de la nextSpec à traiter = ${nextSpec}`);
    console.log(`[DIRECTOR] État de "${nextSpec}" → specValue = "${session.specValues[nextSpec]}", asked = ${session.askedSpecs[nextSpec]}`);

    const isValid = isValidAnswer(message, session.projectType, nextSpec);
    console.log(`[DIRECTOR] Réponse jugée ${isValid ? "valide" : "invalide"} pour "${nextSpec}" = "${message}"`);

    // 🧠 Cas particulier : projectType → traitement fusionné (valide + GPT fallback)
    if (nextSpec === "projectType") {
        if (isValid) {
            const interpreted = getProjectTypeFromNumber(message);
            setProjectType(session, interpreted, "user input");
        } else {

            const interpreted = await gptClassifyProject(message, session.language || "fr");
            const isValidGPT = isValidAnswer(interpreted, session.projectType, "projectType");

            if (isValidGPT) {
                setProjectType(session, interpreted, "GPT → valide");
            } else {
                setProjectType(session, "?", "GPT → invalide");
            }
        }

        await stepWhatNext(context, nextSpec); // ✅ modifié
        return true;
    }

    // 🔁 Cas général : réponse invalide pour une autre spec
    if (!isValid) {
        const alreadyAsked = session.askedSpecs[nextSpec] === true;
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
        await stepWhatNext(context, nextSpec); // ✅ modifié
        return true;
    }

    // ✅ Cas général : réponse valide
    setSpecValue(session, nextSpec, message, "runDirector/valid");
  

    const continued = await stepWhatNext(context, nextSpec); // ✅ modifié
    if (!continued) {
        console.log('[DIRECTOR] Aucun mouvement supplémentaire possible (whatNext) → passage en mode chatOnly');
        context.gptAllowed = true;
        await chatOnly(senderId, message, session.language || "fr");
    }

    return true;
}

module.exports = { runDirector };