const { getSession } = require('./sessionStore');
const { getNextUnansweredSpec } = require('./specEngine');

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

    // SCÉNARIO 1 : Requête explicite de fin de session
    if (message && typeof message === 'string' && message.trim().toLowerCase() === 'end session') {
      
        console.log('[DIRECTOR] SCÉNARIO 1 → end session détecté, session à rebâtir');
        await stepInitializeSession(context);
        return true;
    }

    // SCÉNARIO 2 : Il est temps de détecter l’intention
    const noSpecsCommenced = Object.values(session.askedSpecs || {}).every(v => !v);

    if ((session.projectType === undefined || session.projectType === '?') &&
        noSpecsCommenced &&
        session.currentSpec === null) {
        console.log('[DIRECTOR] SCÉNARIO 2 → projectType indéfini ou "?" + specs jamais posées + aucune question en cours → poser la question projet');
        return true;
    }

    // 
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
