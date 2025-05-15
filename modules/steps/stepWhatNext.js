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

    console.log("[WHATNEXT Before getNextSpec] projectType =", session.projectType);
    const nextSpec = getNextSpec(session.projectType, session.specValues, session.askedSpecs);
    console.log(`[WHATNEXT] Spec à traiter : ${nextSpec}`);

    // Synchroniser avec la spec actuellement attendue
    session.currentSpec = nextSpec;

    // Rien à poser
    if (nextSpec === "none") {
        console.log('[WHATNEXT] nextSpec = none');
        return false;
    }

    // Résumé attendu
    if (nextSpec === "summary") {
                console.log('[WHATNEXT] Toutes les specs traitées, on passe au sommaire');
                const summary = buildSpecSummary(session, lang);
                await sendMessage(senderId, summary);
                return false; // ❗️Résumé envoyé → conversation terminée
    }

    // Projet non défini → poser la question projet
    if (nextSpec === "projectType") {
        const prompt = getPromptForProjectType(lang);
        console.log(`[WHATNEXT] Pose de la question projet → ${prompt}`);
        await sendMessage(senderId, prompt);
        return true;
    }

    // Une spec ordinaire à poser qui saute les questions concernant les specs d'une propriété à revenus

    const skipIfIncomeProperty = ["bedrooms", "bathrooms", "garage", "parking"];

    if (session.propertyUsage === "income" && skipIfIncomeProperty.includes(nextSpec)) {
        console.log(`[WHATNEXT] Spec "${nextSpec}" ignorée car propriété à revenus`);
        session.askedSpecs[nextSpec] = true;
        session.specValues[nextSpec] = "?";
        return await stepWhatNext(context); // On relance pour la suivante
    }


    const prompt = getPromptForSpec(nextSpec, lang);

    console.log(`[WHATNEXT] Pose de la spec "${nextSpec}" → ${prompt}`);
    await sendMessage(senderId, prompt);
    return true;
}

module.exports = { stepWhatNext };
