require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const { getNextUnansweredSpec, updateSpecFromInput, buildSpecSummary, getPromptForSpec, isValidAnswer } = require('./modules/specEngine');
const { setProjectType, initializeSpecFields } = require('./modules/utils');
const { sendMessage } = require('./modules/messenger');
const { resetIncompleteSpecs } = require('./modules/resetUtils');
const {
    stepInitializeSession,
    stepHandleProjectType,
    stepAskNextSpec,
    stepSummarizeIfComplete,
    stepCheckEndSession,
    stepFallback
} = require('./modules/steps');
const { getSession, setSession, deleteSession } = require('./modules/sessionStore');

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
        if (session && session.lastMessage === receivedMessage) {
            console.log(`[SKIP] Duplicate message ignored: "${receivedMessage}"`);
            return res.sendStatus(200);
        }
        if (session) {
            session.lastMessage = receivedMessage;
            setSession(senderId, session);
        }

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
    if (!(await stepCheckEndSession(context))) return;
    if (!(await stepInitializeSession(context))) return;
    if (!(await stepHandleProjectType(context))) return;
    if (!(await stepAskNextSpec(context))) return;
    if (!(await stepSummarizeIfComplete(context))) return;
    await stepFallback(context);
}

// === Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[INIT] Server running on port ${PORT}`));
