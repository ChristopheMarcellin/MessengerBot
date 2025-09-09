const { setAskedSpec, getNextSpec } = require('../utils');
const { getPromptForSpec, getPromptForProjectType, getPromptForPropertyUsage, getPreamble } = require('../questions');
const { sendMessage } = require('../messenger');
const { saveSession } = require('../sessionStore');
const { buildSpecSummary } = require('../specEngine');

// Pose la question associée à la spec fournie.
// Retourne true si une question a été posée, false sinon (par sécurité, mais en pratique jamais appelé avec nextSpec null).
async function stepWhatNext(context, spec, previousSpec) {
    const { senderId } = context;
    const lang = context.session.language || 'fr';
 //   console.log(`[WHATNEXT] Langue dans session = ${lang}`);
    const nextSpec = getNextSpec(context.session);

    //Toutes les specs sont complétées - NE DEVRAIT JAMAIS SE RENDRE ICI
    if (!nextSpec) {
        console.log('[WHATNEXT !nextSpec] ✅ Toutes les specs sont complètes → aucune question à poser.');
        return false;
    }

    // 💬 Étape spéciale : détection de relance (même spec que précédente)
    let prefix = "";
    if (previousSpec === spec) {
       // console.log(`[WHATNEXT] Question posée de nouveau pcq ancienne spec était :"${previousSpec}" et la nouvelle est ${spec}`);
        prefix = lang === 'fr'
            ? "Désolé, assurez-vous de formuler votre réponse tel que proposé. Voici la question à nouveau :\n\n"
            : "Sorry, can you observe the format requested for your answer. Here's the question again:\n\n";
    }

    // === Initialisation obligatoire ===
    context.session.currentSpec = nextSpec;

    // === Étape 1 : projectType ===
    if (nextSpec === "projectType") {
        // Toujours préambule + question
        const questionText = getPreamble(lang) + "\n" + getPromptForProjectType(lang);

        // Marquer le préambule comme affiché
        context.session.termsShown = true;

        if (context.session.mode === 'spec') {
            setAskedSpec(context.session, nextSpec, 'stepWhatNext for projectType');
        } else {
            context.session.mode = 'spec';
            return false;
        }

        await sendMessage(senderId, prefix + questionText, context.session);
        return true;
    }

    // === Étape 2 : propertyUsage ===
    if (nextSpec === "propertyUsage") {
        let questionText;

        if (!context.session.termsShown) {
            questionText = getPreamble(lang) + "\n" + getPromptForPropertyUsage(lang);
            context.session.termsShown = true; // ✅ marquer comme affiché
        } else {
            questionText = getPromptForPropertyUsage(lang);
        }

        // ✅ marquer comme posée
        setAskedSpec(context.session, nextSpec, 'stepWhatNext for propertyUsage');

        // envoyer la question
        await sendMessage(senderId, prefix + questionText, context.session);

        return true;
    }

  //  setAskedSpec(context.session, nextSpec, 'stepWhatNext for all and any reg. specs');

    const questionText = getPromptForSpec(nextSpec, lang, context.session.projectType);
   // console.log(`[WHATNEXT] Question pour la spec "${nextSpec}" → ${questionText}`);
        
    await sendMessage(senderId, prefix + questionText, context.session);

    return true;
}

module.exports = { stepWhatNext };
