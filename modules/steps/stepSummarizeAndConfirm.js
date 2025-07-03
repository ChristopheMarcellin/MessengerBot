const { buildSpecSummary } = require('../specEngine');
const { sendMessage } = require('../messenger');

async function stepSummarizeAndConfirm(context) {
    const { senderId, session } = context;
    const lang = session.language || 'fr';

    const recap = buildSpecSummary(session, lang);
    await sendMessage(senderId, recap);

    session.mode = "chat";
    console.log('[STEP] Résumé envoyé — passage en mode chat');

    return true;
}

module.exports = {stepSummarizeAndConfirm};
