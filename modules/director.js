const { getNextUnansweredSpec } = require('./specEngine');
const { setProjectType, initializeSpecFields } = require('./utils');
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

async function runDirector(context) {
    const { message, senderId } = context;

    // Étape 0 : Initialisation complète (session nouvelle, invalide ou end session)
    const isReady = await stepInitializeSession(context);
    const session = context.session;

    if (!isReady || !session) {
        console.log('[DIRECTOR] Session non initialisable ou blocage explicite dans l\'initialisation');
        return false;
    }

    console.log(`[DIRECTOR] Analyse en cours du message: "${message}"`);

    // SCÉNARIO 1 : Projet encore inconnu → poser la question
    const noSpecsCommenced = Object.values(session.askedSpecs || {}).every(v => !v);

    if ((session.projectType === undefined || session.projectType === '?') &&
        noSpecsCommenced &&
        session.currentSpec === null) {
        console.log('[DIRECTOR] SCÉNARIO 1 → projectType indéfini ou "?" + specs jamais posées → poser la question projet');
        await stepHandleProjectType(context);
        return true;
    }

    // SCÉNARIO 2 : Une réponse utilisateur vient probablement d’être donnée → valider et traiter
    if (session.currentSpec) {
        console.log(`[DIRECTOR] SCÉNARIO 2 → Réponse reçue pour spec "${session.currentSpec}" → traitement`);
        await stepHandleSpecAnswer(context);
        return true;
    }

    // SCÉNARIO 3 : Il reste des specs à poser
    const nextSpec = getNextUnansweredSpec(session);

    console.log('[DEBUG] specValues =', session.specValues);
    console.log('[DEBUG] askedSpecs =', session.askedSpecs);
    console.log('[DEBUG] currentSpec =', session.currentSpec);
    console.log('[DEBUG] projectType =', session.projectType);
    console.log('[DEBUG] nextSpec =', nextSpec);

    if (['B', 'S', 'R'].includes(session.projectType) &&
        nextSpec &&
        session.currentSpec === null) {
        console.log(`[DIRECTOR] SCÉNARIO 3 → Prochaine spec à poser : "${nextSpec}"`);
        await stepAskNextSpec(context);
        return true;
    }

    // SCÉNARIO 4 : Toutes les specs sont remplies → proposer un résumé
    if (/* condition de résumé à compléter selon ta logique */ false) {
        // console.log('[DIRECTOR] SCÉNARIO 4 → résumé des infos');
        // await stepSummarizeAndConfirm(context);
        // return true;
    }

    // SCÉNARIO 5 : Collecte de contact (à activer plus tard)
    if (/* condition pour collecte contact */ false) {
        // console.log('[DIRECTOR] SCÉNARIO 5 → collecte des infos de contact');
        // await stepCollectContact(context);
        // return true;
    }

    // SCÉNARIO FINAL : Aucune piste → fallback
    console.log('[DIRECTOR] Aucun scénario actif détecté → fallback');
    await stepHandleFallback(context);
    return true;
}

module.exports = { runDirector };
