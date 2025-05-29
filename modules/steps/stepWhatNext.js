const { setAskedSpec } = require('../utils');
const { getPromptForSpec, getPromptForProjectType } = require('../questions');
const { sendMessage } = require('../messenger');

// Pose la question associée à la spec fournie.
// Retourne true si une question a été posée, false sinon (par sécurité, mais en pratique jamais appelé avec nextSpec null).
async function stepWhatNext(context, nextSpec) {
    const { senderId } = context;
    const lang = context.session.language || 'fr';

    if (!nextSpec || nextSpec === "none") {
        console.warn('[WHATNEXT] Appel avec nextSpec est vide ou invalide');
        return false;
    }

    context.session.currentSpec = nextSpec;
    setAskedSpec(context.session, nextSpec, 'question posée via stepWhatNext');

    const questionText = (nextSpec === "projectType")
        ? getPromptForProjectType(lang)
        : getPromptForSpec(context.session.projectType, nextSpec, lang);

    console.log(`[WHATNEXT] Pose de la spec "${nextSpec}" → ${questionText}`);
    await sendMessage(senderId, questionText);

    return true;
}

module.exports = { stepWhatNext };
