const { getSession, setSession } = require('../sessionStore');
const { updateSpecFromInput, isValidAnswer } = require('../specEngine');

async function stepHandleSpecAnswer({ senderId, message }) {
    const session = getSession(senderId);
    if (!session || !session.currentSpec) return true;

    const field = session.currentSpec;
    const value = updateSpecFromInput(field, message);
    if (value === "?") {
        console.log(`[WARN] Invalid answer for ${field}, repeating question.`);
        return false; // repeat question
    }

    session.specValues[field] = value;
    session.currentSpec = null;
    setSession(senderId, session);
    return true;
}

module.exports = { stepHandleSpecAnswer };
