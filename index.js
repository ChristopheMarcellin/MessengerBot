// bon dernier backup

// === Load env + dependencies ===
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

const axios = require('axios');
const { getNextUnansweredSpec, updateSpecFromInput, buildSpecSummary, getPromptForSpec, isValidAnswer } = require('./modules/specEngine');
const { setProjectType, initializeSpecFields } = require('./modules/utils');
const { sendMessage } = require('./modules/messenger');
const {
    stepInitializeSession,
    stepHandleProjectType,
    stepHandleSpecAnswer,       
    stepAskNextSpec,
    stepSummarizeAndConfirm,     
    stepCollectContact,          
    stepCheckEndSession,
    stepHandleFallback
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

// === Logger ===
function logSessionState(senderId, session) {
    if (!session) return;
    console.log(`[STATE] Session ${senderId}`);
    console.log(` - projectType: ${session.specValues?.projectType}`);
    console.log(` - currentSpec: ${session.currentSpec || "(none)"}`);
    console.log(` - specValues:`, JSON.stringify(session.specValues, null, 2));
}

// === Main Launch Sequence ===

async function launchSteps(context) {
    const { senderId } = context;

    console.log(`\n=== [LAUNCH STEPS for ${senderId}] ===`);
    logSessionState(senderId, getSession(senderId));

    if (!stepCheckEndSession(context)) return;
    logSessionState(senderId, getSession(senderId));

    if (!await stepInitializeSession(context)) return;
    logSessionState(senderId, getSession(senderId));

    if (!stepHandleProjectType(context)) return;
    logSessionState(senderId, getSession(senderId));
/*
    if (!stepHandleSpecAnswer(context)) return;
    logSessionState(senderId, getSession(senderId));

    if (!stepAskNextSpec(context)) return;
    logSessionState(senderId, getSession(senderId));

    if (!stepSummarizeAndConfirm(context)) return;
    logSessionState(senderId, getSession(senderId));

    if (!stepCollectContact(context)) return;
    logSessionState(senderId, getSession(senderId));

    if (!stepHandleFallback(context)) return;
    logSessionState(senderId, getSession(senderId));
    */
}

/*
async function launchSteps({ senderId, message }) {
    logSessionState(senderId); // Facultatif pour debug

    if (!stepCheckEndSession({ senderId, message })) return;
    if (!await stepInitializeSession({ senderId, message })) return;
    if (!stepHandleProjectType({ senderId, message })) return;
    if (!stepHandleSpecAnswer({ senderId, message })) return;
    if (!stepAskNextSpec({ senderId })) return;
    if (!stepSummarizeAndConfirm({ senderId, message })) return;
    if (!stepCollectContact({ senderId, message })) return;
    if (!stepHandleFallback({ senderId, message })) return;
}
*/

// === Start Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[INIT] Server running on port ${PORT}`));
