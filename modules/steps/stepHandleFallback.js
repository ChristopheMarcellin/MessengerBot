const axios = require('axios');
const { sendMessage } = require('../messenger');

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

    // 🧠 Construire un prompt selon le mode
    let prompt = "";
    if (gptMode === "classifyOrChat") {
        prompt = lang === "fr"
            ? `Tu es un assistant immobilier. L'utilisateur a dit : "${message}". Classe cette réponse dans l'une de ces catégories :\n1 → acheter\n2 → vendre\n3 → louer\n4 → autre\nNe commente pas, réponds seulement par un chiffre.`
            : `You are a real estate assistant. The user said: "${message}". Classify the intent into one of the following:\n1 → buy\n2 → sell\n3 → rent\n4 → other\nReply with a single number only.`;
    } else {
        prompt = lang === "fr"
            ? `Tu es un assistant amical. Réagis à cette phrase sans chercher à interpréter des données : "${message}"`
            : `You are a friendly assistant. React to this phrase without trying to interpret data: "${message}"`;
    }

    console.log(`[GPT] Mode: ${gptMode} | Lang: ${lang} | Prompt → ${prompt}`);

    const chatGptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.6
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
    });

    const gptReply = chatGptResponse.data.choices?.[0]?.message?.content?.trim() || (
        lang === "fr" ? "Désolé, je n'ai pas compris." : "Sorry, I didn’t understand."
    );

    await sendMessage(senderId, gptReply);
}

module.exports = { stepHandleFallback };
