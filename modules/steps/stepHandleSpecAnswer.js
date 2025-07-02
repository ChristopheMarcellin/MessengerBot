const { setSpecValue } = require('../utils');
const { chatOnly } = require('../utils');
const { saveSession } = require('../sessionStore');
const { stepWhatNext } = require('./stepWhatNext');

// Traite une réponse utilisateur pour une spec donnée, déjà jugée invalide
async function stepHandleSpecAnswer(context, spec, isValid) {
    const { session, senderId, message } = context;

    if (isValid) {
        setSpecValue(session, spec, message, "runDirector/valid");
        saveSession(context);
        const continued = await stepWhatNext(context, spec);

        if (!continued) {
            context.gptAllowed = true;
            await chatOnly(senderId, message, session.language || "fr");
            console.log('[DIRECTOR] Fin : fin de parcours après stepWhatNext');
        } else {
            console.log('[DIRECTOR] Fin : réponse valide traitée normalement');
        }

        return true;
    }

    const alreadyAsked = session.askedSpecs[spec] === true;
    const current = session.specValues[spec];
    const protectedValues = ["E", 0];

    if (!protectedValues.includes(current)) {
        if (alreadyAsked && current === "?") {
            setSpecValue(session, spec, "E", "passé à E après 2 tentatives");
            console.log(`[DIRECTOR !isValid] nextSpec: "${spec}" passé à "E" après deux tentatives`);
        } else {
            setSpecValue(session, spec, "?", "runDirector/invalid");
        }
    }

    context.deferSpec = true;
    context.gptAllowed = true;
    saveSession(context);
    await chatOnly(senderId, message, session.language || "fr");
    await stepWhatNext(context, spec);
    console.log('[DIRECTOR !isValid] Fin : réponse invalide, relance via GPT + stepWhatNext');
    return true;
}

module.exports = { stepHandleSpecAnswer };
