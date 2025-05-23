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

// ✅ Fusion : reset enrichi sans effet de bord
function resetSession(senderId) {
    const freshSession = {
        senderId,
        language: 'fr',
        projectType: "?",
        specValues: {},
        askedSpecs: {},
        currentSpec: null,
        lastPayload: null,
        lastUserMessage: null,
        lastBotMessage: null,
        questionCount: 0,
        maxQuestions: 40,
        ProjectDate: new Date().toISOString()
    };

    console.log(`[RESET] Nouvelle session propre créée pour ${senderId}`);
    return freshSession;
}

// ✅ Log centralisé, appelé depuis stepInitializeSession ou autre
function logSessionState(label, senderId) {
    const session = userSessions[senderId];
    if (!session) {
        console.warn(`[SESSION] Session absente pour ${senderId} → rien à afficher.`);
        return;
    }
    const snapshot = {
        language: session.language,
        ProjectDate: session.ProjectDate,
        questionCount: session.questionCount,
        maxQuestions: session.maxQuestions,
        askedSpecs: session.askedSpecs,
        specValues: session.specValues,
        projectType: session.projectType,
        currentSpec: session.currentSpec
    };
  //  console.log(`[SESSION] ${label} [${senderId}] :`, JSON.stringify(snapshot, null, 2));
}

module.exports = {
    getSession,
    setSession,
    deleteSession,
    getAllSessions,
    resetSession,
    logSessionState
};
