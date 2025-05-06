const {
    deleteSession,
    setSession,
    logSessionState
} = require('../sessionStore');

function stepCheckEndSession({ senderId, message }) {
    // Sécurité minimale : vérifier que le message est bien une chaîne
    if (typeof message !== 'string') return true;

    const trimmedMessage = message.trim().toLowerCase();

    if (trimmedMessage.includes('end session')) {
        console.log(`[END] Session reset triggered by user: ${senderId}`);

        // Log AVANT réinitialisation
        console.log(`--- BEFORE RESET ---`);
        logSessionState(senderId);

        // Suppression de l’ancienne session
        deleteSession(senderId);

        // Réinitialisation propre avec valeurs par défaut
        setSession(senderId, {
            projectType: undefined,
            specValues: {},
            questionCount: 0,
            lang: undefined
        });

        // Log APRÈS réinitialisation
        console.log(`--- AFTER RESET ---`);
        logSessionState(senderId);

        // Stopper toute autre étape
        return false;
    }

    return true; // Continuer le flow normalement
}

module.exports = { stepCheckEndSession };
