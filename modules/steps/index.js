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
  stepAskNextSpec: require('./stepAskNextSpec').stepAskNextSpec,
  stepCollectContact: require('./stepCollectContact').stepCollectContact,
  stepHandleFallback: require('./stepHandleFallback').stepHandleFallback,
  stepWhatNext: require('./stepWhatNext').stepWhatNext,
  stepHandleProjectType: require('./stepHandleProjectType'),
    stepHandleSpecAnswer: require('./stepHandleSpecAnswer'),
  stepSummarizeAndConfirm: require('./stepSummarizeAndConfirm')

};