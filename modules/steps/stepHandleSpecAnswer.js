const { getSession, setSession } = require('../sessionStore');
const { updateSpecFromInput, isValidAnswer } = require('../specEngine');

/**
 * Gère une réponse utilisateur à une question spécifique
 */
async function stepHandleSpecAnswer({ senderId, message }) {
    const session = getSession(senderId);
    if (!session) return true;

    const field = session.currentSpec;
    if (!field) {
        console.log('[HANDLE] Aucun currentSpec défini → rien à traiter');
        return true;
    }

    const value = updateSpecFromInput(field, message);
    if (value === "?") {
        console.log(`[WARN] Réponse invalide pour ${field} → répétition demandée`);
        return false; // réponse invalide → on répétera la question
    }

    // Réponse valide → enregistrement
    session.specValues[field] = value;
    session.askedSpecs[field] = true;
    session.currentSpec = null;

    setSession(senderId, session);
    return true;
}

module.exports = { stepHandleSpecAnswer };
