const { getNextUnansweredSpec } = require('./specEngine');
const { initializeSpecFields, setProjectType } = require('./utils');
const { sendMessage } = require('./messenger');

const {
    stepCheckEndSession,
    stepHandleUserQuestions,
    stepHandleProjectType,
    stepHandleSpecAnswer,
    stepAskNextSpec,
    stepSummarizeAndConfirm,
    stepCollectContact,
    stepHandleFallback
} = require('./steps');
const { stepInitializeSession } = require('./steps/index');

// Fonction principale du directeur
async function runDirector(context) {
    const { message, senderId, session } = context;

    // 🔎 Si session absente, vide, ou incomplète → réinitialisation automatique
    const sessionIsMissing = !session;
    const sessionIsEmpty = session && Object.keys(session).length === 0;
    const sessionIsCorrupted = !session?.projectType || !session?.specValues;

    if (sessionIsMissing || sessionIsEmpty || sessionIsCorrupted) {
        console.log('[DIRECTOR] Session absente ou corrompue → initialisation automatique.');

        if (!session) {
            console.warn('[DIRECTOR] ERREUR: session est undefined → impossible de corriger');
            return false;
        }

        initializeSpecFields(session);
        setProjectType(session, "?");

        await sendMessage(senderId, "Quel est le but de votre projet ? (1-acheter, 2-vendre, 3-louer, 4-autre)");
        return true;
    }

    console.log(`[DIRECTOR] Analyse en cours du message: "${message}"`);

    // SCÉNARIO 1 : Requête explicite de fin de session
    if (message && typeof message === 'string' && message.trim().toLowerCase() === 'end session') {
        console.log('[DIRECTOR] SCÉNARIO 1 → end session détecté, session à rebâtir');
        session.lastUserMessage = null;
        await stepInitializeSession(context);
        return true;
    }

    // SCÉNARIO 2 : Il est temps de détecter l’intention
    const noSpecsCommenced = Object.values(session.askedSpecs || {}).every(v => !v);

    if ((session.projectType === undefined || session.projectType === '?') &&
        noSpecsCommenced &&
        session.currentSpec === null) {
        console.log('[DIRECTOR] SCÉNARIO 2 → projectType indéfini ou "?" + specs jamais posées + aucune question en cours → poser la question projet');
        await stepHandleProjectType(context); // <- ici le step clé
        return true;
    }

    const nextSpec = getNextUnansweredSpec(session);

    console.log('[DEBUG] specValues =', session.specValues);
    console.log('[DEBUG] askedSpecs =', session.askedSpecs);
    console.log('[DEBUG] currentSpec =', session.currentSpec);
    console.log('[DEBUG] projectType =', session.projectType);
    console.log('[DEBUG] nextSpec =', nextSpec);

    // SCÉNARIO 3 : Intention connue, on cherche la prochaine spec
    if (['B', 'S', 'R'].includes(session.projectType) &&
        nextSpec &&
        session.currentSpec === null) {
        console.log(`[DIRECTOR] SCÉNARIO 3 → Prochaine question spec à poser : "${nextSpec}"`);
        return true;
    }

    console.log('[DIRECTOR] Aucun scénario détecté');
    return false;
}

module.exports = { runDirector };
