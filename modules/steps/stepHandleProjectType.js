const { setProjectType, initializeSpecFields } = require('../utils');

async function stepHandleProjectType({ senderId, session, message }) {
    if (!session) {
        console.warn(`[WARN] stepHandleProjectType called with undefined session for ${senderId}`);
        return false;
    }

    if (!session.awaitingProjectType) return true;

    // Decode numeric input (1-4) directly if present
    let guess;
    const trimmed = message.trim();
    if (["1", "2", "3", "4"].includes(trimmed)) {
        if (trimmed === "1") guess = "B";
        if (trimmed === "2") guess = "S";
        if (trimmed === "3") guess = "R";
        if (trimmed === "4") guess = "E";
    } else {
        // Fallback to GPT classification
        guess = await tryToClassifyProjectType(session, message);
    }

    if (["B", "S", "R"].includes(guess)) {
        setProjectType(session, guess, "GPT classification (follow-up)");
        initializeSpecFields(session);
    } else if (guess === "E" && session.awaitingProjectType === "firstTry") {
        setProjectType(session, "?", "E -> forced ?");
    } else {
        setProjectType(session, "E", "classification fallback");
    }

    session.askedSpecs.projectType = true;
    delete session.awaitingProjectType;
    return true;
}

module.exports = stepHandleProjectType;

// Import GPT classification function
const { tryToClassifyProjectType } = require('../utils');
