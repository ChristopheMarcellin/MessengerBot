const { getNextSpec } = require('./utils');
const { isValidAnswer } = require('./specEngine');
const { setProjectType, initializeSpecFields } = require('./utils');
const { stepInitializeSession } = require('./steps/index');
const { stepHandleFallback } = require('./steps');
const { stepWhatNext } = require('./steps');
async function runDirector(context) {
    const { message, senderId } = context;

    // Étape 0 : Initialisation ou restauration de session
    const isReady = await stepInitializeSession(context);
    const session = context.session;

    if (!isReady || !session) {
        console.log('[DIRECTOR] Session non initialisable ou blocage explicite dans l\'initialisation');
        return false;
    }

    console.log(`[DIRECTOR] Analyse en cours du message: "${message}"`);

    // Étape 1 : Déterminer la spec à laquelle on s’attend
    const nextSpec = getNextSpec(session.projectType, session.specValues, session.askedSpecs);
    console.log('[DEBUG] nextSpec =', nextSpec);

    if (nextSpec === "none") {
        console.log('[DIRECTOR] Type de projet = E → aucun traitement structuré.');
        return false;
    }

    if (nextSpec === "summary") {
        console.log('[DIRECTOR] Toutes les specs sont couvertes → prêt pour résumé');
        // future: appeler stepSummarizeAndConfirm(context)
        return false;
    }

    const isValid = isValidAnswer(message, session.projectType, nextSpec);

    if (!isValid) {
        console.log(`[DIRECTOR] Réponse invalide pour "${nextSpec}" → fallback`);
        context.deferSpec = true;
        context.gptAllowed = true;
        await stepHandleFallback(context);
        return true;
    }

    // Étape 2 : Réponse valide → enregistrer la valeur
    console.log(`[DIRECTOR] Réponse valide pour "${nextSpec}" = "${message}"`);

    if (nextSpec === "projectType") {
        const map = { "1": "B", "2": "S", "3": "R", "4": "E" };
        const interpreted = map[message.trim()] || "?";
        setProjectType(session, interpreted, "user input");
        if (["B", "S", "R"].includes(interpreted)) {
            initializeSpecFields(session);
        }
    } else {
        session.specValues[nextSpec] = message;
        session.askedSpecs[nextSpec] = true;
    }

    const continued = await require('./steps/stepWhatNext').stepWhatNext(context);

    if (!continued) {
        console.log('[DIRECTOR] Aucun mouvement supplémentaire possible (whatNext)');
    }


    return true;
}

module.exports = { runDirector };
