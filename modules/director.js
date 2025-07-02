const { isValidAnswer, getProjectTypeFromNumber, buildSpecSummary } = require('./specEngine');
const { getSession, resetSession, saveSession } = require('./sessionStore');
const { setProjectType, initializeSpecFields, setSpecValue, gptClassifyProject, chatOnly, getNextSpec, setAskedSpec} = require('./utils');
const { stepInitializeSession } = require('./steps/index');
const { stepWhatNext, stepHandleProjectType } = require('./steps');


//const { propertyUsage, projectType } = require('./displayMap');

async function runDirector(context) {

    const { message, senderId } = context;
    const isReady = await stepInitializeSession(context);    // 🔄 Initialisation ou récupération de session valide
    const session = context.session;

    if (!isReady) {
        return false;
    }

    // 🧭 Détermination de la prochaine spec à traiter
    const nextSpec = getNextSpec(session);
    console.log(`[DIRECTOR] NextSpec à traiter = _${nextSpec}_`);
    console.log(`[DIRECTOR] Current projectType status = _${session.projectType}_`);

      
    // 🧠 Cas unique : traitement de projectType uniquement via GPT
    if (nextSpec === "projectType") {
        const handled = await stepHandleProjectType(context);
        return handled;
    }

    const isValid = isValidAnswer(message, session.projectType, nextSpec);
    console.log(`[DIRECTOR] Réponse jugée _${isValid ? "valide" : "invalide"} _ pour _"${nextSpec}"_ = _"${message}"_`);

    if (!isValid) {
        const alreadyAsked = session.askedSpecs[nextSpec] === true;
        const current = session.specValues[nextSpec];
        const protectedValues = ["E", 0];

        if (nextSpec === "propertyUsage" && !alreadyAsked) {
          //  setAskedSpec(context.session, nextSpec, "!isValid asked but invalid answer");
        }

        if (!protectedValues.includes(current)) {
            if (alreadyAsked && current === "?") {
                setSpecValue(session, nextSpec, "E", "passé à E après 2 tentatives");
                console.log(`[DIRECTOR !isValid] nextSpec: "${nextSpec}" passé à "E" après deux tentatives`);
            } else {
                setSpecValue(session, nextSpec, "?", "runDirector/invalid");
            }
        }

        context.deferSpec = true;
        context.gptAllowed = true;
        saveSession(context)
        await chatOnly(senderId, message, session.language || "fr");
        await stepWhatNext(context, nextSpec);
        console.log('[DIRECTOR !isValid] Fin : réponse invalide, relance via GPT + stepWhatNext');
        return true;
    }
    //if is valid

    setSpecValue(session, nextSpec, message, "runDirector/valid");


    saveSession(context)
    const continued = await stepWhatNext(context, nextSpec);

    if (!continued) {
 
              
        console.log('[DIRECTOR] Aucun mouvement supplémentaire possible (whatNext) → passage en mode chatOnly');

        context.gptAllowed = true;
        await chatOnly(senderId, message, session.language || "fr");
        console.log('[DIRECTOR] Fin : fin de parcours après stepWhatNext');

    }

    console.log('[DIRECTOR] Fin : réponse valide traitée normalement');
    saveSession(context)
    return true;
}

module.exports = { runDirector };
