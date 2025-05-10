const { getSession, setSession } = require('../sessionStore');

function stepInitializeSession(context) {
    const { senderId } = context;

    let session = getSession(senderId);

    if (!session || typeof session !== 'object') {
        console.log('[INIT] Nouvelle session → initialisation forcée');
        session = {};
        setSession(senderId, session);
    }

    context.session = session;
    return true;
}

module.exports = {

  stepCheckEndSession: require('./stepCheckEndSession').stepCheckEndSession,
  stepInitializeSession: require('./stepInitializeSession').stepInitializeSession,
  stepHandleProjectType: require('./stepHandleProjectType').stepHandleProjectType,
  stepHandleSpecAnswer: require('./stepHandleSpecAnswer').stepHandleSpecAnswer,
  stepAskNextSpec: require('./stepAskNextSpec').stepAskNextSpec,
  stepSummarizeAndConfirm: require('./stepSummarizeAndConfirm').stepSummarizeAndConfirm,
  stepCollectContact: require('./stepCollectContact').stepCollectContact,
  stepHandleFallback: require('./stepHandleFallback').stepHandleFallback,
  stepWhatNext: require('./stepWhatNext')
};