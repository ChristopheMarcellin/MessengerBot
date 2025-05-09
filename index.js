// === Load env + dependencies ===
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

const { sendMessage, sendMarkSeen } = require('./modules/messenger');
const { getSession, setSession } = require('./modules/sessionStore');
const { runDirector } = require('./modules/director');

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

        const senderId = messagingEvent.sender?.id;
        const receivedMessage = messagingEvent.message?.text?.trim();
        const timestamp = messagingEvent.timestamp;

        if (!senderId || !receivedMessage || !timestamp) return res.sendStatus(200);

        // 1️⃣ ÉCHO — on bloque immédiatement
        if (messagingEvent.message?.is_echo) {
            console.log(`[ECHO] Skipping bot echo: "${messagingEvent.message.text}"`);
            return res.sendStatus(200);
        }

        // 2️⃣ Système → pas un vrai message utilisateur
        if (messagingEvent.delivery || messagingEvent.read) return res.sendStatus(200);

        // 3️⃣ Message trop vieux
        const ageMs = Date.now() - timestamp;
        const ageMin = Math.floor(ageMs / 60000);
        if (ageMin > 10) {
            console.log(`[SKIP] Message ancien ignoré (age: ${ageMin} min)`);
            await sendMarkSeen(senderId);
            return res.sendStatus(200);
        }

        // 4️⃣ Ack immédiat pour éviter l'empilement côté Messenger
        await sendMarkSeen(senderId);

        // 5️⃣ Préparation du contexte
        const cleanText = receivedMessage.toLowerCase().replace(/[^\w\s]/gi, '').trim();
        const session = getSession(senderId) || {};
        const isEndSession = cleanText === 'end session';

        // 6️⃣ Hard block : répétition stricte du même message, sauf "end session"
        if (!isEndSession && session.lastUserMessage === receivedMessage) {
            console.log(`[HARD BLOCK] Répétition bloquée de "${receivedMessage}"`);
            return res.sendStatus(200);
        }

        // 7️⃣ Mémorisation du message
        session.lastUserMessage = receivedMessage;
        setSession(senderId, session);

        const context = {
            senderId,
            message: receivedMessage,
            cleanText,
            greetings: ["bonjour", "salut", "hello", "hi", "comment ca va"],
            res
        };

        // 8️⃣ Exécution de la logique principale
        console.log(`[RECEIVED] From: ${senderId} | Message: "${receivedMessage}"`);
        console.log(`[DEBUG] Message transmis au directeur`);
        await runDirector(context);

        // 9️⃣ Réponse déjà traitée par les steps
        return res.sendStatus(200);
    } catch (error) {
        console.error("[ERROR]", error);
        res.status(500).send('Server Error');
    }
});

// === Start Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[INIT] Server running on port ${PORT}`));
