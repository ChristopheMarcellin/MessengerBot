const { setSpecValue, setAskedSpec } = require('../utils');
const { saveSession } = require('../sessionStore');

// Traite une réponse utilisateur pour une spec donnée, déjà jugée valide ou non
async function stepHandleSpecAnswer(context, spec, isValid) {
    const { session, message } = context;

    //passer au mode chat
    if (!spec || spec === "null") {
        // 🔁 Laisser passer si on est en mode libre (chat)
        if (session?.mode === "chat") {
            console.log(`[Handle Answer] Spec "null" ignorée car en mode chat.`);
            return true;  // autoriser le traitement libre
        }

        console.warn(`[sHSA BLOCKED] Réception d'une spec invalide: "${spec}" — message ignoré.`);
        return false;
    }

    //enregistrer la valeur de la spec si la réponse est valide

    if (isValid) {
        setSpecValue(session, spec, message, "[stepHandleSpecAnswer] setSpecValue answer is valid" );
        setAskedSpec(context.session, spec, `[stepHandleSpecAnswer] setAskedSpec = true an the answer is valid`);
        saveSession(context);
        return true;
    }
    //réponse invalide
    const alreadyAsked = session.askedSpecs[spec];
    const current = session.specValues[spec];
    const protectedValues = ["E", 0];
   // console.log(`[DIRECTOR !isValid] nextSpec: "${spec}" alreadyAsked = "${alreadyAsked}"`);
    //si la spec en cours ne vaut ni "E" ni 0
    if (!protectedValues.includes(current)) {
     //   if (alreadyAsked && current === "?") {
        if (current === "?"&& alreadyAsked===true) {
            setSpecValue(session, spec, "E", "passé à E après une 2e tentatives");
            setAskedSpec(context.session, spec, `[stepHandleSpecAnswer] setAskedSpec = true for the 2nd time but answer is inValid`);
            console.log(`[stepHandleSpecAnswer current: "${current}" passé à "E" après deux tentatives`);
        } else {
            setSpecValue(session, spec, "?", "runDirector/invalid");
            setAskedSpec(context.session, spec, `[stepHandleSpecAnswer] setAskedSpec = true for the 1st time but answer is inValid`)
        }
    }
     context.deferSpec = true;
    context.gptAllowed = true;
    saveSession(context);
    return true;
}

module.exports = stepHandleSpecAnswer;
