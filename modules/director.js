const { isValidAnswer, getProjectTypeFromNumber } = require('./specEngine');
const { getSession, resetSession } = require('./sessionStore');
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

    // 🛑 Sécurité anti-boucle infinie
    context._entryCount = (context._entryCount || 0) + 1;
    if (context._entryCount > 10) {
        console.warn(`[DIRECTOR STOP] runDirector appelé plus de 10 fois (${context._entryCount}) → interruption.`);
        console.log('[DIRECTOR] Fin prématurée : boucle infinie');
        return false;
    }

    // 🛑 Bloc d’interruption explicite : message = "end session"
    if (typeof message === "string" && message.trim().toLowerCase() === "end session") {
        resetSession(senderId);
        console.log('[DIRECTOR] "end session" détecté → session réinitialisée à neuf');
        console.log('[DIRECTOR] Fin : end session explicite');
        return false;
    }

    // 🔄 Initialisation ou récupération de session valide
    const isReady = await stepInitializeSession(context);
    context.session = getSession(senderId);

 
    context.session._entryCount = (context.session._entryCount || 0) + 1;
    if (context.session._entryCount > 10) {


        console.warn(`[DIRECTOR STOP] session.runDirector appelé plus de 10 fois (${context.session._entryCount}) → interruption.`);
        console.log('[DIRECTOR] Fin prématurée : boucle infinie (session)');
        return false;
    }

    if (!isReady || !context.session) {
        console.log('[DIRECTOR] Session non initialisable ou blocage explicite dans l\'initialisation');
        console.log('[DIRECTOR] Fin : session absente ou erreur init');
        return false;
    }

    // 🧭 Détermination de la prochaine spec à traiter
    const nextSpec = getNextSpec(context.session);
    console.log(`[DIRECTOR] Avant getNextSpec: session.projectType = ${context.session.projectType}`);
    if (nextSpec === "none") {
        console.log('[DIRECTOR] Fin : aucune spec à traiter');
        return false;
    }

    // 🧠 Cas unique : traitement de projectType uniquement via GPT
    if (nextSpec === "projectType") {
        const interpreted = await gptClassifyProject(message, context.session.language || "fr");
        const isValidGPT = ["B", "S", "R", "E"].includes(interpreted);
        const current = context.session.projectType;
        const alreadyAsked = context.session.askedSpecs.projectType === true;

        if (isValidGPT) {
            setProjectType(context.session, interpreted, "gpt");
            setAskedSpec(context.session, "projectType", "valid answer");
        } else {
            if (alreadyAsked && current === "?") {
                setProjectType(context.session, "E", "GPT → refus après 2 échecs");
                console.log(`[DIRECTOR] projectType passé à "E" après deux tentatives floues`);
            } else {
                setProjectType(context.session, "?", "GPT → invalide");
            }
            setAskedSpec(context.session, "projectType", "asked but invalid answer");
        }

        console.log('[DIRECTOR] Fin : projectType traité via GPT');
        await stepWhatNext(context, nextSpec);
       
        return true;
    }

    if (nextSpec === "projectType") {
        throw new Error("[DIRECTOR] ERREUR CRITIQUE : projectType ne doit pas passer dans le pipeline standard");
    }

    const isValid = isValidAnswer(nextSpec, message, context.session.projectType);
    console.log(`[DIRECTOR] Réponse jugée ${isValid ? "valide" : "invalide"} pour "${nextSpec}" = "${message}"`);

    if (!isValid) {
        const alreadyAsked = context.session.askedSpecs[nextSpec] === true;
        const current = context.session.specValues[nextSpec];
        const protectedValues = ["E", 0];

        if (nextSpec === "propertyUsage" && !alreadyAsked) {
            setAskedSpec(context.session, nextSpec, "asked but invalid answer");
        }

        if (!protectedValues.includes(current)) {
            if (alreadyAsked && current === "?") {
                setSpecValue(context.session, nextSpec, "E", "runDirector/?→E after 2 invalid");
                console.log(`[DIRECTOR] "${nextSpec}" → passé à "E" après deux tentatives`);
            } else {
                setSpecValue(context.session, nextSpec, "?", "runDirector/invalid");
            }
        }

        context.deferSpec = true;
        context.gptAllowed = true;
        await chatOnly(senderId, message, context.session.language || "fr");
        await stepWhatNext(context, nextSpec);
        console.log('[DIRECTOR] Fin : réponse invalide, relance via GPT + stepWhatNext');
        return true;
    }

    setSpecValue(context.session, nextSpec, message, "runDirector/valid");

    const continued = await stepWhatNext(context, nextSpec);
    if (!continued) {
        console.log('[DIRECTOR] Aucun mouvement supplémentaire possible (whatNext) → passage en mode chatOnly');
        context.gptAllowed = true;
        await chatOnly(senderId, message, context.session.language || "fr");
        console.log('[DIRECTOR] Fin : fin de parcours après stepWhatNext');
    }

    console.log('[DIRECTOR] Fin : réponse valide traitée normalement');
    return true;
}

module.exports = { runDirector };
