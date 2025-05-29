const { setProjectType, initializeSpecFields, detectLanguageFromText } = require('../utils');
const { getSession, setSession, resetSession, logSessionState } = require('../sessionStore');

async function stepInitializeSession(context) {
    const { senderId, message } = context;
    const existingSession = getSession(senderId);

    // 🛡 Protection : session déjà initialisée
    if (existingSession?.specValues && existingSession?.askedSpecs) {
        context.session = existingSession;
        console.log('[INIT] Session déjà initialisée → aucune action requise');
        return true;
    }

    // 🔐 Assurer la présence du senderId
    if (typeof senderId !== 'string' || senderId.trim() === '') {
        console.warn('[INIT] senderId manquant → impossible de poursuivre.');
        return false;
    }

    // 🧠 Création d'une session lorsque manquante ou corrompue
    context.session = getSession(senderId);
    if (!context.session || typeof context.session !== 'object') {
        console.log('[INIT] création d\'une session pcq manquante');
        context.session = {};
    }
    else {
        //    console.log('[INIT] Session existante trouvée dans le store');
    }

    // 🔍 Log AVANT réparation
    // logSessionState("Vérification AVANT réparation", senderId);

    // 🔧 Affecter les variables minimales suivant un End Session
    const isEndSession = message.trim().toLowerCase() === 'end session';
    if (isEndSession) {
        const newSession = resetSession(senderId);
        newSession.specValues = {};
        newSession.askedSpecs = {};
        setSession(senderId, newSession);
        context.session = newSession;
        console.log('[INIT] "end session" détecté → session réinitialisée à neuf');
        setProjectType(context.session, "?", "reset after end session");

        console.log(`[TEST] context.session.projectType = ${context.session?.projectType} (via newSession assigné)`);
        console.log(`[TEST] getSession(senderId).projectType = ${getSession(senderId)?.projectType} (comparaison mémoire)`);

        logSessionState("Vérification APRÈS réparation (post-reset)", senderId);
        return true;
    }

    // 🧼 Normalisation, corrige/reset les variables suspectes ou aux données incomplètes **** NE JAMAIS TRAITER PROJECT TYPE DE LA SESSION QUI BRISERAIT LE ROLE DE SETPROJECTTYPE
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
        console.log('[INIT] Session en cours détectée → reprise possible');
        setSession(senderId, context.session);
        return true;
    }

    if (hasProject && !hasAskedSpecs) {
        console.log('[INIT] ProjectType connu mais specs non commencées → prêt à commencer');
        setSession(senderId, context.session);
        return true;
    }

    // 📌 Aucune classification ici — laissé au directeur
    setSession(senderId, context.session);

    // 🧩 Sécuriser l’observation de projectType via un setter piégé
    if (context?.session) {
        const realSession = context.session;
        // console.log("[CHECK] Définition du setter projectType dans stepInitializeSession");
    }

    return true;
}

module.exports = { stepInitializeSession };
