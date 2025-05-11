const userSessions = {};

function getSession(senderId) {
    return userSessions[senderId];
}

function setSession(senderId, sessionData) {
    userSessions[senderId] = sessionData;
}

function deleteSession(senderId) {
    delete userSessions[senderId];
}

function getAllSessions() {
    return userSessions;
}


function logSessionState(senderId) {
    const session = userSessions[senderId];
    console.log(`[DEBUG] Session state for ${senderId}:\n`, JSON.stringify(session, null, 2));
}

function resetSession(senderId) {
    const freshSession = {
        projectType: "?",
        specValues: {},
        askedSpecs: {},
        currentSpec: null,
        lastPayload: null,
        lastUserMessage: null,
        lastBotMessage: null,
        questionCount: 0,
        maxQuestions: 40,
        language: 'fr',
        ProjectDate: new Date().toISOString()
    };

    userSessions[senderId] = freshSession;
    console.log(`[RESET] Nouvelle session propre créée pour ${senderId}`);
    return freshSession;
}

module.exports = {
    getSession,
    setSession,
    deleteSession,
    getAllSessions,
    logSessionState,
    resetSession
};
