
const { isValidAnswer, getProjectTypeFromNumber } = require('./specEngine');
const { setProjectType, initializeSpecFields, setSpecValue, gptClassifyProject,
        chatOnly, getNextSpec, detectLanguageFromText } = require('./utils'); // ajout ici
const { stepInitializeSession } = require('./steps/index');
const { stepHandleFallback } = require('./steps');
const { stepWhatNext } = require('./steps');

async function runDirector(context) {
    const { message, senderId } = context;

    // 1 - *****************************Initialisation de la session**********************************
    const isReady = await stepInitializeSession(context);
    const session = context.session;

    // 🔍 Détection d'un blocage à l'initialisation
    if (!isReady || !session) {
        console.log('[DIRECTOR] Session non initialisable ou blocage explicite dans l\'initialisation');
        return false;
    }


    console.log(`[DIRECTOR] Taitement du message reçu: "${message}"`);

    const nextSpec = getNextSpec(session.projectType, session.specValues, session.askedSpecs);
    console.log('[DIRECTOR] Identification de la nextSpec à traiter =', nextSpec);

    // On fait évoluer le statut de la spec vers E
    if (session.askedSpecs[nextSpec] === true && session.specValues[nextSpec] === "?") {
        setSpecValue(session, nextSpec, "E");
        console.log(`[DIRECTOR] "${nextSpec}" → est passé de "?" à "E" `);
    }

    const isValid = isValidAnswer(message, session.projectType, nextSpec);

    if (!isValid) {
        console.log(`[DIRECTOR] La réponse fournie pour la spec "${nextSpec}" ne peut être validée `);
        session.askedSpecs[nextSpec] = true;

        if (nextSpec === "projectType") {
            const interpreted = await gptClassifyProject(message, session.language || "fr");
            console.log(`[DIRECTOR] GPT s'est chargé de traiter et d'interpréter votre msg : ${interpreted}`);

            const isValidGPT = isValidAnswer(interpreted, session.projectType, "projectType");

            if (isValidGPT) {
                setProjectType(session, interpreted, "GPT → valide");
                initializeSpecFields(session);
            } else {
                setProjectType(session, "?", "GPT → invalide");
            }

            await stepWhatNext(context);
            return true;
        }

        // Toutes les autres specs non valides
        setSpecValue(session, nextSpec, "?");

        context.deferSpec = true;
        context.gptAllowed = true;
        await chatOnly(senderId, message, session.language || "fr");
        await stepWhatNext(context);
        return true;
    }



    console.log(`[DIRECTOR] Réponse jugée valide pour "${nextSpec}" = "${message}"`);

    if (nextSpec === "projectType") {
        const interpreted = getProjectTypeFromNumber(message);
        session.askedSpecs.projectType = true;
        setProjectType(session, interpreted, "user input");


        if (["B", "S", "R"].includes(interpreted)) {
            initializeSpecFields(session);
        }
    } else {
        setSpecValue(session, nextSpec, message);

    }

    const continued = await stepWhatNext(context);
    if (!continued) {
        console.log('[DIRECTOR] Aucun mouvement supplémentaire possible (whatNext) → passage en mode chatOnly');
        context.gptAllowed = true;
        await chatOnly(senderId, message, session.language || "fr");
        return true;
    }


    return true;
}

module.exports = { runDirector };






