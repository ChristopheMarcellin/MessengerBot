require('dotenv').config();
const {
    getNextUnansweredSpec,
    shouldAskNextSpec,
    updateSpecFromInput,
    buildSpecSummary,
    resetInvalidSpecs,
    getPromptForSpec,
} = require('./modules/specEngine');

const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = 'helloworldtoken';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const userSessions = {};

function resetIncompleteSpecs(session) {
    for (const key in session.specValues) {
        if (key !== "projectType") {
            session.specValues[key] = "?";
            session.askedSpecs[key] = false;
        }
    }
}

function allSpecsCollected(session) {
    return !getNextUnansweredSpec(session);
}

function initializeSpecFields(session) {
    const type = session.specValues.projectType;
    if (!["B", "S", "R"].includes(type)) return;
    if (!session.specValues || Object.keys(session.specValues).length <= 1) {
        if (type === "B") {
            session.specValues = { projectType: "B", price: null, bedrooms: null, bathrooms: null, garage: null, location: null };
        } else if (type === "S") {
            session.specValues = { projectType: "S", price: null, bedrooms: null, bathrooms: null, garage: null, location: null };
        } else if (type === "R") {
            session.specValues = { projectType: "R", price: null, bedrooms: null, bathrooms: null, parking: null, location: null };
        }
    }
}

async function tryToClassifyProjectType(session, userMessage) {
    const prompt = session.language === "fr"
        ? "Quel est le type de projet de l'utilisateur ? Répondez simplement par B, S, R ou E."
        : "What is the user's project type? Reply with B, S, R or E.";
    const classifyRes = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o",
        messages: [{ role: "user", content: `${prompt}\n\n"${userMessage}"` }],
        max_tokens: 10,
        temperature: 0
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
    });

    const raw = classifyRes.data.choices?.[0]?.message?.content?.trim().toUpperCase();
    console.log(`[CLASSIFY] Raw classification result: ${raw}`);
    if (["B", "S", "R"].includes(raw)) {
        session.specValues.projectType = raw;
    } else if (session.awaitingProjectType === "firstTry") {
        session.specValues.projectType = "?";
    } else {
        session.specValues.projectType = "E";
    }
    session.askedSpecs.projectType = true;
    delete session.awaitingProjectType;
    console.log(`[CLASSIFY] Final projectType: ${session.specValues.projectType}`);

    initializeSpecFields(session);
}

async function sendMessage(senderId, text) {
    console.log(`[SEND] To: ${senderId} | Message: ${text}`);
    await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
        recipient: { id: senderId },
        message: { text }
    }, {
        headers: { 'Content-Type': 'application/json' }
    });
}

