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

module.exports = {
    getSession,
    setSession,
    deleteSession,
    getAllSessions
};
