module.exports = {
    stepCheckEndSession: require('./stepCheckEndSession'),
    stepInitializeSession: require('./stepInitializeSession').stepInitializeSession,
    stepHandleProjectType: require('./stepHandleProjectType').stepHandleProjectType,
    stepAskNextSpec: require('./stepAskNextSpec'),
    stepSummarizeIfComplete: require('./stepSummarizeIfComplete'),
    stepFallback: require('./stepFallback')
};
