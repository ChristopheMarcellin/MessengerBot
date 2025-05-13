const { getNextSpec } = require('./utils');
const { isValidAnswer } = require('./specEngine');
const { setProjectType, initializeSpecFields, setSpecValue } = require('./utils');
const { stepInitializeSession } = require('./steps/index');
const { stepHandleFallback } = require('./steps');
const { stepWhatNext } = require('./steps');

async function runDirector(context) {
    const { message, senderId } = context;

    const isReady = await stepInitializeSession(context);
    const session = context.session;

    if (!isReady || !session) {
        console.log('[DIRECTOR] Session non initialisable ou blocage explicite dans l\'initialisation');
        return false;
    }

    if (context.cleanText === 'end session') {
        const { resetSession, setSession } = require('./sessionStore');
        const newSession = resetSession(senderId);
        setSession(senderId, newSession);
        context.session = newSession;
        console.log('[DIRECTOR] Session réinitialisée suite à "end session" (dans runDirector)');
        return true;
    }

    if (message === "4") {
        const ts = new Date(context.timestamp).toISOString();
        console.warn(`[${ts}] [ALERTE] Le message reçu est "4" → analysé comme input utilisateur`);
    }

    console.log(`[DIRECTOR] Analyse en cours du message: "${message}"`);

    const nextSpec = getNextSpec(session.projectType, session.specValues, session.askedSpecs);
    console.log('[DEBUG] nextSpec =', nextSpec);

    if (nextSpec === "none") {
        console.log('[DIRECTOR] Type de projet = E → aucun traitement structuré.');
        return false;
    }

    if (nextSpec === "summary") {
        console.log('[DIRECTOR] Toutes les specs sont couvertes → prêt pour résumé');
        return false;
    }

    if (session.askedSpecs[nextSpec] === true && session.specValues[nextSpec] === "?") {
        setSpecValue(session, nextSpec, "E");
        console.log(`[DIRECTOR] "${nextSpec}" → passage de "?" à "E" après relance unique`);
    }

    const isValid = isValidAnswer(message, session.projectType, nextSpec);

    if (!isValid) {
        console.log(`[DIRECTOR] Réponse invalide pour "${nextSpec}" → réponse libre + reprise de question`);

        session.askedSpecs[nextSpec] = true;

        // 🛡️ Ne jamais déclencher GPT si projectType est déjà B, S ou R
        if (nextSpec === "projectType" && ["B", "S", "R"].includes(session.projectType)) {
            console.warn('[SKIP] Fallback ignoré : projectType déjà défini.');
            await stepWhatNext(context);
            return true;
        }

        if (nextSpec === "projectType") {
            setProjectType(session, "?", "user input");
        } else {
            setSpecValue(session, nextSpec, "?");
        }

        context.deferSpec = true;
        context.gptAllowed = true;
        context.gptMode = (nextSpec === "projectType") ? "classifyOrChat" : "chatOnly";

        await stepHandleFallback(context);
        await stepWhatNext(context);
        return true;
    }

    console.log(`[DIRECTOR] Réponse valide pour "${nextSpec}" = "${message}"`);

    if (nextSpec === "projectType") {
        const map = { "1": "B", "2": "S", "3": "R", "4": "?" };
        const interpreted = map[message.trim()] || "?";
        setProjectType(session, interpreted, "user input");

        if (["B", "S", "R"].includes(interpreted)) {
            initializeSpecFields(session);
        }
    } else {
        setSpecValue(session, nextSpec, message);
        session.askedSpecs[nextSpec] = true;
    }

    const continued = await stepWhatNext(context);
    if (!continued) {
        console.log('[DIRECTOR] Aucun mouvement supplémentaire possible (whatNext)');
    }

    return true;
}

module.exports = { runDirector };
