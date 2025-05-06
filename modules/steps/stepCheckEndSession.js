const {
    deleteSession,
    setSession,
    logSessionState
} = require('../sessionStore');

function stepCheckEndSession({ senderId, message }) {
    // S�curit� minimale : v�rifier que le message est bien une cha�ne
    if (typeof message !== 'string') return true;

    const trimmedMessage = message.trim().toLowerCase();

    if (trimmedMessage.includes('end session')) {
        console.log(`[END] Session reset triggered by user: ${senderId}`);

        // Log AVANT r�initialisation
        console.log(`--- BEFORE RESET ---`);
        logSessionState(senderId);

        // Suppression de l�ancienne session
        deleteSession(senderId);

        // R�initialisation propre avec valeurs par d�faut
        setSession(senderId, {
            projectType: undefined,
            specValues: {},
            questionCount: 0,
            lang: undefined
        });

        // Log APR�S r�initialisation
        console.log(`--- AFTER RESET ---`);
        logSessionState(senderId);

        // Stopper toute autre �tape
        return false;
    }

    return true; // Continuer le flow normalement
}

module.exports = { stepCheckEndSession };
