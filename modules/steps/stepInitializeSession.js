const { setProjectType, initializeSpecFields } = require('../utils');
const { getSession, setSession } = require('../sessionStore');

// 🔎 Fonction d'audit de la session
function logSessionState(label, session) {
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
    console.log(`[INIT] ${label} :`, JSON.stringify(snapshot, null, 2));
}

async function stepInitializeSession(context) {
    const { senderId, message } = context;

    // 🔐 Vérifier présence du senderId
    if (typeof senderId !== 'string' || senderId.trim() === '') {
        console.warn('[INIT] senderId manquant → impossible de poursuivre.');
        return true;
    }

    // 🧠 Session existante ou création vide
    let session = getSession(senderId);
    if (!session || typeof session !== 'object') {
        console.log('[INIT] Aucune session trouvée dans le store → nouvelle session créée');
        session = {};
    } else {
        console.log('[INIT] Session existante trouvée dans le store');
    }

    // 🔍 Log AVANT réparation
    logSessionState("Vérification AVANT réparation", session);

    // 🔧 Réparation
    const isEndSession = message.trim().toLowerCase() === 'end session';
    if (isEndSession) {
        console.log('[INIT] "end session" détecté → session réinitialisée à neuf');
        session = {
            language: 'fr',
            ProjectDate: new Date().toISOString(),
            questionCount: 0,
            maxQuestions: 40,
            askedSpecs: {},
            specValues: {},
            projectType: undefined,
            currentSpec: null
        };
        setSession(senderId, session);
        context.session = session;

        logSessionState("Vérification APRÈS réparation (post-reset)", session);
        return true;
    }

    // 🧼 Normalisation minimale
    session.language ??= 'fr';
    session.ProjectDate ??= new Date().toISOString();
    session.questionCount ??= 1;
    session.maxQuestions ??= 40;
    session.askedSpecs ??= {};
    session.specValues ??= {};
    session.currentSpec ??= null;

    // 🔍 Log APRÈS réparation
    logSessionState("Vérification APRÈS réparation", session);

    // 🎯 Analyse état session existante
    const hasProject = typeof session.projectType === 'string' && ['B', 'S', 'R'].includes(session.projectType);
    const hasAskedSpecs = Object.values(session.askedSpecs).some(v => v === true);

    if (hasProject && hasAskedSpecs) {
        console.log('[INIT] Session en cours détectée → reprise possible');
        setSession(senderId, session);
        context.session = session;
        return true;
    }

    if (hasProject && !hasAskedSpecs) {
        console.log('[INIT] ProjectType connu mais specs non commencées → prêt à commencer');
        setSession(senderId, session);
        context.session = session;
        return true;
    }

    // 📌 Aucune classification ici — laissé au directeur
    setSession(senderId, session);
    context.session = session;

    if (context?.session) {
        const realSession = context.session;
        let internalValue = realSession.projectType;
        console.log("[CHECK] Définition du setter projectType dans stepInitializeSession");

        Object.defineProperty(session, 'projectType', {
            configurable: true,
            enumerable: true,
            get() {
                return session._projectType;
            },
            set(value) {
                const err = new Error();
                console.log(`[ALERTE] projectType modifié via setter piégé → ${value}`);
                console.log(`[TRACE] setProjectType ←`, err.stack);
                session._projectType = value;
            }

        })
    };

    return true;
}

module.exports = { stepInitializeSession };
