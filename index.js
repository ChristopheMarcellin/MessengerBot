require('dotenv').config();

const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = 'helloworldtoken';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const userSessions = {}; // Temporary in-memory user session object

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

app.post('/webhook', async (req, res) => {
    try {
        const messagingEvent = req.body.entry?.[0]?.messaging?.[0];
        if (!messagingEvent || messagingEvent.message?.is_echo || messagingEvent.delivery || messagingEvent.read) {
            return res.status(200).send('EVENT_RECEIVED');
        }

        const senderId = messagingEvent.sender?.id;
        const receivedMessage = messagingEvent.message?.text;

        if (!receivedMessage || !senderId) return res.status(200).send('EVENT_RECEIVED');

        console.log("[STEP 1] Sender ID:", senderId);
        console.log("[STEP 2] Received Message:", receivedMessage);

        // ChatGPT: Detect language and project type in one call
        const detectionPrompt = `
Detect the user's language and project intent from the following message.

Return a JSON object with:
- "language": "en" or "fr"
- "project": "B" for buying, "S" for selling, "R" for renting, "E" for anything else

Message: """${receivedMessage}"""
`;

        const detectionResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [{ role: "user", content: detectionPrompt }],
            max_tokens: 100,
            temperature: 0.3
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });

        let detectionText = detectionResponse.data.choices?.[0]?.message?.content || "{}";

        // Clean markdown if GPT returns ```json ... ```
        detectionText = detectionText.replace(/```json|```/g, "").trim();

        let language = "en";
        let project = "E";

        try {
            const parsed = JSON.parse(detectionText);
            language = parsed.language || "en";
            project = parsed.project || "E";
        } catch (e) {
            console.warn("[WARNING] Failed to parse detection JSON. Defaulting to EN/E.");
        }

        console.log("[STEP 3] Detected Language:", language);
        console.log("[STEP 4] Detected Project:", project);

        // Save to session
        userSessions[senderId] = {
            language,
            projectType: project
        };

        // ChatGPT: Answer user message
        const chatGptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [{ role: "user", content: receivedMessage }],
            max_tokens: 400,
            temperature: 0.5
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });

        let gptReply = chatGptResponse.data.choices?.[0]?.message?.content?.trim();

        if (!gptReply) {
            gptReply = (language === "fr")
                ? "Désolé, je n'ai pas compris votre demande."
                : "Sorry, I didn't understand your request.";
        }

        const messageData = {
            recipient: { id: senderId },
            message: { text: gptReply }
        };

        await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, messageData, {
            headers: { 'Content-Type': 'application/json' }
        });

        // Build follow-up prompt
        let nextPrompt = "";

        if (language === "fr") {
            nextPrompt = (project === "E")
                ? "Puis-je vous demander quel type de projet vous avez en tête ? Achat, vente, location ou autre ?"
                : "Parfait. Parlons de votre projet. Posez-moi vos questions ou laissez-moi vous guider.";
        } else {
            nextPrompt = (project === "E")
                ? "May I ask what type of project you have in mind? Buying, selling, renting or something else?"
                : "Great. Let's talk about your project. You can ask your questions or let me guide you.";
        }

        const combinedMessage = {
            recipient: { id: senderId },
            message: { text: nextPrompt }
        };

        await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, combinedMessage, {
            headers: { 'Content-Type': 'application/json' }
        });

        res.status(200).send('EVENT_RECEIVED');

    } catch (error) {
        console.error("[ERROR] Error handling webhook event:", error.toString());
        if (error.response?.data) {
            console.error("[ERROR Details]", JSON.stringify(error.response.data, null, 2));
        }
        res.status(500).send('Error handling event');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[INIT] Server running on port ${PORT}`));
