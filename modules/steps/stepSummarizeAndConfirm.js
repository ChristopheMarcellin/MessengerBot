const { buildSpecSummary, buildExportRecord } = require('../specEngine');
const { sendMessage } = require('../messenger');
const { exportToGoogleSheets } = require('../dataExport');

async function stepSummarizeAndConfirm(context) {
    const { senderId, session } = context;
    const lang = session.language || 'fr';

    const recap = buildSpecSummary(session, lang);
 //   console.log("on sort de build summary")
    await sendMessage(senderId, recap);
    session.lastUserMessage = null;

    session.mode = "chat";
    const rowData = buildExportRecord(context.session);
    await exportToGoogleSheets(rowData);

    return true;
}

module.exports = stepSummarizeAndConfirm;
