const axios = require('axios');
const { sendMessage } = require('../messenger');
const { setProjectType, chatOnly } = require('../utils'); // ✅ seul ajout
const { gptClassifyProject } = require('../utils');       // 🔁 inchangé, fidèle à ton code

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function stepHandleFallback(context) {

    const { senderId, session, message, gptMode = "chatOnly" } = context;
    session.questionCount++;
    if (session.questionCount >= session.maxQuestions) {
        await sendMessage(senderId, session.language === "fr"
            ? "Limite atteinte." : "Limit exceeded.");
        return;
    }

    const lang = session.language || "fr";

    if (gptMode === "classifyOrChat") {
        const interpreted = await gptClassifyProject(message, lang); // ✅ inchangé

        console.log(`[HandleFallBack] GPT détermine que le projectType = ${interpreted}`);

        if (
            session.projectType &&
            session.projectType !== "?" &&
            interpreted === "?"
        ) {
            console.error('[BLOCKED] GPT a tenté d’écraser un projectType déjà défini');
            return;
        }

        if (typeof session.projectType === "undefined" || session.projectType === "?") {
            setProjectType(session, interpreted, "GPT → classification directe");
        } else {
            console.log(`[TRACE] GPT a proposé "${interpreted}" mais projectType déjà défini → conservé : ${session.projectType}`);
        }

        return;
    }

    // Mode chatOnly → GPT réponse libre via fonction utilitaire
    await chatOnly(senderId, message, lang);
}

module.exports = { stepHandleFallback };
