const { isValidAnswer, getProjectTypeFromNumber } = require('./specEngine');
const { getSession } = require('./sessionStore');
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
const { stepWhatNext } = require('./steps');

async function runDirector(context) {
    const { message, senderId } = context;

    context._entryCount = (context._entryCount || 0) + 1;
    if (context._entryCount > 10) {
        console.warn(`[STOP] runDirector appelé plus de 10 fois (${context._entryCount}) → interruption.`);
        return false;
    }

    const isReady = await stepInitializeSession(context);
    const session = context.session = getSession(senderId);
    if (!isReady || !session) {
        console.log('[DIRECTOR] Session non initialisable ou blocage explicite dans l\'initialisation');
        return false;
    }

    const nextSpec = getNextSpec(session.projectType, session.specValues, session.askedSpecs);
    if (nextSpec === "none") return false;

    if (nextSpec === "projectType") {
        const interpreted = await gptClassifyProject(message, session.language || "fr");
        const isValidGPT = ["B", "S", "R", "E"].includes(interpreted);
        setAskedSpec(session, "projectType", isValidGPT ? "valid answer" : "asked but invalid answer");
        setProjectType(session, interpreted, "gpt");
        return true;
    }

    console.log(`[DIRECTOR] Message: "${message}"`);
    console.log(`[DIRECTOR] Spec en cours : ${nextSpec}`);
    console.log(`[DIRECTOR] Valeur actuelle : ${session.specValues[nextSpec]}`);
    console.log(`[DIRECTOR] Déjà posée ? ${session.askedSpecs[nextSpec]}`);

    // 🔒 Protection stricte : projectType ne doit jamais passer ici
    if (nextSpec === "projectType") {
        throw new Error("[DIRECTOR] ERREUR CRITIQUE : projectType ne doit pas être validé ici");
    }

    const isValid = isValidAnswer(nextSpec, message, session.projectType);
    console.log(`[DIRECTOR] Réponse jugée ${isValid ? "valide" : "invalide"} pour "${nextSpec}" = "${message}"`);

    if (!isValid) {
        const alreadyAsked = session.askedSpecs[nextSpec] === true;
        const current = session.specValues[nextSpec];
        const protectedValues = ["E", 0];

        if ((nextSpec === "propertyUsage") && !alreadyAsked) {
            setAskedSpec(session, nextSpec, "asked but invalid answer");
        }

        if (!protectedValues.includes(current)) {
            if (alreadyAsked && current === "?") {
                setSpecValue(session, nextSpec, "E", "runDirector/?→E after 2 invalid");
                console.log(`[DIRECTOR] "${nextSpec}" → passé à "E" après deux tentatives`);
            } else {
                setSpecValue(session, nextSpec, "?", "runDirector/invalid");
            }
        }

        context.deferSpec = true;
        context.gptAllowed = true;
        await chatOnly(senderId, message, session.language || "fr");
        await stepWhatNext(context, nextSpec);
        return true;
    }

    // ✅ Réponse valide
    setSpecValue(session, nextSpec, message, "runDirector/valid");

    const continued = await stepWhatNext(context, nextSpec);
    if (!continued) {
        console.log('[DIRECTOR] Aucun mouvement supplémentaire possible (whatNext) → passage en mode chatOnly');
        context.gptAllowed = true;
        await chatOnly(senderId, message, session.language || "fr");
    }

    return true;
}

module.exports = { runDirector };
