const { setProjectType, initializeSpecFields } = require('../utils');
const { sendMessage } = require('../messenger');
const { tryToClassifyProjectType } = require('../utils');

async function stepHandleProjectType({ senderId, session, message }) {
    if (!session) {
        console.warn(`[WARN] stepHandleProjectType called with undefined session for ${senderId}`);
        return false;
    }

    // Si déjà défini, ne rien faire
    if (["B", "S", "R"].includes(session.specValues.projectType)) return true;

    // 1. Si on attend une première classification (suite au fallback initial)
    if (session.awaitingProjectType) {
        const guess = await tryToClassifyProjectType(session, message);

        if (["B", "S", "R"].includes(guess)) {
            setProjectType(session, guess, "GPT classification (follow-up)");
            initializeSpecFields(session);
            delete session.awaitingProjectType;
            session.askedSpecs.projectType = true;
            return true;
        }

        if (guess === "E" && session.awaitingProjectType === "firstTry") {
            setProjectType(session, "?", "E -> forced ?");
        } else {
            setProjectType(session, "E", "classification fallback");
        }

        delete session.awaitingProjectType;
        session.askedSpecs.projectType = true;
    }

    // 2. Si toujours "?" => tenter interprétation directe (1, 2, 3, 4)
    const clean = message.trim();
    if (["1", "2", "3", "4"].includes(clean)) {
        const map = { "1": "B", "2": "S", "3": "R", "4": "E" };
        const mapped = map[clean];

        if (["B", "S", "R"].includes(mapped)) {
            setProjectType(session, mapped, "user numeric choice");
            initializeSpecFields(session);
            return true;
        } else {
            setProjectType(session, "?", "user chose 4 -> forced ?");
        }
        session.askedSpecs.projectType = true;
    }

    // 3. Si encore indéfini, poser (ou reposer) la question fermée
    if (session.specValues.projectType === "?" && !session.askedSpecs.projectType) {
        const question = session.language === "fr"
            ? "Quel est le but de votre projet ? 1-acheter, 2-vendre, 3-louer, 4-autre raison (svp repondez avec un chiffre seulement)."
            : "What is the purpose of your project? 1-buy, 2-sell, 3-rent, 4-other reason (please reply with a number only).";

        session.askedSpecs.projectType = true;
        await sendMessage(senderId, question);
    }

    return true;
}

module.exports = stepHandleProjectType;
