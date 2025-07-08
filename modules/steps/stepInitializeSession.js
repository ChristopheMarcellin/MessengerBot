const { setProjectType, initializeSpecFields, detectLanguageFromText, getNextSpec } = require('../utils');
const { getSession, saveSession, resetSession, logSessionState } = require('../sessionStore');

async function stepInitializeSession(context) {
    const { senderId, message } = context;

    // 🔐 STOP PROBLÈME EN VUE
    if (typeof senderId !== 'string' || senderId.trim() === '') {
        console.warn('[INIT] senderId manquant → impossible de poursuivre.');
        return false;
    }

    const isEndSession = message.trim().toLowerCase() === 'end session';
    let session = getSession(senderId);

    if (isEndSession) {
      //  session = resetSession(context);
      //  session.language = detectLanguageFromText(message);  // ✅ détecte immédiatement
        context.session = null;

        // DEBUG VERROU
        console.log("[INIT end Session in progress] Session = ", JSON.stringify(session, null, 2));
        console.log("[INIT end Session in progress] getNextSpec = ", getNextSpec(session));
        console.log('[INIT end Session in protress] Session réinitialisée par (end session)');
        return false;

    } else if (!session) {
        session = resetSession(context);
       // session.language = detectLanguageFromText(message);  // ✅ détecte immédiatement
        context.session = session;
        console.log('[INIT] Session créée car absente');
        return true;
    }

    // 🧠 Affectation obligatoire avant traitement
    context.session = session;

    // 🌍 Détection de langue forcée pour la suite des choses
    if (!context.session.language) {
        context.session.language = detectLanguageFromText(message);
    }

    // ✅ Si déjà initialisée, rien à faire
    if (session.specValues && session.askedSpecs) {
        console.log('[INIT] Session déjà initialisée → aucune action requise');
        return true;
    }

    return true;
}

module.exports = { stepInitializeSession };
