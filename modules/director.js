const { isValidAnswer, getProjectTypeFromNumber, buildSpecSummary } = require('./specEngine');
const { getSession, resetSession, saveSession, logSessionState } = require('./sessionStore');
const { setProjectType, initializeSpecFields, setSpecValue, gptClassifyProject, chatOnly, getNextSpec, setAskedSpec } = require('./utils');
const { stepInitializeSession } = require('./steps/index');
const { stepWhatNext, stepHandleProjectType, stepHandleSpecAnswer, stepSummarizeAndConfirm } = require('./steps');
const { projectType } = require('./displayMap');


//const { propertyUsage, projectType } = require('./displayMap');

async function runDirector(context) {
    const { message, senderId } = context;

    // 🔄 Initialisation ou récupération de session valide
    const isReady = await stepInitializeSession(context);
    const session = context.session;

    //pas prêt pour enclencher les prochaines étapes
    if (!isReady) {
        console.log('[DIRECTOR] is not ready to continue')
        logSessionState("[***DIRECTOR !isReady]", session);
        return false;
    }

    // 🧭 Détermination de la prochaine spec à traiter

    const spec = getNextSpec(session);
    console.log(`[DIRECTOR] NextSpec à traiter = _${spec}_`);

// 🔁 ON ÉVALUE LA SPEC À TRAITER LORSQUE LA DISCUSSION COMMENCE
    if (spec === 'none') {
        console.log("toutes les specs ont été traitées");
        //     context.gptAllowed = true;
        context.session.mode = 'chat'
        //   context.gptAllowed = true;
        // logSessionState("***[DIRECTOR no summary]", session);
        await chatOnly(senderId, message, session.language || "fr");
        return true;
    }

    // NEXT SPEC PROJECT TYPE
    if (spec === "projectType") {
        //     logSessionState("***[DIRECTOR stepHandleProjectType]", session);
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

    // 🔁 ON ÉVALUE LA PROCHAINE SPEC À TRAITER POUR PROGRESSER AU TRAVERS DES SPECS
    const nextSpec = getNextSpec(session);

    console.log(`[DIRECTOR] NextSpec recalculée = _${nextSpec}_`);

    //TOUTES LES SPECS ONT ÉTÉ TRAITÉES
    //if (nextSpec === 'none') {
    //    console.log("[DIRECTOR] toutes les specs ont été traitées");
    //    //  context.gptAllowed = true;
    //    context.session.mode = 'chat'
    //    //    context.gptAllowed = true;
    //    //     logSessionState("***[DIRECTOR no summary]", session);
    //    await chatOnly(senderId, message, session.language || "fr");
    //    return true;
    //}

    //summarize
    if ((nextSpec === null || nextSpec === "none") && ["B", "S", "R", "E"].includes(session.projectType)) {
        if (session.mode !== "chat") {
            console.log("[DIRECTOR] ✅ Toutes les specs sont complètes → on envoie le résumé");
            await stepSummarizeAndConfirm(context);
            return true;
        }
        console.log("[DIRECTOR] ℹ️ Session déjà en mode chat → passage à GPT");
        await chatOnly(senderId, message, session.language || "fr");
        return true;
    }

    // 👉 Sinon, poser la prochaine question
    await stepWhatNext(context, nextSpec, spec);
    return true;
}

module.exports = { runDirector };
