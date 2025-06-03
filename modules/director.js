const { isValidAnswer, getProjectTypeFromNumber } = require('./specEngine');
const { getSession, resetSession, saveSession } = require('./sessionStore');
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
    const isEndSession = message.trim().toLowerCase() === 'end session';
    // 🛑 Sécurité anti-boucle infinie
    //context._entryCount = (context._entryCount || 0) + 1;
    //if (context._entryCount > 10) {
    //    console.warn(`[DIRECTOR STOP] runDirector appelé plus de 10 fois (_${context._entryCount}_) → interruption.`);
    //    console.log('[DIRECTOR] Fin prématurée : boucle infinie');
    //    return false;
    //}

    // 🔄 Initialisation ou récupération de session valide
    const isReady = await stepInitializeSession(context, isEndSession);
    if (isEndSession) {
        saveSession(context)
        return false;
    }

  //  context.session = getSession(senderId);

    //context.session._entryCount = (context.session._entryCount || 0) + 1;
    //if (context.session._entryCount > 10) {
    //    console.warn(`[DIRECTOR STOP] session.runDirector appelé plus de 10 fois (_${context.session._entryCount}_) → interruption.`);
    //    return false;
    //}

    if (!isReady || !context.session) {
        console.log('[DIRECTOR] Session non initialisable ou blocage explicite dans l\'initialisation');
        console.log('[DIRECTOR] Fin : session absente ou erreur init');
        return false;
    }

    // 🧭 Détermination de la prochaine spec à traiter
    const nextSpec = getNextSpec(context.session);
    console.log(`[DIRECTOR] NextSpec à traiter = _${nextSpec}_`);
    console.log(`[DIRECTOR] Current projectType status = _${context.session.projectType}_`);
    
    //Case nextSpec === "none"
    if (nextSpec === "none") {
        console.log('[DIRECTOR] nextSpec = "none"');
        saveSession(context)
        return false;
    }

    // 🧠 Cas unique : traitement de projectType uniquement via GPT
    if (nextSpec === "projectType"&&!isEndSession) {
        
        const isValid = isValidAnswer(message, "projectType", "projectType");

        if (isValid) {
            const interpreted = getProjectTypeFromNumber(message);
            setProjectType(context.session, interpreted, "user input");
          //  setAskedSpec(context.session, "projectType", "valid answer");
            await stepWhatNext(context, nextSpec);
            saveSession(context);
            return true;
        }

        const interpreted = await gptClassifyProject(message, context.session.language || "fr");
        const isValidGPT = ["B", "S", "R", "E"].includes(interpreted);
        const current = context.session.projectType;
        const alreadyAsked = context.session.askedSpecs.projectType === true;

        if (isValidGPT) {
            setProjectType(context.session, interpreted, "interprétation par gpt");
          //  setAskedSpec(context.session, "projectType", "valid answer");
        } else {
            if (alreadyAsked && current === "?") {
                setProjectType(context.session, "E", "GPT → refus après 2 échecs");
                console.log(`[DIRECTOR !isValidGPT] projectType passé à "E" après deux tentatives floues`);
            } else {
                setProjectType(context.session, "?", "GPT → invalide");
            }
           // setAskedSpec(context.session, "projectType", "asked but invalid answer");
        }

        console.log('[DIRECTOR isValidGPT] projectType détecté et traité via GPT');
        saveSession(context);
        await stepWhatNext(context, nextSpec);
        return true;
    }


    const isValid = isValidAnswer(message, context.session.projectType, nextSpec);
    console.log(`[DIRECTOR] Réponse jugée _${isValid ? "valide" : "invalide"} _ pour _"${nextSpec}"_ = _"${message}"_`);

    if (!isValid) {
        const alreadyAsked = context.session.askedSpecs[nextSpec] === true;
        const current = context.session.specValues[nextSpec];
        const protectedValues = ["E", 0];

        if (nextSpec === "propertyUsage" && !alreadyAsked) {
          //  setAskedSpec(context.session, nextSpec, "!isValid asked but invalid answer");
        }

        if (!protectedValues.includes(current)) {
            if (alreadyAsked && current === "?") {
                setSpecValue(context.session, nextSpec, "E", "passé à E après 2 tentatives");
                console.log(`[DIRECTOR !isValid] nextSpec: "${nextSpec}" passé à "E" après deux tentatives`);
            } else {
                setSpecValue(context.session, nextSpec, "?", "runDirector/invalid");
            }
        }

        context.deferSpec = true;
        context.gptAllowed = true;
        saveSession(context)
        await chatOnly(senderId, message, context.session.language || "fr");
        await stepWhatNext(context, nextSpec);
        console.log('[DIRECTOR !isValid] Fin : réponse invalide, relance via GPT + stepWhatNext');
        return true;
    }
    //if is valid
    setSpecValue(context.session, nextSpec, message, "runDirector/valid");
    saveSession(context)
    const continued = await stepWhatNext(context, nextSpec);

    if (!continued) {
        console.log('[DIRECTOR] Aucun mouvement supplémentaire possible (whatNext) → passage en mode chatOnly');
        context.gptAllowed = true;
        await chatOnly(senderId, message, context.session.language || "fr");
        console.log('[DIRECTOR] Fin : fin de parcours après stepWhatNext');
    }

    console.log('[DIRECTOR] Fin : réponse valide traitée normalement');
    saveSession(context)
    return true;
}

module.exports = { runDirector };
