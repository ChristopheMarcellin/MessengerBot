const axios = require('axios');
const { sendMessage } = require('../messenger');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function stepFallback({ senderId, session, message }) {
    session.questionCount++;
    if (session.questionCount >= session.maxQuestions) {
        await sendMessage(senderId, session.language === "fr"
            ? "Limite atteinte." : "Limit exceeded.");
        return;
    }

    const chatGptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o",
        messages: [{
            role: "user",
            content: (session.language === "fr"
                ? "Repondez en francais : "
                : "Please answer in English: ") + message
        }],
        max_tokens: 400,
        temperature: 0.5
    }, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }
    });

    const gptReply = chatGptResponse.data.choices?.[0]?.message?.content?.trim() || (
        session.language === "fr"
            ? "Desole, je n'ai pas compris."
            : "Sorry, I didn’t understand."
    );

    await sendMessage(senderId, gptReply);
}

module.exports = stepHandleFallback;