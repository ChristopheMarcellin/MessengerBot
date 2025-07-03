const { isValidAnswer, getProjectTypeFromNumber, buildSpecSummary } = require('./specEngine');
const { getSession, resetSession, saveSession } = require('./sessionStore');
const { setProjectType, initializeSpecFields, setSpecValue, gptClassifyProject, chatOnly, getNextSpec, setAskedSpec} = require('./utils');
const { stepInitializeSession } = require('./steps/index');
const { stepWhatNext, stepHandleProjectType, stepHandleSpecAnswer, stepSummarizeAndConfirm } = require('./steps');


//const { propertyUsage, projectType } = require('./displayMap');

async function runDirector(context) {

    const { message, senderId } = context;

// 🔄 Initialisation ou récupération de session valide
    const isReady = await stepInitializeSession(context);    
    const session = context.session;

    if (!isReady) {
        return false;
    }

    // 🧭 Détermination de la prochaine spec à traiter
    const nextSpec = getNextSpec(session);
    console.log(`[DIRECTOR] NextSpec à traiter = _${nextSpec}_`);
    console.log(`[DIRECTOR] Current projectType status = _${session.projectType}_`);


    if (nextSpec === null) {
        // Appel du résumé seulement si on n'est pas encore en mode chat
        console.log("CM la nextSpec est null")
        if (session.mode !== "chat") {
            console.log("on appelle le summary")
            await stepSummarizeAndConfirm(context);
            return true; // ⛔ on stoppe ici pour éviter GPT sur ce message
        }

        // Si déjà en mode chat, alors on traite le message avec GPT
        context.gptAllowed = true;
        await chatOnly(senderId, message, session.language || "fr");
        return true;
    }
    console.log(`CM la next spec n'est pas null, voici sa valeur "${nextSpec}"_ = _"${message}"_`)
      
    // 🧠 Cas unique : traitement de projectType uniquement via GPT
    if (nextSpec === "projectType") {
        const handled = await stepHandleProjectType(context);
        return handled;
    }
    // 🎯 Validation de la réponse utilisateur pour la spec attendue
    const isValid = isValidAnswer(message, session.projectType, nextSpec);
    console.log(`[DIRECTOR] Réponse jugée _${isValid ? "valide" : "invalide"} _ pour _"${nextSpec}"_ = _"${message}"_`);

    // 🔄 Délégation du traitement à stepHandleSpecAnswer
    const handled = await stepHandleSpecAnswer(context, nextSpec, isValid);
    return handled;

}

module.exports = { runDirector };