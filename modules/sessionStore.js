
const { setProjectType } = require('./utils');
const userSessions = {};

function getSession(senderId) {
    const session = userSessions[senderId];
    return userSessions[senderId] || undefined;
   // return session ? wrapSessionWithLogger(session) : undefined;
}

//function setSession(senderId, sessionData) {
//// //remplacée par saveSession
//}

function saveSession(context) {
    userSessions[context.senderId] = context.session;
}

function deleteSession(senderId) {
    delete userSessions[senderId];
}

function getAllSessions() {
    return userSessions;
}

// ✅ Fusion : reset enrichi sans effet de bord
function resetSession(context) {
    const freshSession = {
        senderId : context.senderId,
        language: null,
        projectType: "?",
        specValues: {},
        askedSpecs: {},
        currentSpec: null,
        lastPayload: null,
        lastUserMessage: null,
        lastBotMessage: null,
        questionCount: 0,
        maxQuestions: 40,
        ProjectDate: new Date().toISOString(),
        mode: "spec"
    };


    setProjectType(freshSession, "?", "resetSession");

    console.log(`[RESET] Nouvelle session propre créée pour ${context.senderId}`);
    return freshSession;
}

// ✅ Log centralisé, appelé depuis stepInitializeSession ou autre

function logSessionState(label, session) {

    senderId: (typeof session.senderId === 'string' && session.senderId.trim() !== '') ? session.senderId : 'unknown_sender';

    if (!session) {
        console.warn(`[SESSION State] Session absente pour ${senderId} → rien à afficher.`);
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
        propertyUsage: session.propertyUsage,
        currentSpec: session.currentSpec
    };

     console.log(`${label} [${senderId}] :`, JSON.stringify(snapshot, null, 2));

    // 🔍 Ajout des lignes déplacées ici, pour interprétation de l’état
    const hasProject = typeof session.projectType === 'string' && ['B', 'S', 'R'].includes(session.projectType);
    const hasAskedSpecs = session.askedSpecs && Object.values(session.askedSpecs).some(v => v === true);

    if (hasProject && hasAskedSpecs) {
        console.log(`[SESSION State] ${label} : Session en cours prête à poursuivre une conversation`);
    } else if (hasProject && !hasAskedSpecs) {
        console.log(`[SESSION State] ${label} : ProjectType connu mais les specs sont à initialiser`);
    } else {
        console.log(`[SESSION State] ${label} : ProjectType non défini — classification déléguée au directeur`);
    }
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
    saveSession,
    deleteSession,
    getAllSessions,
    resetSession,
    logSessionState
 
};
