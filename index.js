// index.js (enhanced with specification engine, question limit, and debug logger)
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = 'helloworldtoken';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const userSessions = {}; // In-memory user sessions

const SPEC_QUESTIONS = {
    projectType: {
        prompt: {
            en: "May I ask what type of project you have in mind? Buying, selling, renting or something else?",
            fr: "Puis-je vous demander quel type de projet vous avez en tête ? Achat, vente, location ou autre ?"
        },
        decodePrompt: {
            en: "Classify the following answer as B (buy), S (sell), R (rent), or E (else). Return only one uppercase letter.",
            fr: "Classez la réponse suivante comme B (achat), S (vente), R (location) ou E (autre). Retournez une seule lettre majuscule."
        },
        validValues: ["B", "S", "R", "E"]
    }
};

// Unified response sender
async function sendMessage(senderId, text) {
    await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
        recipient: { id: senderId },
        message: { text }
    }, {
        headers: { 'Content-Type': 'application/json' }
    });
}

// Debug logger
function logSession(senderId) {
    const s = userSessions[senderId];
    console.log("[STEP 3] Detected Language:", s.language);
    console.log("[STEP 4] Detected Project Type:", s.specValues.projectType);
    console.log("[STEP 5] Question Count:", s.questionCount, "/", s.maxQuestions);
}

// Check and handle specification
async function handleSpecification(senderId, specName, userMessage) {
    const session = userSessions[senderId];
    const spec = SPEC_QUESTIONS[specName];

    // Step 1: Check if we already have the value
    if (session.specValues[specName] !== undefined) {
        const response = session.language === "fr" ? "Avez-vous une autre question ?" : "Do you have another inquiry?";
        return await sendMessage(senderId, response);
    }

    // Step 2: If we already asked but no value yet, try to interpret the reply
    if (session.askedSpecs[specName]) {
        const decodePrompt = `${spec.decodePrompt[session.language]}\n\n"${userMessage}"`;
        const decodeRes = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [{ role: "user", content: decodePrompt }],
            max_tokens: 10,
            temperature: 0
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });

        const raw = decodeRes.data.choices?.[0]?.message?.content?.trim().toUpperCase();
        const isValid = spec.validValues.includes(raw);
        session.specValues[specName] = isValid ? raw : "?";

        if (isValid) return; // we have the answer

        // If invalid response
        const retry = session.language === "fr"
            ? "Désolé, je n'ai pas compris. Pouvez-vous clarifier ? Achat, vente, location ou autre ?"
            : "Sorry, I didn’t understand. Could you clarify? Buying, selling, renting or else?";
        return await sendMessage(senderId, retry);
    }

    // Step 3: Ask the question (first time)
    session.askedSpecs[specName] = true;
    return await sendMessage(senderId, spec.prompt[session.language]);
}

// Main webhook handler
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

        // Create session if it doesn't exist
        if (!userSessions[senderId]) {
            // Detect language and project type initially
            const detectionPrompt = `Detect the user's language and intent. Return JSON with \"language\": \"en/fr\" and \"project\": \"B/S/R/E\".\n\n\"${receivedMessage}\"`;
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
            detectionText = detectionText.replace(/```json|```/g, "").trim();

            let language = "en", project = "E";
            try {
                const parsed = JSON.parse(detectionText);
                language = parsed.language || "en";
                project = parsed.project || "E";
            } catch { }

            userSessions[senderId] = {
                language,
                questionCount: 0,
                maxQuestions: 40,
                askedSpecs: {},
                specValues: {}
            };

            if (["B", "S", "R"].includes(project)) {
                userSessions[senderId].specValues.projectType = project;
                userSessions[senderId].askedSpecs.projectType = true;
            }
        }

        logSession(senderId);

        const session = userSessions[senderId];

        // If projectType is not resolved, handle it as a hardcoded question
        if (!session.specValues.projectType || session.specValues.projectType === "?") {
            await handleSpecification(senderId, "projectType", receivedMessage);
            return res.status(200).send('EVENT_RECEIVED');
        }

        // ChatGPT question limit check
        if (session.questionCount >= session.maxQuestions) {
            const limitMsg = session.language === "fr"
                ? "Limite atteinte temporairement."
                : "Limit exceeded temporarily.";
            await sendMessage(senderId, limitMsg);
            return res.status(200).send('EVENT_RECEIVED');
        }

        // Forward question to GPT
        session.questionCount++;
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
            gptReply = session.language === "fr"
                ? "Désolé, je n'ai pas compris votre demande."
                : "Sorry, I didn't understand your request.";
        }

        await sendMessage(senderId, gptReply);
        res.status(200).send('EVENT_RECEIVED');

    } catch (error) {
        console.error("[ERROR]", error.toString());
        res.status(500).send('Server Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[INIT] Server running on port ${PORT}`));
