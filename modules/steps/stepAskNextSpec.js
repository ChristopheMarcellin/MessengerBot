const axios = require('axios');
const {
    getNextUnansweredSpec,
    getPromptForSpec,
    isValidAnswer,
    updateSpecFromInput
} = require('../specEngine');
const { sendMessage } = require('../messenger');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function stepAskNextSpec({ senderId, session, message }) {
    if (session.specValues.projectType === "?") return true;

    const currentSpec = getNextUnansweredSpec(session);
    session.currentSpec = currentSpec;
    console.log(`[NEXT] CurrentSpec set to "${currentSpec}"`);

    if (!currentSpec) return true;

    const prompt = `${getPromptForSpec(session.specValues.projectType, currentSpec, session.language)}\n\n"${message}"`;

    const decodeRes = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 10,
        temperature: 0
    }, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }
    });

    const raw = decodeRes.data.choices?.[0]?.message?.content?.trim() || "?";
    console.log(`[DECODE] ${currentSpec} -> "${raw}"`);

    const valid = isValidAnswer(raw, session.specValues.projectType, currentSpec);
    updateSpecFromInput(currentSpec, valid ? raw : "?", session.specValues);
    session.askedSpecs[currentSpec] = true;

    if (!valid) {
        const reformulated = session.language === "fr"
            ? `Desole de vous reposer la question : ${getPromptForSpec(session.specValues.projectType, currentSpec, session.language)}. Assurez-vous de repondre avec un chiffre seulement.`
            : `Sorry to ask again: ${getPromptForSpec(session.specValues.projectType, currentSpec, session.language)}. Please answer with a number only.`;
        await sendMessage(senderId, reformulated);
    } else {
        const next = getNextUnansweredSpec(session);
        session.currentSpec = next;
        if (next) {
            const nextPrompt = getPromptForSpec(session.specValues.projectType, next, session.language);
            console.log(`[PROMPT] Asking for ${next} -> "${nextPrompt}"`);
            session.askedSpecs[next] = true;
            await sendMessage(senderId, nextPrompt);
        }
    }

    return false;
}

module.exports = { stepAskNextSpec };