const { setProjectType, initializeSpecFields, detectLanguageFromText, getNextSpec, isText, isNumeric } = require('../utils');
const { getSession, saveSession, resetSession, logSessionState } = require('../sessionStore');
const { checkSenderInSheets } = require('../googleData')

async function stepInitializeSession(context) {
    const { senderId, message } = context;
    const isEndSession = message.trim().toLowerCase() === 'end session';
    let session;

    // Validate sender Id (protection, unlikely to come through this if)
    if (typeof senderId !== 'string' || senderId.trim() === '') {
        console.warn('[INIT] senderId manquant → impossible de poursuivre.');
        return false;
    }

    // Manage end session call
    if (isEndSession) {

        session = resetSession(context);
        context.session = session;
       // context.session.mode = 'end session';
        // DEBUG VERROU
        console.log('[INIT end session] Session explicitement remise à null.');
        return false;
    }

    // Initialisation normale
    if (!context.session || context.session.senderId !== senderId) {
        // Créer une nouvelle session pour l'utilisateur courant
        session = getSession(senderId);
        if (!session) {
            session = resetSession(context);  // Créer une nouvelle session si elle n'existe pas
            if (isText(message) && !isNumeric(message)) {
                session.language = detectLanguageFromText(message);  // ✅ tentative de détection
            }
            if (!session.language) {
                session.language = "fr";  // 🔒 fallback robuste si rien détecté
            }
            console.log(`[INIT] ***** Session re-créée, langue='${session.language}' pour '${message}'`);
        }
        context.session = session;

        return true;
    } else {
        // Utiliser la session existante si elle correspond à l'utilisateur
        session = context.session;
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


