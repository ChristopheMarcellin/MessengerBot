
const { setProjectType } = require('./utils');
const userSessions = {};

function getSession(senderId) {
    const session = userSessions[senderId];
    return session ? wrapSessionWithLogger(session) : undefined;
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


    setProjectType(freshSession, "?", "resetSession");

    setSession(senderId, freshSession);
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


function wrapSessionWithLogger(session) {
    return new Proxy(session, {
        get(target, prop) {
            if (prop === 'projectType') {
                console.log(`[WATCH-GET] projectType = ${target[prop]} | stack: ${new Error().stack.split('\n')[2].trim()}`);
            }
            return target[prop];
        },
        set(target, prop, value) {
            if (prop === 'projectType') {
                console.log(`[WATCH-SET] projectType = ${value} | old=${target[prop]} | stack: ${new Error().stack.split('\n')[2].trim()}`);
            }
            target[prop] = value;
            return true;
        }
    });
}

module.exports = {
    getSession,
    setSession,
    deleteSession,
    getAllSessions,
    resetSession,
    logSessionState
};
