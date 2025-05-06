// index.js – Corrected version with all required steps active up to stepHandleSpecAnswer
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const { sendMessage } = require('./modules/messenger');
const { getSession, setSession, clearSession } = require('./modules/sessionStore');
const { setProjectType, initializeSpecFields } = require('./modules/utils');
const {
    getNextUnansweredSpec,
    shouldAskNextSpec,
    updateSpecFromInput,
    buildSpecSummary,
    resetInvalidSpecs,
    getPromptForSpec,
} = require('./modules/specEngine');

const {
    stepCheckEndSession,
    stepHandleUserQuestions,
    stepHandleProjectType,
    stepHandleSpecAnswer,
} = require('./steps');

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

app.get('/', (req, res) => res.send('Bot server is running.'));

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[VERIFY] Webhook verified');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// === Webhook ===
app.post('/webhook', async (req, res) => {
    try {
        const messagingEvent = req.body.entry?.[0]?.messaging?.[0];

        if (!messagingEvent) return res.sendStatus(200);
        if (messagingEvent.message?.is_echo) {
            console.log(`[ECHO] Skipping bot echo: "${messagingEvent.message.text}"`);
            return res.sendStatus(200);
        }
        if (messagingEvent.delivery || messagingEvent.read) return res.sendStatus(200);

        const senderId = messagingEvent.sender?.id;
        const receivedMessage = messagingEvent.message?.text?.trim();
        if (!receivedMessage || !senderId) return res.sendStatus(200);

        const session = getSession(senderId);

        // filtrage intelligent des doublons (mise à jour avec protection élargie)
        if (session && session.lastUserMessage === receivedMessage) {
            const waitingForInput =
                session.currentSpec !== null ||
                ["?", "E"].includes(session.specValues?.projectType) ||
                session.awaitingProjectTypeAttempt;
            if (!waitingForInput) {
                console.log(`[SKIP] Duplicate message ignored: "${receivedMessage}"`);
                return res.sendStatus(200);
            }
        }

        if (session) session.lastUserMessage = receivedMessage;

        const cleanText = receivedMessage.toLowerCase().replace(/[^\w\s]/gi, '').trim();
        console.log(`[RECEIVED] From: ${senderId} | Message: "${receivedMessage}"`);

        const context = {
            senderId,
            message: receivedMessage,
            session,
            cleanText,
            greetings: ["bonjour", "salut", "hello", "hi", "comment ca va"],
            res
        };

        await launchSteps(context);
    } catch (error) {
        console.error("[ERROR]", error);
        res.status(500).send('Server Error');
    }
});

async function launchSteps(context) {
    const steps = [
        stepInitializeSession,
        stepCheckEndSession,
        stepHandleUserQuestions,
        stepHandleProjectType,
        stepHandleSpecAnswer,
        // stepAskNextSpec,
        // stepConfirmSummary,
        // stepCollectContact,
        // stepSignoff,
    ];

    for (const step of steps) {
        console.log(`[STEP] Starting ${step.name}()`);
        const proceed = await step(context);
        if (!proceed) break;
    }
}

async function stepInitializeSession(context) {
    const { senderId, message, cleanText } = context;

    let session = getSession(senderId);
    if (!session) {
        session = { lang: 'fr', projectType: undefined, specValues: {}, questionCount: 0 };
        setProjectType(session, undefined, 'initial');
        initializeSpecFields(session);
        setSession(senderId, session);
        console.log(`[INIT] New session for ${senderId} | Lang: ${session.lang} | Project: ${session.projectType}`);
    }
    context.session = session;
    return true;
}

// === Start Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[INIT] Server running on port ${PORT}`));
