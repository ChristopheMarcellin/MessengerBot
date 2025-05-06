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


module.exports = {
    getSession,
    setSession,
    deleteSession,
    getAllSessions,
    logSessionState
};
