
const { isValidAnswer, getProjectTypeFromNumber } = require('./specEngine');
const { setProjectType, initializeSpecFields, setSpecValue, gptClassifyProject,
        chatOnly, getNextSpec } = require('./utils'); // ajout ici
const { stepInitializeSession } = require('./steps/index');
const { stepHandleFallback } = require('./steps');
const { stepWhatNext } = require('./steps');

async function runDirector(context) {
    const { message, senderId } = context;


    const { text } = message;

    const { sendGif } = require('./messenger'); // ajout ici

    // 🎯 INTERCEPTION : demande explicite d’un GIF
    if (typeof text === 'string' && text.toLowerCase().includes("gif")) {
        console.log(`[DIRECTOR] Intention détectée : envoi de GIF → "${text}"`);
        await sendGif(senderId, "https://media.giphy.com/media/3orieUe6ejxSFxYCXe/giphy.gif");
        return true;
    }
    console.log(`[DIRECTOR] Taitement du message reçu: "${text}"`);

    // 1 - *****************************Initialisation de la session**********************************
    const isReady = await stepInitializeSession(context);
    const session = context.session;


    // 🔍 Détection d'un blocage à l'initialisation
    if (!isReady || !session) {
        console.log('[DIRECTOR] Session non initialisable ou blocage explicite dans l\'initialisation');
        return false;
    }

    // 🔁 Si la propriété est à revenus, forcer certaines specs à 0 dès maintenant
    if (session.specValues.propertyUsage === "income" && !session._incomeSpecsForced) {
        const specsToForce = ["bedrooms", "bathrooms", "garage", "parking"];
        for (const field of specsToForce) {
            session.specValues[field] = 0;
            session.askedSpecs[field] = true;
        }
        session._incomeSpecsForced = true;
    }

    console.log(`[DIRECTOR] Taitement du message reçu: "${message}"`);

    const nextSpec = getNextSpec(session.projectType, session.specValues, session.askedSpecs);
    console.log('[DIRECTOR] Identification de la nextSpec à traiter =', nextSpec);
    console.log(`[DIRECTOR] État de "${nextSpec}" → specValue = "${session.specValues[nextSpec]}", asked = ${session.askedSpecs[nextSpec]}`);

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
            const isValidGPT = isValidAnswer(interpreted, session.projectType, "projectType");

            if (isValidGPT) {
                setProjectType(session, interpreted, "GPT → valide");
  
            } else {
                setProjectType(session, "?", "GPT → invalide");
            }

            await stepWhatNext(context);
            return true;
        }

        // Toutes les autres specs non valides
        const current = session.specValues[nextSpec];
        const protectedValues = ["E", 0];

        if (!protectedValues.includes(current)) {
            setSpecValue(session, nextSpec, "?");
        } else {
            console.log(`[DIRECTOR] Pas de réécriture de "${nextSpec}" car déjà à valeur protégée "${current}"`);
        }

        context.deferSpec = true;
        context.gptAllowed = true;
        await chatOnly(senderId, message, session.language || "fr");
        await stepWhatNext(context);
        return true;
    }


    //isValid === true
    console.log(`[DIRECTOR] Réponse jugée valide pour "${nextSpec}" = "${message}"`);

    if (nextSpec === "projectType") {
        const interpreted = getProjectTypeFromNumber(message);
        session.askedSpecs.projectType = true;
        setProjectType(session, interpreted, "user input");
    } else {
        setSpecValue(session, nextSpec, message);
        session.askedSpecs[nextSpec] = true; 
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






