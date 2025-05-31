const { setProjectType, initializeSpecFields, detectLanguageFromText } = require('../utils');
const { getSession, setSession, resetSession, logSessionState } = require('../sessionStore');

async function stepInitializeSession(context) {
    const { senderId, message } = context;

    // 🔧 Traitement prioritaire du End Session même si session absente
    const isEndSession = message.trim().toLowerCase() === 'end session';
    if (isEndSession) {
        const newSession = resetSession(senderId);
        newSession.specValues = {};
        newSession.askedSpecs = {};
        setSession(senderId, newSession);
        context.session = newSession;
        console.log('[INIT] "end session" détecté → session réinitialisée à neuf');
        setProjectType(context.session, "?", "reset after end session");
        logSessionState("Vérification APRÈS réparation (post-reset)", senderId);
        return true;
    }

    const session = getSession(senderId);

    // 🛡 Protection : session déjà initialisée
    if (session?.specValues && session?.askedSpecs) {
        context.session = session;
        console.log('[INIT] Session déjà initialisée → aucune action requise');
        return true;
    }

    // 🔐 Assurer la présence du senderId
    if (typeof senderId !== 'string' || senderId.trim() === '') {
        console.warn('[INIT] senderId manquant → impossible de poursuivre.');
        return false;
    }

    // 🧠 Création d'une session lorsque manquante ou corrompue
    context.session = session;
    if (!context.session || typeof context.session !== 'object') {
        console.log('[INIT] ALERTE session manquante problèmes en vue');
        return false;
    }

    // 🔍 Log AVANT réparation
    // logSessionState("Vérification AVANT réparation", senderId);

    // 🧼 Normalisation, corrige/reset les variables suspectes ou aux données incomplètes 
    //**** NE JAMAIS configurer le PROJECT TYPE DE LA SESSION QUI BRISERAIT LE SETPROJECTTYPE effectué dans une autre étape
    context.session.language ??= detectLanguageFromText(message); // 🌐 Détection automatique de la langue
    context.session.ProjectDate ??= new Date().toISOString();
    context.session.questionCount ??= 1;
    context.session.maxQuestions ??= 40;
    context.session.askedSpecs ??= {};
    context.session.specValues ??= {};
    context.session.currentSpec ??= null;

    // 🔍 Log APRÈS réparation/normalisation
    // logSessionState("Vérification APRÈS réparation", senderId);

    // 🎯 Analyse état session existante
    const hasProject = typeof context.session.projectType === 'string' && ['B', 'S', 'R'].includes(context.session.projectType);
    const hasAskedSpecs = Object.values(context.session.askedSpecs).some(v => v === true);

    if (hasProject && hasAskedSpecs) {
        console.log('[INIT] Session en cours pret à poursuivre une conversation');
    } else if (hasProject && !hasAskedSpecs) {
        console.log('[INIT] ProjectType connu mais les specs sont à initialiser');
    } else {
        console.log('[INIT] ProjectType non définit — classification déléguée au directeur');
    }

    // 📌 Aucune classification ici — laissé au directeur
    setSession(senderId, context.session);
    return true;
}

module.exports = { stepInitializeSession };
