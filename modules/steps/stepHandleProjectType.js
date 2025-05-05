const { setProjectType, initializeSpecFields } = require('./utils');
const { sendMessage } = require('./messenger');

async function stepHandleProjectType({ senderId, session, message }) {
    if (session.specValues?.projectType !== "?") return true;

    const lang = session.language || "fr";
    const isFirstTry = !session.awaitingProjectTypeAttempt;
    const attempt = isFirstTry ? 1 : session.awaitingProjectTypeAttempt + 1;

    const number = parseInt(message.trim(), 10);
    let mapped;

    switch (number) {
        case 1: mapped = "B"; break;
        case 2: mapped = "S"; break;
        case 3: mapped = "R"; break;
        case 4: mapped = "E"; break;
        default: mapped = "?";
    }

    if (["B", "S", "R", "E"].includes(mapped)) {
        setProjectType(session, mapped, `user numeric selection (attempt ${attempt})`);
        initializeSpecFields(session);
        delete session.awaitingProjectTypeAttempt;
        return true;
    }

    if (attempt >= 2) {
        setProjectType(session, "E", "failed 2 attempts");
        delete session.awaitingProjectTypeAttempt;
        return true;
    }

    // Repose la question une dernière fois
    session.awaitingProjectTypeAttempt = attempt;

    const retry = lang === "fr"
        ? "Veuillez répondre en indiquant seulement le chiffre correspondant :\n1-acheter, 2-vendre, 3-louer, 4-autre raison."
        : "Please answer by typing only the number:\n1-buy, 2-sell, 3-rent, 4-other reason.";

    await sendMessage(senderId, retry);
    return false;
}

module.exports = { stepHandleProjectType };
