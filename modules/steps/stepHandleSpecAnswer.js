const { setSpecValue } = require('../utils');
const { saveSession } = require('../sessionStore');

// Traite une réponse utilisateur pour une spec donnée, déjà jugée valide ou non
async function stepHandleSpecAnswer(context, spec, isValid) {
    const { session, message } = context;

    if (!spec || spec === "null") {
        // 🔁 Laisser passer si on est en mode libre (chat)
        if (session?.mode === "chat") {
            console.log(`[INFO] Spec "null" ignorée car en mode chat.`);
            return true;  // autoriser le traitement libre
        }

        console.warn(`[sHSA BLOCKED] Réception d'une spec invalide: "${spec}" — message ignoré.`);
        return false;
    }

    if (isValid) {
        setSpecValue(session, spec, message, "runDirector/valid");
        saveSession(context);
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
    return true;
}

module.exports = stepHandleSpecAnswer;
