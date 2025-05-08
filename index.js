// bon dernier backup 2025-05-08 1h48 am

// === Load env + dependencies ===
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const { sendMessage, sendMarkSeen, sendTypingOn } = require('./modules/messenger');
const { getSession, setSession } = require('./modules/sessionStore');
const { setProjectType, initializeSpecFields } = require('./modules/utils');
const { runDirector } = require('./modules/director');
const { stepInitializeSession } = require('./modules/steps');

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// === Webhook Verification ===
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

// === Webhook POST ===
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
        const timestamp = messagingEvent.timestamp;

        if (!receivedMessage || !senderId || !timestamp) return res.sendStatus(200);

        // 🕓 Vérification de l'âge du message
        const ageMs = Date.now() - timestamp;
        const ageMin = Math.floor(ageMs / 60000);
        if (ageMin > 10) {
            console.log(`[SKIP] Message ancien ignoré (age: ${ageMin} min)`);
            await sendMarkSeen(senderId);
            return res.sendStatus(200);
        }

        const cleanText = receivedMessage.toLowerCase().replace(/[^\w\s]/gi, '').trim();
        console.log(`[RECEIVED] From: ${senderId} | Message: "${receivedMessage}"`);

        const context = {
            senderId,
            message: receivedMessage,
            cleanText,
            greetings: ["bonjour", "salut", "hello", "hi", "comment ca va"],
            res
        };

        // ✅ Initialisation complète de la session
        await stepInitializeSession(context);
        const session = context.session;

        // 🔒 Blocage strict : si message déjà reçu → ignorer
        if (session?.lastUserMessage === receivedMessage) {
            console.log(`[HARD BLOCK] Répétition bloquée de "${receivedMessage}"`);
            return res.sendStatus(200);
        }

        // 🧠 Stockage immédiat du message reçu
        session.lastUserMessage = receivedMessage;

        // 👁 Accusé de réception silencieux
        await sendMarkSeen(senderId);

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

// === Start Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[INIT] Server running on port ${PORT}`));
