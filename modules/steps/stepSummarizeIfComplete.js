const { sendMessage } = require('../messenger');
const { buildSpecSummary } = require('../specEngine');
const { allSpecsCollected } = require('../utils');
const { allSpecsCollected } = require('../specEngine');

async function stepSummarizeIfComplete({ senderId, session }) {
    if (!session.completedSpecs && allSpecsCollected(session) && session.specValues.projectType !== "?") {
        session.completedSpecs = true;
        const summary = buildSpecSummary(session, session.language);
        if (summary && summary.trim()) {
            await sendMessage(senderId, summary);
        }
        return false;
    }
    return true;
}

module.exports = stepSummarizeIfComplete;
