const { getNextSpec } = require('../utils');
const { getPromptForSpec, getPromptForProjectType } = require('../questions');
const { sendMessage } = require('../messenger');

/**
 * Décide et envoie la prochaine question à poser à l'utilisateur
 * @param {object} context - objet contenant session, senderId, etc.
 * @returns {boolean} true si une question a été posée, false sinon
 */
async function stepWhatNext(context) {
    const { senderId, session } = context;
    const lang = session.language || 'fr';

    const nextSpec = getNextSpec(session.projectType, session.specValues, session.askedSpecs);
    console.log('[DEBUG] Version active de stepWhatNext');
    console.log(`[NEXT] Prochaine spec attendue : ${nextSpec}`);

    // Rien à poser
    if (nextSpec === "none") {
        console.log('[NEXT] Aucune suite structurée possible (projectType = E)');
        return false;
    }

    // Résumé attendu
    if (nextSpec === "summary") {
        console.log('[NEXT] Toutes les specs sont couvertes → passage au résumé');
        // futur : résumé ou redirection
        return false;
    }

    // Projet non défini → poser la question projet
    if (nextSpec === "projectType") {
        const prompt = getPromptForProjectType(lang);
        console.log(`[NEXT] Pose de la question projet → ${prompt}`);
        await sendMessage(senderId, prompt);
        return true;
    }

    // Une spec ordinaire à poser
    const prompt = getPromptForSpec(nextSpec, lang);

    console.log(`[NEXT] Pose de la spec "${nextSpec}" → ${prompt}`);
    await sendMessage(senderId, prompt);
    return true;
}

module.exports = { stepWhatNext };
