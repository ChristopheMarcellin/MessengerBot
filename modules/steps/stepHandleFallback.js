const axios = require('axios');
const { sendMessage } = require('../messenger');
const { setProjectType } = require('../utils');

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

    const gptReply = chatGptResponse.data.choices?.[0]?.message?.content?.trim();

    if (gptMode === "classifyOrChat") {
        const classification = gptReply;

        if (["1", "2", "3", "4"].includes(classification)) {
            const map = { "1": "B", "2": "S", "3": "R", "4": "?" };
            const interpreted = map[classification];

            console.log(`[ALERTE TRACE] GPT a classé la réponse comme ${classification} → projectType = ${interpreted}`);

            // 🚫 Protection anti-écrasement d'une valeur utilisateur déjà définie
            if (
                session.projectType &&
                session.projectType !== "?" &&
                interpreted === "?"
            ) {
                console.error('[BLOCKED] GPT a tenté d’écraser un projectType utilisateur valide — opération annulée');
                return;
            }

            // Appliquer si projectType est encore indéfini ou ?
            if (typeof session.projectType === "undefined" || session.projectType === "?") {
                setProjectType(session, interpreted, "GPT → classification directe");
            } else {
                console.log(`[TRACE] GPT a proposé "${interpreted}" mais projectType déjà défini → conservé : ${session.projectType}`);
            }
            return;
        }

        // Ce n’est pas une classification → envoyer à l'utilisateur
        await sendMessage(senderId, classification);
        return;
    }

    // Mode chatOnly → envoyer toujours
    const fallback = gptReply || (lang === "fr" ? "Désolé, je n'ai pas compris." : "Sorry, I didn’t understand.");
    await sendMessage(senderId, fallback);
}

module.exports = { stepHandleFallback };
