
const { isValidAnswer } = require('./specEngine');
const { setProjectType, initializeSpecFields, setSpecValue, gptClassifyProject,
        chatOnly, getNextSpec, detectLanguageFromText } = require('./utils'); // ajout ici
const { stepInitializeSession } = require('./steps/index');
const { stepHandleFallback } = require('./steps');
const { stepWhatNext } = require('./steps');

async function runDirector(context) {
    const { message, senderId } = context;

    // 🔁 End Session
    if (context.cleanText === 'end session') {
        const { resetSession, setSession } = require('./sessionStore');
        const newSession = resetSession(senderId);
        setSession(senderId, newSession);
        context.session = newSession;
        console.log('[DIRECTOR] Session réinitialisée suite à "end session" en attente du prochain MSG à traiter');
        return true;
    }

    // 1 - Initialisation de la session
    const isReady = await stepInitializeSession(context);
    const session = context.session;

    // 🔍 Détection de blocage à l'initialisation
    if (!isReady || !session) {
        console.log('[DIRECTOR] Session non initialisable ou blocage explicite dans l\'initialisation');
        return false;
    }

    // 🌐 Détection automatique de la langue (une seule fois)
    if (typeof session.language === "undefined") {
        session.language = detectLanguageFromText(message);
        console.log(`[DIRECTOR] Langue détectée automatiquement : ${session.language}`);
    }

    console.log(`[DIRECTOR] Taitement du message reçu: "${message}"`);

    const nextSpec = getNextSpec(session.projectType, session.specValues, session.askedSpecs);
    console.log('[DIRECTOR] Identification de la nextSpec à traiter =', nextSpec);

    // On fait évoluer le statut de la spec
    if (session.askedSpecs[nextSpec] === true && session.specValues[nextSpec] === "?") {
        setSpecValue(session, nextSpec, "E");
        console.log(`[DIRECTOR] "${nextSpec}" → est passé de "?" à "E" après relance unique`);
    }

    const isValid = isValidAnswer(message, session.projectType, nextSpec);

    if (!isValid) {
        console.log(`[DIRECTOR] Réponse invalide pour "${nextSpec}" → réponse libre + reprise de question`);

        session.askedSpecs[nextSpec] = true;

        if (nextSpec === "projectType" && ["B", "S", "R"].includes(session.projectType)) {
            await stepWhatNext(context);
            return true;
        }

        if (nextSpec === "projectType") {
            const interpreted = await gptClassifyProject(message, session.language || "fr");
            console.log(`[DIRECTOR] GPT s'est chargé de traiter et d'interpréter votre msg : ${interpreted}`);

            session.askedSpecs.projectType = true;

            if (["B", "S", "R", "?"].includes(interpreted)) {
                setProjectType(session, interpreted, "GPT");
                if (interpreted !== "?") initializeSpecFields(session);
                await stepWhatNext(context);
                return true;
            }
        } else {
            setSpecValue(session, nextSpec, "?");
        }

        context.deferSpec = true;
        context.gptAllowed = true;
        await chatOnly(senderId, message, session.language || "fr");
        await stepWhatNext(context);
        return true;
    }


    console.log(`[DIRECTOR] Réponse valide pour "${nextSpec}" = "${message}"`);

    if (nextSpec === "projectType") {
        const map = { "1": "B", "2": "S", "3": "R", "4": "?" };
        const interpreted = map[message.trim()] || "?";
        session.askedSpecs.projectType = true;
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
