const { setProjectType, initializeSpecFields, detectLanguageFromText, getNextSpec, isText } = require('../utils');
const { getSession, saveSession, resetSession, logSessionState } = require('../sessionStore');

async function stepInitializeSession(context) {
    const { senderId, message } = context;
    const isEndSession = message.trim().toLowerCase() === 'end session';
    let session;

    // Validate sender Id
    if (typeof senderId !== 'string' || senderId.trim() === '') {
        console.warn('[INIT] senderId manquant → impossible de poursuivre.');
        return false;
    }

    // Manage end session call
    if (isEndSession) {

        session = resetSession(context);
        context.session = session;
        context.session.mode = 'end session';
        // DEBUG VERROU
        console.log('[INIT end session] Session explicitement remise à null.');
        return false;
    }

    // Initialisation normale
    if (context.session && context.session.senderId) {
        session = context.session;
    } else {
        session = getSession(senderId);
    }

    if (!session) {
        session = resetSession(context);
        if (isText(message) && typeof session.language !== 'string') {
            session.language = detectLanguageFromText(message);  // ✅ détecte immédiatement
        }
        context.session = session;
       // session.language = detectLanguageFromText(message); 
        console.log(`[INIT] *** Session re-créée car manquante langue détectée:'${session.language }' pour '${ message}'`);
        return true;
    }

    // 🧠 Affectation obligatoire avant traitement
    if (isText(message) && typeof session.language !== 'string') {
        session.language = detectLanguageFromText(message);  // ✅ détecte immédiatement
        console.log(`[INIT] Langue détectée:'${session.language}' pour '${message}'`);
    }

    context.session = session;

    // ✅ Si déjà initialisée, rien à faire
    if (session.specValues && session.askedSpecs) {
     //   logSessionState("***[INIT session déjà initialisée]", session);
        //    console.log('[INIT] Session déjà initialisée → aucune action requise');
        console.log(`[INIT] *** Session re-créée car manquante langue détectée:'${session.language}' pour '${message}'`);
        return true;
    }

    return true;
}

module.exports = { stepInitializeSession };
