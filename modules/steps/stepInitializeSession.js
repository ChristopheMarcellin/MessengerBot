const { setProjectType, initializeSpecFields, detectLanguageFromText } = require('../utils');
const { getSession, saveSession, resetSession, logSessionState } = require('../sessionStore');

async function stepInitializeSession(context) {
    const { senderId, message } = context;

    // 🔐 Sécurité de base
    if (typeof senderId !== 'string' || senderId.trim() === '') {
        console.warn('[INIT] senderId manquant → impossible de poursuivre.');
        return false;
    }

    const isEndSession = message.trim().toLowerCase() === 'end session';
    let session = getSession(senderId);

    if (isEndSession || !session) {
        session = resetSession(context);
        console.log(`[INIT] Session ${isEndSession ? 'réinitialisée (end session)' : 'créée car absente'}`);
    }

    // 🧠 Affectation à context obligatoire avant traitement
    context.session = session;

    // 🌍 Détection de langue toujours faite une seule fois
    context.session.language ??= detectLanguageFromText(message);

    // ✅ Session déjà initialisée = on saute l’initialisation
    if (session.specValues && session.askedSpecs) {
        console.log('[INIT] Session déjà initialisée → aucune action requise');
        return true;
    }

    // 🧱 Initialisation
    session.ProjectDate ??= new Date().toISOString();
    session.questionCount ??= 1;
    session.maxQuestions ??= 40;
    session.askedSpecs ??= {};
    session.specValues ??= {};
    session.currentSpec ??= null;

    logSessionState("Vérification APRÈS une initialisation propre", session);
    return true;
}

module.exports = { stepInitializeSession };
