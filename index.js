require('dotenv').config();
const {
    getNextUnansweredSpec,
    shouldAskNextSpec,
    updateSpecFromInput,
    buildSpecSummary,
    resetInvalidSpecs,
    getPromptForSpec,
    isValidAnswer
} = require('./modules/specEngine');

const displayMap = require('./modules/displayMap');
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const VERIFY_TOKEN = 'helloworldtoken';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const userSessions = {};

function setProjectType(session, value, reason = "unspecified") {
    const previous = session.specValues?.projectType ?? "undefined";
    session.specValues.projectType = value;
    console.log(`[TRACK] projectType changed from ${previous} to ${value} | reason: ${reason}`);
}

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
    const type = session.specValues?.projectType;
    const allQuestions = require('./modules/questions');
    const fields = allQuestions?.[type];

    if (!type || !fields) return;

    if (!session.specValues || Object.keys(session.specValues).length <= 1) {
        session.specValues = { projectType: type };
        Object.keys(fields).forEach(key => {
            session.specValues[key] = "?";
        });
    }
}

async function tryToClassifyProjectType(session, userMessage) {
    const prompt = session.language === "fr"
        ? `Déterminez le type de projet exprimé par l'utilisateur dans le message suivant. Répondez UNIQUEMENT par une lettre :
- B pour un achat
- S pour une vente
- R pour une location
- E si ce n'est pas clair (salutations, vagues, etc.)

Message :
"${userMessage}"`
        : `Determine the user's project type. Reply with:
- B for buying
- S for selling
- R for renting
- E if unclear (greeting, vague, etc.)

Message: "${userMessage}"`;

    const classifyRes = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 10,
        temperature: 0
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
    });

    return classifyRes.data.choices?.[0]?.message?.content?.trim().toUpperCase();
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

        const greetings = ["bonjour", "salut", "hello", "hi", "comment ca va", "comment ça va"];
        const clean = receivedMessage.toLowerCase().replace(/[^\w\s]/gi, '').trim();

        // END SESSION
        if (clean.includes("end session")) {
            console.log(`[RESET] Session for ${senderId} before deletion: ${JSON.stringify(userSessions[senderId]?.specValues || {}, null, 2)}`);
            delete userSessions[senderId];
            console.log(`[RESET] Session deleted for sender: ${senderId}`);
            return res.status(200).send('EVENT_RECEIVED');
        }

        // INIT SESSION
        if (!userSessions[senderId]) {
            const detectionPrompt = `Detect user's language and project intent. Return JSON like: {"language": "en/fr", "project": "B/S/R/E"}\n\n"${receivedMessage}"`;

            const detectionResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-4o",
                messages: [{ role: "user", content: detectionPrompt }],
                max_tokens: 100,
                temperature: 0
            }, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }
            });

            let lang = "en", project;
            let json = detectionResponse.data.choices?.[0]?.message?.content?.replace(/```json|```/g, "").trim();
            try {
                const parsed = JSON.parse(json);
                lang = parsed.language || "en";
                project = parsed.project;
            } catch {
                console.warn("[DETECT] Failed to parse detection result:", json);
            }

            if (greetings.some(g => clean.includes(g))) project = undefined;

            console.log(`[INIT] New session for ${senderId} | Lang: ${lang} | Project: ${project || "undefined"}`);
            userSessions[senderId] = {
                language: lang,
                ProjectDate: new Date().toISOString(),
                questionCount: 1,
                maxQuestions: 40,
                askedSpecs: {},
                specValues: {}
            };

            const session = userSessions[senderId];
            const finalProject = ["B", "S", "R"].includes(project) ? project : "?";

            if (finalProject !== "?") {
                setProjectType(session, finalProject, "GPT session init (confident)");
                initializeSpecFields(session);
            } else {
                setProjectType(session, "?", project === "E" ? "E → forced ?" : "fallback → ?");
                session.awaitingProjectType = "firstTry";

                const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
                    model: "gpt-4o",
                    messages: [{ role: "user", content: receivedMessage }],
                    max_tokens: 400,
                    temperature: 0.5
                }, {
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }
                });

                const fallback = gptResponse.data.choices?.[0]?.message?.content?.trim() || (
                    lang === "fr" ? "Désolé, je n'ai pas compris." : "Sorry, I didn't understand."
                );
                await sendMessage(senderId, fallback);

                const ask = lang === "fr"
                    ? "Quelle est le but de votre projet 1-acheter, 2-vendre, 3-louer, 4-autre raison, svp indiquer seulement le numéro de votre but."
                    : "What is the goal of your project? 1-buying, 2-selling, 3-renting, 4-other. Please reply with the number.";
                await sendMessage(senderId, ask);
                return res.status(200).send('EVENT_RECEIVED');
            }
        }

        const session = userSessions[senderId];

        // PROJECT TYPE clarification
        if (session.awaitingProjectType) {
            const guess = await tryToClassifyProjectType(session, receivedMessage);
            if (["B", "S", "R"].includes(guess)) {
                setProjectType(session, guess, "GPT classification (follow-up)");
                initializeSpecFields(session);
            } else if (guess === "E" && session.awaitingProjectType === "firstTry") {
                setProjectType(session, "?", "E → forced ?");
            } else {
                setProjectType(session, "E", "classification fallback");
            }
            session.askedSpecs.projectType = true;
            delete session.awaitingProjectType;
        }

        if (!session.askedSpecs.projectType && session.specValues.projectType === "?") {
            const ask = session.language === "fr"
                ? "Quelle est le but de votre projet 1-acheter, 2-vendre, 3-louer, 4-autre raison, svp indiquer seulement le numéro de votre but."
                : "What is the goal of your project? 1-buying, 2-selling, 3-renting, 4-other. Please reply with the number.";
            await sendMessage(senderId, ask);
            session.awaitingProjectType = "secondTry";
            return res.status(200).send('EVENT_RECEIVED');
        }

        if (session.questionCount >= session.maxQuestions) {
            await sendMessage(senderId, session.language === "fr" ? "Limite atteinte." : "Limit exceeded.");
            return res.status(200).send('EVENT_RECEIVED');
        }

        const currentSpec = getNextUnansweredSpec(session);
        if (currentSpec) {
            const decodePrompt = `${getPromptForSpec(session.specValues.projectType, currentSpec, session.language)}\n\n"${receivedMessage}"`;

            const decodeRes = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-4o",
                messages: [{ role: "user", content: decodePrompt }],
                max_tokens: 10,
                temperature: 0
            }, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }
            });

            const raw = decodeRes.data.choices?.[0]?.message?.content?.trim() || "?";
            console.log(`[DECODE] ${currentSpec} → "${raw}"`);

            const valid = isValidAnswer(raw, session.specValues.projectType, currentSpec);
            updateSpecFromInput(currentSpec, valid ? raw : "?", session.specValues);
            session.askedSpecs[currentSpec] = true;

            if (!valid) {
                await sendMessage(senderId, session.language === "fr"
                    ? "Désolé, je n'ai pas compris. Veuillez répondre avec un nombre seulement."
                    : "Sorry, I didn’t understand. Please reply with a number only.");
            } else {
                const next = getNextUnansweredSpec(session);
                if (next) {
                    const nextPrompt = getPromptForSpec(session.specValues.projectType, next, session.language);
                    console.log(`[PROMPT] Asking for ${next} → "${nextPrompt}"`);
                    session.askedSpecs[next] = true;
                    await sendMessage(senderId, nextPrompt);
                }
            }
            return res.status(200).send('EVENT_RECEIVED');
        }

        // All specs done: summary
        if (!session.completedSpecs && allSpecsCollected(session)) {
            session.completedSpecs = true;
            const summary = buildSpecSummary(session, session.language);
            if (summary && summary.trim()) {
                await sendMessage(senderId, summary);
            }
            return res.status(200).send('EVENT_RECEIVED');
        }

        // Correction
        if (session.completedSpecs && receivedMessage.toLowerCase().includes("no")) {
            resetIncompleteSpecs(session);
            session.completedSpecs = false;
            await sendMessage(senderId, session.language === "fr"
                ? "Merci, reprenons les infos manquantes."
                : "Thanks, let’s go over the missing info.");
            return res.status(200).send('EVENT_RECEIVED');
        }

        // Collect contact
        if (session.completedSpecs && receivedMessage.toLowerCase().includes("yes")) {
            session.wantsContact = "Y";
            session.signoffStep = "firstName";
            await sendMessage(senderId, session.language === "fr"
                ? "Merci. Pouvez-vous me donner votre prénom ?"
                : "Thank you. What’s your first name?");
            return res.status(200).send('EVENT_RECEIVED');
        }



        session.questionCount++;
        const chatGptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [{ role: "user", content: receivedMessage }],
            max_tokens: 400,
            temperature: 0.5
        }, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }
        });

        const gptReply = chatGptResponse.data.choices?.[0]?.message?.content?.trim() || (
            session.language === "fr" ? "Désolé, je n'ai pas compris." : "Sorry, I didn’t understand."
        );
        await sendMessage(senderId, gptReply);
        res.status(200).send('EVENT_RECEIVED');

    } catch (error) {
        console.error("[ERROR]", error);
        res.status(500).send('Server Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[INIT] Server running on port ${PORT}`));
