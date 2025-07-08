const { isValidAnswer, getProjectTypeFromNumber, buildSpecSummary } = require('./specEngine');
const { getSession, resetSession, saveSession, logSessionState } = require('./sessionStore');
const { setProjectType, initializeSpecFields, setSpecValue, gptClassifyProject, chatOnly, getNextSpec, setAskedSpec} = require('./utils');
const { stepInitializeSession } = require('./steps/index');
const { stepWhatNext, stepHandleProjectType, stepHandleSpecAnswer, stepSummarizeAndConfirm } = require('./steps');
const { projectType } = require('./displayMap');


//const { propertyUsage, projectType } = require('./displayMap');

async function runDirector(context) {
    const { message, senderId } = context;

    // 🔄 Initialisation ou récupération de session valide
    const isReady = await stepInitializeSession(context);
    const session = context.session;

    if (!isReady) {
        console.log('[DIRECTOR] is not ready to continue')
        logSessionState("[***DIRECTOR !isReady]", session);
        return false;
    }

    // 🧭 Détermination de la prochaine spec à traiter
    const nextSpec = getNextSpec(session);
    console.log(`[DIRECTOR] NextSpec à traiter = _${nextSpec}_`);
    console.log(`[DIRECTOR] Current projectType status = _${session.projectType}_`);

    // 🧠 Cas unique : stepHandleProjectType de projectType uniquement via GPT
    if (nextSpec === "projectType") {
        logSessionState("***[DIRECTOR stepHandleProjectType]", session);
        const handled = await stepHandleProjectType(context);
        return handled;
    }

    // 🎯 Validation de la réponse utilisateur pour la spec attendue
    const isValid = isValidAnswer(message, session.projectType, nextSpec);
    console.log(`[DIRECTOR] Réponse jugée _${isValid ? "valide" : "invalide"} _ pour _"${nextSpec}"_ = _"${message}"_`);

    // 🔄 Traitement simple (sans appel de stepWhatNext ici)
    await stepHandleSpecAnswer(context, nextSpec, isValid);

    // 🔁 Nouvelle évaluation de la prochaine spec après traitement
    const next = getNextSpec(session);
    console.log(`[DIRECTOR] NextSpec recalculée = _${next}_`);

    //summarize
    if (next === null && ["B", "S", "R"].includes(projectType)) {
        logSessionState("***[DIRECTOR summarize]", session);
        if (session.mode !== "chat") {
            console.log("[DIRECTOR] ✅ Toutes les specs sont complètes → on envoie le résumé");
            await stepSummarizeAndConfirm(context);
            return true;
        }

        console.log("[DIRECTOR] ℹ️ Session déjà en mode chat → passage à GPT");
        context.gptAllowed = true;
        logSessionState("***[DIRECTOR no summary]", session);
        await chatOnly(senderId, message, session.language || "fr");
        return true;
    }

    // 👉 Sinon, poser la prochaine question
    await stepWhatNext(context, next);
    return true;
}

module.exports = { runDirector };