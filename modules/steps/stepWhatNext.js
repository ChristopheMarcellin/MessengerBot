const { getNextSpec } = require('../utils');
const { getPromptForSpec, getPromptForProjectType } = require('../questions');
const { sendMessage } = require('../messenger');
const { buildSpecSummary } = require('../specEngine');

/**
 * Décide et envoie la prochaine question à poser à l'utilisateur
 * @param {object} context - objet contenant session, senderId, etc.
 * @returns {boolean} true si une question a été posée, false sinon
 */
async function stepWhatNext(context) {
    const { senderId, session } = context;
    const lang = session.language || 'fr';

    // 🚫 Refus explicite du projet → aucune suite à poser
    if (session.projectType === "E") {
        // console.log('[WHATNEXT] projectType = "E" → refus explicite, aucune suite à poser.');
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
        return false; // ❗️Résumé envoyé → conversation terminée
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
    session.askedSpecs[nextSpec] = true;

    const questionText = getPromptForSpec(session.projectType, nextSpec, lang);
    await sendMessage(senderId, questionText);
    return true;
}

    // Une spec ordinaire à poser
    const prompt = getPromptForSpec(nextSpec, lang);
    console.log(`[WHATNEXT] Pose de la spec "${nextSpec}" → ${prompt}`);
    await sendMessage(senderId, prompt);
    return true;
}

module.exports = { stepWhatNext };
