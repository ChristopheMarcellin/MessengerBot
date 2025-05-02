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
        ? `Déterminez le type de projet exprimé par l'utilisateur. Répondez par B, S, R ou E.\n\n"${userMessage}"`
        : `Determine the user's project type. Reply with B, S, R, or E.\n\n"${userMessage}"`;

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

        const context = {
            senderId,
            message: receivedMessage,
            session: userSessions[senderId],
            cleanText: receivedMessage.toLowerCase().replace(/[^\w\s]/gi, '').trim(),
            greetings: ["bonjour", "salut", "hello", "hi", "comment ca va", "comment ça va"],
            res
        };

        await launchSteps(context);
    } catch (error) {
        console.error("[ERROR]", error);
        res.status(500).send('Server Error');
    }
});
async function launchSteps(context) {
    if (!(await stepCheckEndSession(context))) return;
    if (!(await stepInitializeSession(context))) return;
    if (!(await stepHandleProjectType(context))) return;
    if (!(await stepAskNextSpec(context))) return;
    if (!(await stepSummarizeIfComplete(context))) return;
    await stepFallback(context);
}

async function stepCheckEndSession({ senderId, cleanText, res }) {
    if (cleanText.includes("end session")) {
        console.log(`[RESET] Session for ${senderId}:`, JSON.stringify(userSessions[senderId]?.specValues || {}, null, 2));
        delete userSessions[senderId];
        console.log(`[RESET] Session deleted for sender: ${senderId}`);
        res.status(200).send('EVENT_RECEIVED');
        return false;
    }
    return true;
}

async function stepInitializeSession(context) {
    const { senderId, message, cleanText, greetings } = context;
    if (userSessions[senderId]) return true;

    const prompt = `Detect user's language and project intent. Return JSON like: {"language": "en/fr", "project": "B/S/R/E"}\n\n"${message}"`;
    const detectionResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0
    }, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }
    });

    let lang = "en", project;
    try {
        const parsed = JSON.parse(detectionResponse.data.choices?.[0]?.message?.content?.replace(/```json|```/g, "").trim());
        lang = parsed.language || "en";
        project = parsed.project;
    } catch {
        console.warn("[DETECT] Failed to parse detection result.");
    }

    if (greetings.some(g => cleanText.includes(g))) project = undefined;
    console.log(`[INIT] New session for ${senderId} | Lang: ${lang} | Project: ${project || "undefined"}`);

    userSessions[senderId] = {
        language: lang,
        ProjectDate: new Date().toISOString(),
        questionCount: 1,
        maxQuestions: 40,
        askedSpecs: {},
        specValues: {},
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
    messages: [{
        role: "user",
        content: (lang === "fr"
            ? "Répondez en français : "
            : "Please answer in English: ") + context.message
    }],
    max_tokens: 400,
    temperature: 0.5
}, {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }
});

const fallback = gptResponse.data.choices?.[0]?.message?.content?.trim() || (
    lang === "fr" ? "Désolé, je n'ai pas compris." : "Sorry, I didn't understand."
);
await sendMessage(senderId, fallback);

        return false;
    }

    return true;
}

async function stepHandleProjectType({ senderId, session, message }) {
    if (!session.awaitingProjectType) return true;

    const guess = await tryToClassifyProjectType(session, message);
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
    return true;
}

async function stepAskNextSpec(context) {
    const { senderId, session, message } = context;

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
    console.log(`[DECODE] ${currentSpec} → "${raw}"`);

    const valid = isValidAnswer(raw, session.specValues.projectType, currentSpec);
    updateSpecFromInput(currentSpec, valid ? raw : "?", session.specValues);
    session.askedSpecs[currentSpec] = true;

    if (!valid) {
        const reformulated = session.language === "fr"
            ? `Désolé de vous reposer la question : ${getPromptForSpec(session.specValues.projectType, currentSpec, session.language)}. Assurez-vous de répondre avec un chiffre seulement.`
            : `Sorry to ask again: ${getPromptForSpec(session.specValues.projectType, currentSpec, session.language)}. Please answer with a number only.`;
        await sendMessage(senderId, reformulated);
    } else {
        const next = getNextUnansweredSpec(session);
        session.currentSpec = next;
        if (next) {
            const nextPrompt = getPromptForSpec(session.specValues.projectType, next, session.language);
            console.log(`[PROMPT] Asking for ${next} → "${nextPrompt}"`);
            session.askedSpecs[next] = true;
            await sendMessage(senderId, nextPrompt);
        }
    }

    return false;
}

async function stepSummarizeIfComplete({ senderId, session }) {
    if (!session.completedSpecs && allSpecsCollected(session) && session.specValues.projectType !== "?") {
        session.completedSpecs = true;
        const summary = buildSpecSummary(session, session.language);
        if (summary && summary.trim()) {
            await sendMessage(senderId, summary);
        }
        return false;
    }
    return true;
}

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
            ? "Répondez en français : "
            : "Please answer in English: ") + message
    }],
    max_tokens: 400,
    temperature: 0.5
}, {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }
});

const gptReply = chatGptResponse.data.choices?.[0]?.message?.content?.trim() || (
    session.language === "fr"
        ? "Désolé, je n'ai pas compris."
        : "Sorry, I didn’t understand."
);
await sendMessage(senderId, gptReply);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[INIT] Server running on port ${PORT}`));
