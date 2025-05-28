const { isValidAnswer, getProjectTypeFromNumber } = require('./specEngine');
const { getSession, resetSession } = require('./sessionStore');
const {
    setProjectType,
    initializeSpecFields,
    setSpecValue,
    gptClassifyProject,
    chatOnly,
    getNextSpec,
    setAskedSpec
} = require('./utils');
const { stepInitializeSession } = require('./steps/index');
const { stepWhatNext } = require('./steps');

async function runDirector(context) {
    const { message, senderId } = context;

    // 🛑 Sécurité anti-boucle infinie
    context._entryCount = (context._entryCount || 0) + 1;
    if (context._entryCount > 10) {
        console.warn(`[DIRECTOR STOP] runDirector appelé plus de 10 fois (${context._entryCount}) → interruption.`);
        return false;
    }

    // 🛑 Bloc d’interruption explicite : message = "end session"
    if (typeof message === "string" && message.trim().toLowerCase() === "end session") {
        resetSession(senderId);
        console.log('[DIRECTOR] "end session" détecté → session réinitialisée à neuf');
        return false;
    }

    // 🔄 Initialisation ou récupération de session valide
    const isReady = await stepInitializeSession(context);
    const session = context.session = getSession(senderId);
    if (!isReady || !session) {
        console.log('[DIRECTOR] Session non initialisable ou blocage explicite dans l\'initialisation');
        return false;
    }

    // 🧭 Détermination de la prochaine spec à traiter
    const nextSpec = getNextSpec(session.projectType, session.specValues, session.askedSpecs);
    if (nextSpec === "none") return false;

    // 🧠 Cas unique : traitement de projectType uniquement via GPT
    if (nextSpec === "projectType") {
        const interpreted = await gptClassifyProject(message, session.language || "fr");
        const isValidGPT = ["B", "S", "R", "E"].includes(interpreted);
        const current = session.projectType;
        const alreadyAsked = session.askedSpecs.projectType === true;

        if (isValidGPT) {
            setProjectType(session, interpreted, "gpt");
            setAskedSpec(session, "projectType", "valid answer");
        } else {
            // 🔁 Si deuxième réponse floue consécutive → forcer à "E"
            if (alreadyAsked && current === "?") {
                setProjectType(session, "E", "GPT → refus après 2 échecs");
                console.log(`[DIRECTOR] projectType passé à "E" après deux tentatives floues`);
            } else {
                setProjectType(session, "?", "GPT → invalide");
            }
            setAskedSpec(session, "projectType", "asked but invalid answer");
        }

        return true; // Fin du tour : projectType traité
    }

   
    // 🔒 Protection stricte : projectType ne doit jamais passer ici
    if (nextSpec === "projectType") {
        throw new Error("[DIRECTOR] ERREUR CRITIQUE : projectType ne doit pas passer dans le pipeline standard");
    }

    // ✅ Validation générique pour toutes les autres specs
    const isValid = isValidAnswer(nextSpec, message, session.projectType);
    console.log(`[DIRECTOR] Réponse jugée ${isValid ? "valide" : "invalide"} pour "${nextSpec}" = "${message}"`);

    if (!isValid) {
        const alreadyAsked = session.askedSpecs[nextSpec] === true;
        const current = session.specValues[nextSpec];
        const protectedValues = ["E", 0];

        // 📌 On marque comme posée uniquement pour propertyUsage
        if (nextSpec === "propertyUsage" && !alreadyAsked) {
            setAskedSpec(session, nextSpec, "asked but invalid answer");
        }

        // 🚫 Protection : on ne modifie pas les valeurs protégées
        if (!protectedValues.includes(current)) {
            if (alreadyAsked && current === "?") {
                setSpecValue(session, nextSpec, "E", "runDirector/?→E after 2 invalid");
                console.log(`[DIRECTOR] "${nextSpec}" → passé à "E" après deux tentatives`);
            } else {
                setSpecValue(session, nextSpec, "?", "runDirector/invalid");
            }
        }

        // 🧠 On redirige vers chat + relance stepWhatNext
        context.deferSpec = true;
        context.gptAllowed = true;
        await chatOnly(senderId, message, session.language || "fr");
        await stepWhatNext(context, nextSpec);
        return true;
    }

    // ✅ Cas normal : réponse valide, on stocke
    setSpecValue(session, nextSpec, message, "runDirector/valid");

    const continued = await stepWhatNext(context, nextSpec);
    if (!continued) {
        console.log('[DIRECTOR] Aucun mouvement supplémentaire possible (whatNext) → passage en mode chatOnly');
        context.gptAllowed = true;
        await chatOnly(senderId, message, session.language || "fr");
    }

    return true; // Fin du traitement normal
}

module.exports = { runDirector };
