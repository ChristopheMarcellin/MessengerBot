const { setProjectType, initializeSpecFields, detectLanguageFromText } = require('../utils');
const { getSession, saveSession, resetSession, logSessionState } = require('../sessionStore');

async function stepInitializeSession(context) {
    const { senderId, message } = context;

    // 🔐 Assurer la présence du senderId dès le départ
    if (typeof senderId !== 'string' || senderId.trim() === '') {
        console.warn('[INIT] senderId manquant → impossible de poursuivre.');
        return false;
    }

    const isEndSession = message.trim().toLowerCase() === 'end session';
    let session = getSession(senderId);

    if (isEndSession) {
        session = resetSession(context);
        context.session = session;
        console.log('[INIT] "end session" → session réinitialisée');
        return false;
    }

    if (!session) {
        session = resetSession(context);
        console.log('[INIT] session créée car absente');
    }

    context.session = session;

    if (session.specValues && session.askedSpecs) {
        console.log('[INIT] Session déjà initialisée → aucune action requise');
        return true;
    }
    console.log("init language test")
    console.log(message);
    console.log(detectLanguageFromText(message));
    context.session.language ??= detectLanguageFromText(message);
    context.session.ProjectDate ??= new Date().toISOString();
    context.session.questionCount ??= 1;
    context.session.maxQuestions ??= 40;
    context.session.askedSpecs ??= {};
    context.session.specValues ??= {};
    context.session.currentSpec ??= null;

    logSessionState("Vérification APRÈS une initialisation propre", context.session);
    return true;
}
module.exports = { stepInitializeSession };