app.post('/webhook', async (req, res) => {
    try {
        const messagingEvent = req.body.entry?.[0]?.messaging?.[0];

        if (!messagingEvent || messagingEvent.message?.is_echo || messagingEvent.delivery || messagingEvent.read) {
            return res.status(200).send('EVENT_RECEIVED');
        }

        const senderId = messagingEvent.sender?.id;
        const receivedMessage = messagingEvent.message?.text?.trim();
        if (!receivedMessage || !senderId) return res.status(200).send('EVENT_RECEIVED');

        const session = userSessions[senderId];
        const currentType = session?.specValues?.projectType;

        console.log(`[RECEIVED] From: ${senderId} | Message: ${receivedMessage}`);
        console.log(`[TRACK] From ${senderId} | Message: "${receivedMessage}"`);
        console.log(`[STATE] Specs: ${JSON.stringify(session?.specValues || {}, null, 2)}`);

        if (receivedMessage.toLowerCase().includes("end session")) {
            console.log(`[RESET] Session for ${senderId} before deletion: ${JSON.stringify(session?.specValues || {}, null, 2)}`);
            delete userSessions[senderId];
            console.log(`[RESET] Session deleted for sender: ${senderId}`);
            return res.status(200).send('EVENT_RECEIVED');
        }

        if (!userSessions[senderId]) {
            const detectionPrompt = `Detect the user's language and intent. Return JSON with "language": "en/fr" and "project": "B/S/R/E".\n\n"${receivedMessage}"`;
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

            let language = "en", project;
            try {
                const parsed = JSON.parse(detectionText);
                language = parsed.language || "en";
                project = parsed.project;
            } catch {
                console.warn("[DETECT] Failed to parse detection result:", detectionText);
            }

            const genericGreetings = ["bonjour", "salut", "hello", "hi", "comment ca va", "comment ça va"];
            const cleanMessage = receivedMessage.toLowerCase().replace(/[^\w\s]/gi, '').trim();
            if (genericGreetings.some(g => cleanMessage.includes(g))) {
                console.log("[DETECT] Greeting detected. Ignoring project classification.");
                project = undefined;
            }

            console.log(`[INIT] New session for ${senderId} | Lang: ${language} | Project: ${project || "undefined"}`);

            userSessions[senderId] = {
                language,
                ProjectDate: new Date().toISOString(),
                questionCount: 1,
                maxQuestions: 40,
                askedSpecs: {},
                specValues: {
                    projectType: project
                }
            };

            initializeSpecFields(userSessions[senderId]);

            if (typeof project === "undefined") {
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
                    gptReply = language === "fr"
                        ? "Désolé, je n'ai pas compris votre demande."
                        : "Sorry, I didn't understand your request.";
                }
                await sendMessage(senderId, gptReply);

                const politePrompt = language === "fr"
                    ? "Puis-je vous demander quel type de projet vous avez en tête ? Achat, vente, location ou autre ?"
                    : "May I ask what type of project you have in mind? Buying, selling, renting, or something else?";
                await sendMessage(senderId, politePrompt);
                userSessions[senderId].awaitingProjectType = "firstTry";
                return res.status(200).send('EVENT_RECEIVED');
            }
        }

        const sessionReloaded = userSessions[senderId];

        if (sessionReloaded.awaitingProjectType) {
            await tryToClassifyProjectType(sessionReloaded, receivedMessage);
            return res.status(200).send('EVENT_RECEIVED');
        }

        if (!sessionReloaded.askedSpecs.projectType && sessionReloaded.specValues.projectType === "?") {
            const politePrompt = sessionReloaded.language === "fr"
                ? "Pouvez-vous préciser votre type de projet ? Achat, vente, location ou autre ?"
                : "Could you clarify what type of project you have in mind? Buying, selling, renting, or something else?";
            await sendMessage(senderId, politePrompt);
            sessionReloaded.awaitingProjectType = "secondTry";
            return res.status(200).send('EVENT_RECEIVED');
        }

        if (sessionReloaded.questionCount >= sessionReloaded.maxQuestions) {
            const msg = sessionReloaded.language === "fr"
                ? "Limite atteinte temporairement."
                : "Limit exceeded temporarily.";
            await sendMessage(senderId, msg);
            return res.status(200).send('EVENT_RECEIVED');
        }

        const nextSpec = getNextUnansweredSpec(sessionReloaded);
        console.log(`[NEXT] Next unanswered spec: ${nextSpec}`);

        if (nextSpec) {
            const decodePrompt = `What is the value for: ${nextSpec}?\n\n"${receivedMessage}"`;
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

            const raw = decodeRes.data.choices?.[0]?.message?.content?.trim();
            console.log(`[DECODE] ${nextSpec} → "${raw}"`);
            const valid = raw && raw !== "?";
            updateSpecFromInput(nextSpec, valid ? raw : "?", sessionReloaded.specValues);
            sessionReloaded.askedSpecs[nextSpec] = true;

            if (!valid) {
                const retry = sessionReloaded.language === "fr"
                    ? "Désolé, je n'ai pas compris. Pouvez-vous clarifier ?"
                    : "Sorry, I didn’t understand. Could you clarify?";
                await sendMessage(senderId, retry);
            } else {
                const next = getNextUnansweredSpec(sessionReloaded);
                if (next) {
                    const question = getPromptForSpec(sessionReloaded.specValues.projectType, next, sessionReloaded.language || 'en');
                    console.log(`[PROMPT] Asking for ${next} → "${question}"`);
                    sessionReloaded.askedSpecs[next] = true;
                    await sendMessage(senderId, question);
                }
            }
            return res.status(200).send('EVENT_RECEIVED');
        }

        if (!sessionReloaded.completedSpecs && allSpecsCollected(sessionReloaded)) {
            sessionReloaded.completedSpecs = true;
            console.log(`[SUMMARY] Spec values for ${senderId}:`, JSON.stringify(sessionReloaded.specValues, null, 2));
            const summary = buildSpecSummary(sessionReloaded, sessionReloaded.language || 'en');
            if (!summary || summary.trim() === "") {
                console.warn(`[SUMMARY] Skipped empty summary for ${senderId}`);
                return res.status(200).send('EVENT_RECEIVED');
            }
            await sendMessage(senderId, summary);
            return res.status(200).send('EVENT_RECEIVED');
        }

        if (sessionReloaded.completedSpecs && receivedMessage.toLowerCase().includes("no")) {
            resetIncompleteSpecs(sessionReloaded);
            sessionReloaded.completedSpecs = false;
            await sendMessage(senderId, sessionReloaded.language === "fr"
                ? "Merci de nous l'avoir signalé. Reprenons les informations manquantes."
                : "Thanks for letting us know. Let's go over the missing details again.");
            return res.status(200).send('EVENT_RECEIVED');
        }

        if (sessionReloaded.completedSpecs && receivedMessage.toLowerCase().includes("yes")) {
            sessionReloaded.wantsContact = "Y";
            sessionReloaded.signoffStep = "firstName";
            await sendMessage(senderId, sessionReloaded.language === "fr"
                ? "Merci. Pouvez-vous me donner votre prénom ?"
                : "Thank you. Can you please tell me your first name?");
            return res.status(200).send('EVENT_RECEIVED');
        }

        sessionReloaded.questionCount++;
        console.log(`[FALLBACK] Open-ended GPT query`);
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
            gptReply = sessionReloaded.language === "fr"
                ? "Désolé, je n'ai pas compris votre demande."
                : "Sorry, I didn't understand your request.";
        }

        await sendMessage(senderId, gptReply);
        res.status(200).send('EVENT_RECEIVED');

    } catch (error) {
        console.error("[ERROR]", error);
        res.status(500).send('Server Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[INIT] Server running on port ${PORT}`));
