const { setAskedSpec, getNextSpec } = require('../utils');
const { getPromptForSpec, getPromptForProjectType } = require('../questions');
const { sendMessage } = require('../messenger');
const { saveSession } = require('../sessionStore');
const { buildSpecSummary } = require('../specEngine');

// Pose la question associée à la spec fournie.
// Retourne true si une question a été posée, false sinon (par sécurité, mais en pratique jamais appelé avec nextSpec null).
async function stepWhatNext(context, spec) {
    const { senderId } = context;
    const lang = context.session.language || 'fr';
    console.log(`[WHATNEXT] Langue dans session = ${lang}`);
    const nextSpec = getNextSpec(context.session);
    //Toutes les specs sont complétées
    if (!nextSpec) {
        console.log('[WHATNEXT] ✅ Toutes les specs sont complètes → aucune question à poser.');
        return false;
    }

    // 💬 Étape spéciale : détection de relance (même spec que précédente)
    if (nextSpec === spec) {
        // construire un prefixe pour questionText indiquant qu'on revient une fois de plus sur la question
    }

    // === Initialisation obligatoire ===
    context.session.currentSpec = nextSpec;

    // === Étape 1 : projectType ===
    if (nextSpec === "projectType") {
        const questionText = getPromptForProjectType(lang);
        setAskedSpec(context.session, nextSpec, 'question posée via stepWhatNext');
        console.log(`[WHATNEXT] Question pour la spec "${nextSpec}" → ${questionText}`);
        await sendMessage(senderId, questionText);
        return true;
    }

    // === Étape 2 : propertyUsage ===
    if (nextSpec === "propertyUsage") {
        const usage = context.session.specValues?.propertyUsage;

        if (usage === "personal") {
            ["bedrooms", "bathrooms", "garage"].forEach(field => {
                if (context.session.askedSpecs?.[field] !== true) {
                    setAskedSpec(context.session, field, "auto → propertyUsage=personal");
                }
            });
        } else if (usage === "income") {
            console.log("[WHATNEXT] propertyUsage = income → aucune exclusion de specs");
        }
    }


    //// === Étape 3
    //if (nextSpec === "summary") {
    //    console.log('[WHATNEXT ÉTAPE4] nextSpec = "summary"');
    //    const recap = buildSpecSummary(context.session, context.session.language);
    //    await sendMessage(senderId, recap);
    //    return false;
    //}

    setAskedSpec(context.session, nextSpec, 'question posée via stepWhatNext');

    const questionText = getPromptForSpec(nextSpec, lang, context.session.projectType);
    console.log(`[WHATNEXT] Question pour la spec "${nextSpec}" → ${questionText}`);
        
    await sendMessage(senderId, questionText);

    return true;
}

module.exports = { stepWhatNext };
