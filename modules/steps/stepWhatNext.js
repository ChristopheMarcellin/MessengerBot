const { getNextSpec, setAskedSpec } = require('../utils');
const { getPromptForSpec, getPromptForProjectType } = require('../questions');
const { sendMessage } = require('../messenger');
const { buildSpecSummary } = require('../specEngine');


// Pose la prochaine question de spécification à l'utilisateur, si nécessaire.
// Retourne true au directeur si une question a été posée, false sinon, indiquant la fin des questions.
// Cette fonction ne dirige PAS le flux général (chatOnly, résumé, etc.) — cela reste la responsabilité du runDirector.

    async function stepWhatNext(context) {
    const { senderId, session } = context;
    const lang = session.language || 'fr';

    // 🚫 Refus explicite du projet ou de la propriété → aucune suite à poser
    if (session.projectType === "E" || session.specValues.propertyUsage === "E") {
        console.log('[WHATNEXT] Refus explicite détecté → arrêt');
        return false;
    }

    console.log("[WHATNEXT getNextSpec] projectType is currently set at", session.projectType);
    const nextSpec = getNextSpec(session.projectType, session.specValues, session.askedSpecs);
    console.log(`[WHATNEXT] Spec à traiter : ${nextSpec}`);

    // 🛑 Cas de blocage ou rien à poser
    if (!nextSpec || nextSpec === "none") {
        console.log('[WHATNEXT] Aucune spec à poser → arrêt');
        return false;
    }

    // ✅ Résumé attendu
    if (nextSpec === "summary") {
        console.log('[WHATNEXT] Toutes les specs traitées, on passe au sommaire');
        const summary = buildSpecSummary(session, lang);
        await sendMessage(senderId, summary);
        return false;
    }

    // 🧭 Projet non défini → poser la question projet
    if (nextSpec === "projectType") {
        const prompt = getPromptForProjectType(lang);
        console.log(`[WHATNEXT] Pose de la question projet → ${prompt}`);
        await sendMessage(senderId, prompt);
        return true;
    }

    // 🎯 Spécification normale à poser
    session.currentSpec = nextSpec;
    setAskedSpec(senderId, nextSpec, 'question posée via stepWhatNext');

    const questionText = getPromptForSpec(session.projectType, nextSpec, lang);
    await sendMessage(senderId, questionText);
    return true;
}

module.exports = { stepWhatNext };
