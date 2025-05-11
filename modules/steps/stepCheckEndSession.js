const {
    resetSession,
    setSession,
    getSession,
    logSessionState
} = require('../sessionStore');

function stepCheckEndSession({ senderId, message }) {
    console.log(`[STEP] stepCheckEndSession triggered for user: ${senderId}`);

    if (typeof message !== 'string') return true;

    const trimmedMessage = message.trim().toLowerCase();

    if (trimmedMessage.includes('end session')) {
        console.log(`[END] Session reset triggered by user: ${senderId}`);

        const existingSession = getSession(senderId);
        if (existingSession) {
            console.log(`--- BEFORE RESET ---`);
            logSessionState(senderId);
        }

        resetSession(senderId);
        setSession(senderId, {
            projectType: undefined,
            specValues: {},
            questionCount: 0,
            lang: undefined
        });

        console.log(`--- AFTER RESET ---`);
        logSessionState(senderId);

        return false;
    }

    return true;
}

module.exports = { stepCheckEndSession };
