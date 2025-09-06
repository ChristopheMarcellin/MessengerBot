const { buildSpecSummary, buildExportRecord } = require('../specEngine');
const { sendMessage } = require('../messenger');
const { exportToGoogleSheets } = require('../dataExport');

async function stepSummarizeAndConfirm(context) {
    const { senderId } = context;
    let { session } = context;
    const lang = session?.language || 'fr';

    const recap = buildSpecSummary(session, lang);
    await sendMessage(senderId, recap, session || (typeof context !== 'undefined' ? context.session : null));
    session.lastUserMessage = null;

    const rowData = buildExportRecord(session);
    await exportToGoogleSheets(rowData);

    return true;
}


module.exports = stepSummarizeAndConfirm;
