// === Load env + dependencies ===
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

const axios = require('axios');
const {
    getNextUnansweredSpec,
    updateSpecFromInput,
    buildSpecSummary,
    getPromptForSpec,
    isValidAnswer
} = require('./modules/specEngine');
const {
    setProjectType,
    initializeSpecFields,
    tryToClassifyProjectType
} = require('./modules/utils');
const { resetIncompleteSpecs } = require('./modules/resetUtils');
const { sendMessage } = require('./modules/messenger');
const {
    stepInitializeSession,
    stepHandleProjectType,
    stepAskNextSpec,
    stepSummarizeIfComplete,
    stepCheckEndSession,
    stepFallback
} = require('./modules/steps');

const userSessions = {};

// === Debugging Helper ===
function logSessionState(senderId, session) {
    if (!session) {
        console.log(`[STATE] No session found for ${senderId}`);
        return;
    }

    console.log(`[STATE] Session summary for ${senderId}:`);
    console.log(`  - projectType: ${session.specValues?.projectType}`);
    const keys = Object.keys(session.specValues || {});
    for (const key of keys) {
        if (key !== 'projectType') {
            const val = session.specValues[key];
            const asked = session.askedSpecs?.[key] ? 'asked' : 'not asked';
            console.log(`    - ${key}: "${val}" (${asked})`);
        }
    }
}

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

        const session = userSessions[senderId];
        if (session && session.lastMessage === receivedMessage) {
            console.log(`[SKIP] Duplicate message ignored: "${receivedMessage}"`);
            return res.sendStatus(200);
        }
        if (session) session.lastMessage = receivedMessage;

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

// === Main Launch Sequence ===
async function launchSteps(context) {
    logSessionState(context.senderId, context.session);
    if (!(await stepCheckEndSession(context))) return;

    logSessionState(context.senderId, context.session);
    if (!(await stepInitializeSession(context))) return;

    logSessionState(context.senderId, context.session);
    if (!(await stepHandleProjectType(context))) return;

    logSessionState(context.senderId, context.session);
    if (!(await stepAskNextSpec(context))) return;

    logSessionState(context.senderId, context.session);
    if (!(await stepSummarizeIfComplete(context))) return;

    logSessionState(context.senderId, context.session);
    await stepFallback(context);
}

// === Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[INIT] Server running on port ${PORT}`));
