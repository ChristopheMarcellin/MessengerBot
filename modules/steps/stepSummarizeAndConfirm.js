const { getSession, setSession } = require('../sessionStore');
const { buildSpecSummary } = require('../specEngine');
const { sendMessage } = require('../messenger');

async function stepSummarizeAndConfirm({ senderId, message }) {
    const session = getSession(senderId);
    if (!session) return false;

    // Ne rien faire si des specs sont encore incomplètes
    const hasUnanswered = Object.values(session.specValues || {}).includes("?");
    if (hasUnanswered) return true;

    if (session.summarySent) return true; // Ne pas résumer deux fois

    const summary = buildSpecSummary(session);
    await sendMessage(senderId, summary);

    session.summarySent = true;
    setSession(senderId, session);
    return true;
}

module.exports = {stepSummarizeAndConfirm};
