// index.js – Corrected version with all required steps active up to stepHandleSpecAnswer
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const { sendMessage } = require('./modules/messenger');
const { getSession, setSession, clearSession } = require('./modules/sessionStore');
const { setProjectType, initializeSpecFields } = require('./modules/utils');
const { runDirector } = require('./modules/director');

/*
const {
    getNextUnansweredSpec,
    shouldAskNextSpec,
    updateSpecFromInput,
    buildSpecSummary,
    resetInvalidSpecs,
    getPromptForSpec,
} = require('./modules/specEngine');
*/

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
        console.log(`[DEBUG] lastUserMessage = "${session?.lastUserMessage}"`);
        console.log(`[DEBUG] message reçu = "${receivedMessage}"`);

        // 🔒 Boucle spéciale: blocage répété de "end session"
        if (session && receivedMessage.toLowerCase() === 'end session' && session.lastUserMessage === receivedMessage) {
            console.log(`[SKIP] Boucle bloquée pour "end session" répété`);
            return res.sendStatus(200);
        }

        // 🔁 Filtrage des messages répétés (utilisateur ou Messenger)
        if (session && session.lastUserMessage === receivedMessage) {
            const waitingForInput =
                session.currentSpec !== null ||
                ["?", "E"].includes(session.projectType) ||
                session.awaitingProjectTypeAttempt;
            if (!waitingForInput) {
                console.log(`[SKIP] Message répété ignoré: "${receivedMessage}"`);
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
        context.message = receivedMessage; // protection absolue
        console.log(`[DEBUG] Message transmis au directeur: "${context.message}"`);
        const triggered = await runDirector(context);
        if (triggered) {
            console.log('[INDEX] Le directeur a détecté un scénario actif.');
        } else {
            console.log('[INDEX] Aucun scénario détecté par le directeur.');
        }

    } catch (error) {
        console.error("[ERROR]", error);
        res.status(500).send('Server Error');
    }
});

/*
// === Optionnel : séquence de steps (désactivée actuellement)
async function launchSteps(context) {
    const steps = [
        stepCheckEndSession,
        stepInitializeSession,
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
*/

// === Start Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[INIT] Server running on port ${PORT}`));
