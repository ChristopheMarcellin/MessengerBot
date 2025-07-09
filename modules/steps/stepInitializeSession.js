const { setProjectType, initializeSpecFields, detectLanguageFromText, getNextSpec, isText } = require('../utils');
const { getSession, saveSession, resetSession, logSessionState } = require('../sessionStore');

async function stepInitializeSession(context) {
    const { senderId, message } = context;
    const isEndSession = message.trim().toLowerCase() === 'end session';
    let session;

    // 🔐 STOP PROBLÈME EN VUE
    if (typeof senderId !== 'string' || senderId.trim() === '') {
        console.warn('[INIT] senderId manquant → impossible de poursuivre.');
        return false;
    }


    if (isEndSession) {

        session = resetSession(context);

        //if (isText(message) && typeof session.language !== 'string') {
        //    session.language = detectLanguageFromText(message);  // ✅ détecte immédiatement
        //}
        context.session = session;
        context.session.mode = 'end session';
        // DEBUG VERROU
        console.log('[INIT end session] Session explicitement remise à null.');
        return false;
    }

    // 🧠 Récupération uniquement si ce n'est pas un end session
    session = getSession(senderId);

    if (!session) {
        session = resetSession(context);
        if (isText(message) && typeof session.language !== 'string') {
            session.language = detectLanguageFromText(message);  // ✅ détecte immédiatement
        }
        context.session = session;
        console.log('[INIT] Session créée car manquante');
        return true;
    }

    // 🧠 Affectation obligatoire avant traitement
    if (isText(message) && typeof session.language !== 'string') {
        session.language = detectLanguageFromText(message);  // ✅ détecte immédiatement
    }

    context.session = session;

    // ✅ Si déjà initialisée, rien à faire
    if (session.specValues && session.askedSpecs) {
        logSessionState("***[INIT session déjà initialisée]", session);
        //    console.log('[INIT] Session déjà initialisée → aucune action requise');
        return true;
    }

    return true;
}

module.exports = { stepInitializeSession };
