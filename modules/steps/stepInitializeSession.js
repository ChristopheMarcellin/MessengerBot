const { setProjectType, initializeSpecFields, detectLanguageFromText } = require('../utils');
const { getSession, setSession, resetSession, logSessionState } = require('../sessionStore');

async function stepInitializeSession(context) {
    const { senderId, message } = context;

    if (context._hasInitializedOnce) {
        console.warn('[⚠️INIT] Réentrée détectée dans stepInitializeSession — exécution bloquée pour éviter une boucle.');
        return false;
    }
    context._hasInitializedOnce = true;

    // 🔐 Assurer la présence du senderId
    if (typeof senderId !== 'string' || senderId.trim() === '') {
        console.warn('[INIT] senderId manquant → impossible de poursuivre.');
        return true;
    }

    // 🧠 Création d'une session lorsque manquante ou corrompue
    let session = getSession(senderId);
    if (!session || typeof session !== 'object') {
        console.log('[INIT] création d\'une session pcq manquante' );
        session = {};
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
        setProjectType(context.session, "?", "reset after end session"); // 👈 INSERTION ICI
        logSessionState("Vérification APRÈS réparation (post-reset)", senderId);
        return false;
    }
    // 🧼 Normalisation, corrige/reset les variables suspectes ou aux données incomplètes
    session.language ??= detectLanguageFromText(message); // 🌐 Détection automatique de la langue
    session.ProjectDate ??= new Date().toISOString();
    session.questionCount ??= 1;
    session.maxQuestions ??= 40;
    session.askedSpecs ??= {};
    session.specValues ??= {};
    session.currentSpec ??= null;

    // 🔍 Log APRÈS réparation/normalisation
 //   logSessionState("Vérification APRÈS réparation", senderId);

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

    // 🧩 Sécuriser l’observation de projectType via un setter piégé
    if (context?.session) {
        const realSession = context.session;
     //   console.log("[CHECK] Définition du setter projectType dans stepInitializeSession");

        Object.defineProperty(session, 'projectType', {
            configurable: true,
            enumerable: true,
            get() {
                return session._projectType;
            },
            set(value) {
                const err = new Error();
                console.log(`[INIT ALERTE] projectType modifié via setter piégé → ${value}`);
                console.log(`[INIT TRACE] setProjectType ←`, err.stack);
                session._projectType = value;
            }
        });
    }

    return true;
}

module.exports = { stepInitializeSession };
