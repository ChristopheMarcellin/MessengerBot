const { getNextUnansweredSpec } = require('./specEngine');
const { stepInitializeSession } = require('./steps/index');
const {
    stepHandleProjectType,
    stepHandleSpecAnswer,
    stepAskNextSpec,
    stepSummarizeAndConfirm,
    stepCollectContact,
    stepHandleFallback
} = require('./steps');

async function runDirector(context) {
    const { message, senderId } = context;

    // Étape 0 : Vérifie ou stabilise la session
    const isReady = await stepInitializeSession(context);
    const session = context.session;

    if (!isReady || !session) {
        console.log('[DIRECTOR] Session non initialisable ou blocage explicite dans l\'initialisation');
        return false;
    }

    console.log(`[DIRECTOR] Analyse en cours du message: "${message}"`);

    // Étape 1 : Projet encore inconnu → poser la question
    const noSpecsCommenced = Object.values(session.askedSpecs || {}).every(v => !v);
    if ((session.projectType === undefined || session.projectType === '?') &&
        noSpecsCommenced &&
        session.currentSpec === null) {
        const handled = await stepHandleProjectType(context);
        if (handled) return true;
    }

    // Étape 2 : Une réponse utilisateur vient probablement d’être donnée
    if (session.currentSpec) {
        const handled = await stepHandleSpecAnswer(context);
        if (handled) return true;
    }

    // Étape 3 : Poser la prochaine spec attendue
    const nextSpec = getNextUnansweredSpec(session);
    console.log('[DEBUG] specValues =', session.specValues);
    console.log('[DEBUG] askedSpecs =', session.askedSpecs);
    console.log('[DEBUG] currentSpec =', session.currentSpec);
    console.log('[DEBUG] projectType =', session.projectType);
    console.log('[DEBUG] nextSpec =', nextSpec);

    if (['B', 'S', 'R'].includes(session.projectType) &&
        nextSpec &&
        session.currentSpec === null) {
        const handled = await stepAskNextSpec(context);
        if (handled) return true;
    }

    // Étape 4 : Résumé (à activer quand conditions sont prêtes)
    // if (Object.keys(session.specValues || {}).length >= 3) {
    //     const handled = await stepSummarizeAndConfirm(context);
    //     if (handled) return true;
    // }

    // Étape 5 : Collecte contact (futur)
    // const handled = await stepCollectContact(context);
    // if (handled) return true;

    // Étape finale : Aucun scénario n’a géré le message
    console.log('[DIRECTOR] Aucun scénario actif détecté → fallback');
    await stepHandleFallback(context);
    return true;
}

module.exports = { runDirector };
