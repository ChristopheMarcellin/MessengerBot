const { isValidAnswer, getProjectTypeFromNumber, buildSpecSummary } = require('./specEngine');
const { getSession, resetSession, saveSession, logSessionState } = require('./sessionStore');
const { setProjectType, initializeSpecFields, setSpecValue, gptClassifyProject, chatOnly, getNextSpec, setAskedSpec } = require('./utils');
const { stepInitializeSession } = require('./steps/index');
const { stepWhatNext, stepHandleProjectType, stepHandleSpecAnswer, stepSummarizeAndConfirm } = require('./steps');
const { projectType } = require('./displayMap');
const { logQnA } = require('./googleData');  

//const { propertyUsage, projectType } = require('./displayMap');

async function runDirector(context) {
 
     //conversion des refus  signifiés par le message: X
    if (typeof context.message === "string" && context.message.trim().toUpperCase() === "X") {
        context.message = "0";
    }
    const { message, senderId } = context;

    // 🔄 Initialisation ou récupération de session valide
    const isReady = await stepInitializeSession(context);



    const session = context.session;

    //pas prêt pour enclencher les prochaines étapes
    if (!isReady) {
        return false;
    }

    //troubleshooter
    console.log(`[DIRECTOR] MODE MODE MODE MODE MODE MODE MODE = _${context.session.mode}_`);
    console.log("[XXXXXXXXXXXXXXX DIRECTOR SESSION DEBUG]");
    for (const key in session) {
        if (Object.prototype.hasOwnProperty.call(session, key)) {
            console.log(`  ${key}: ${JSON.stringify(session[key])}`);
        }
    }
    // ...dans runDirector, après init session et avant traitement :
    if (session.mode !== 'spec') {
        await logQnA(senderId, message, "Q", session);
    }
    //ON ÉVALUE ET VALIDE LE MESSAGE REÇU EN FONCTION DE LA SPEC EN COURS DE TRAITEMENT
    const spec = getNextSpec(session);
    console.log(`[DIRECTOR] NextSpec à traiter = _${spec}_`);

    if (spec === 'none') {
        console.log("toutes les specs ont déjà été traitées");
        context.session.mode = 'chat'
     //   console.log("session.language " + session.language);
     //   console.log("context.language " + context.language);
        await chatOnly(senderId, message, session);
        return true;
    }

    if (spec === "projectType") {
        const handled = await stepHandleProjectType(context);
        return handled;
    }

    // 🎯 Validation de la réponse utilisateur pour la spec attendue
    if (spec !== null) {

        const isValid = await isValidAnswer(context, session.projectType, spec, session.language || "fr");
       console.log(`[DIRECTOR] Réponse jugée _${isValid ? "valide" : "invalide"} _ pour _"${spec}"_ = _"${context.message}"_`);

        // 🔄 Traitement simple (sans appel de stepWhatNext ici)
        await stepHandleSpecAnswer(context, spec, isValid);
    }

    // 🔁 ON DÉTERMINE LA PROCHAINE SPÉCIFICATION À TRAITER ET ENVOYONS LE MESSAGE APPROPRIÉ À L'USAGER
    const nextSpec = getNextSpec(session);


 //   console.log(`[DIRECTOR] NextSpec recalculée = _${nextSpec}_`);


    //SOMMAIRE
    if ((nextSpec === null || nextSpec === "none") && ["B", "S", "R", "E"].includes(session.projectType)) {
        if (session.mode !== "chat") {
            console.log("[DIRECTOR] ✅ Toutes les specs sont complètes → on envoie le résumé");
         //   console.log("session.language b4 summary" + session.language);
          //  console.log("context.language b4 summary" + context.language);
            await stepSummarizeAndConfirm(context);
            session.mode = "chat";
            return true;
        }
        console.log("[DIRECTOR] ℹ️ Session déjà en mode chat → passage à GPT");
        console.log("session.language moving to chat " + session.language);
        console.log("context.language moving to chat "+ context.language);
        await chatOnly(senderId, message, session);
        return true;
    }
 //   console.log("session.language whatNext call " + session.language);
  //  console.log("context.language whatNext call " + context.language);
    // 👉 Sinon, poser la prochaine question
    await stepWhatNext(context, nextSpec, spec);
    return true;
}

module.exports = { runDirector };
