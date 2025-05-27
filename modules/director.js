const { isValidAnswer, getProjectTypeFromNumber } = require('./specEngine');
const { getSession } = require('./sessionStore');
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
const { stepHandleFallback } = require('./steps');
const { stepWhatNext } = require('./steps');

async function runDirector(context) {
    const { message, senderId } = context;
    //CM temporaire
    context._entryCount = (context._entryCount || 0) + 1;
    if (context._entryCount > 10) {
        console.warn(`[STOP] runDirector appelé plus de 10 fois (${context._entryCount}) → interruption.`);
        return false;
    }
    console.log(new Error().stack.split('\n')[2].trim());
    // 1 - *****************************Initialisation de la session**********************************
    const isReady = await stepInitializeSession(context);
    const session = context.session = getSession(senderId);

    // 🔍 Blocage volontaire après reset ou erreur
    if (!isReady || !session) {
        console.log('[DIRECTOR] Session non initialisable ou blocage explicite dans l\'initialisation');
        return false;
    }

    console.log(`[DIRECTOR] Message: "${message}"`);

    const nextSpec = getNextSpec(session.projectType, session.specValues, session.askedSpecs);
    if (!nextSpec) {
        console.log('[DIRECTOR] Aucune spec à poser');
        return false;
    }

    console.log(`[DIRECTOR] Identification de la nextSpec à traiter = ${nextSpec}`);
    console.log(`[DIRECTOR] État de "${nextSpec}" → specValue = "${session.specValues[nextSpec]}", asked = ${session.askedSpecs[nextSpec]}`);

    const isValid = isValidAnswer(message, session.projectType, nextSpec);
    console.log(`[DIRECTOR] Réponse jugée ${isValid ? "valide" : "invalide"} pour "${nextSpec}" = "${message}"`);

    if (nextSpec === "projectType") {
        const interpreted = getProjectTypeFromNumber(message);
        setAskedSpec(session, "projectType", "valid answer");
        const preserveUsageAsked = session.askedSpecs?.propertyUsage;
        setProjectType(session, interpreted, "user input");
        if (typeof preserveUsageAsked !== "undefined") {
            session.askedSpecs.propertyUsage = preserveUsageAsked;
        }
        return true; // pour forcer un appel propre sur l’itération suivante
    }

    // 🔁 Bloc unifié pour les specs invalides, avec GPT fallback pour projectType
    if (!isValid) {
        const alreadyAsked = session.askedSpecs[nextSpec] === true;
        const current = session.specValues[nextSpec];
        const protectedValues = ["E", 0];

        // 🧠 Cas unique : projectType → GPT fallback en 1re tentative
        if (nextSpec === "projectType" && !alreadyAsked) {
            const interpreted = await gptClassifyProject(message, session.language || "fr");
            const isValidGPT = isValidAnswer(interpreted, session.projectType, "projectType");

            if (isValidGPT) {
                setProjectType(session, interpreted, "GPT → valide");
                await stepWhatNext(context, nextSpec);
                return true;
            } else {
                setProjectType(session, "?", "GPT → invalide");
            }
        }

        // 🧠 Marquer la spec comme "posée" (uniquement pour projectType et propertyUsage)
        if ((nextSpec === "projectType" || nextSpec === "propertyUsage") && !alreadyAsked) {
            setAskedSpec(session, nextSpec, "asked but invalid answer");
        }

        // 🔒 Si la valeur actuelle est protégée, on ne la touche plus
        if (!protectedValues.includes(current)) {
            if (alreadyAsked && current === "?") {
                setSpecValue(session, nextSpec, "E", "runDirector/?→E after 2 invalid");
                console.log(`[DIRECTOR] "${nextSpec}" → est passé de "?" à "E" après deux réponses invalides`);
            } else {
                setSpecValue(session, nextSpec, "?", "runDirector/invalid");
            }
        } else {
            console.log(`[DIRECTOR] Réécriture bloquée de "${nextSpec}" car déjà à valeur protégée "${current}"`);
        }

        context.deferSpec = true;
        context.gptAllowed = true;
        await chatOnly(senderId, message, session.language || "fr");
        await stepWhatNext(context, nextSpec);
        return true;
    }

    // ✅ Cas général : réponse valide

       setSpecValue(session, nextSpec, message, "runDirector/valid");
    

    const continued = await stepWhatNext(context, nextSpec);
    if (!continued) {
        console.log('[DIRECTOR] Aucun mouvement supplémentaire possible (whatNext) → passage en mode chatOnly');
        context.gptAllowed = true;
        await chatOnly(senderId, message, session.language || "fr");
    }

    return true;
}

module.exports = { runDirector };
