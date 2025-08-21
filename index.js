// === Load env 
//+ dependencies ===
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

const { sendMessage, sendMarkSeen } = require('./modules/messenger');
const { getSession } = require('./modules/sessionStore');
const { runDirector } = require('./modules/director');
const {
    isValidIncomingMessage,
    shouldSkipMessage,
    setLastPayload
} = require('./filters');


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
    const botEnabled = (process.env.BOT_ENABLED || '').trim().toLowerCase() === 'true';
//    console.log(`[DEBUG] BOT_ENABLED = ${process.env.BOT_ENABLED} → interpreted as ${botEnabled}`);

    if (!botEnabled) {
  //      console.log('[SAFE MODE] Bot désactivé — traitement ignoré');
        return res.sendStatus(200);
    }

    try {
        const messagingEvent = req.body.entry?.[0]?.messaging?.[0];
        if (!messagingEvent) return res.sendStatus(200);

        // 🔒 Protection centralisée
        if (!isValidIncomingMessage(messagingEvent)) {
        //    console.warn('[SKIP] Message ignoré : echo, vide, invalide ou système');
            return res.sendStatus(200);
        }

        const senderId = messagingEvent.sender?.id;
        const receivedMessage = messagingEvent.message?.text?.trim();     
        const timestamp = messagingEvent.timestamp;
       
     //   console.log(`[RECEIVED-RAW] From ${senderId} | Message: "${receivedMessage}" @ ${timestamp}`);

        // ✅ ACK systématique
        await sendMarkSeen(senderId);
     //   console.log(`[ACK] mark_seen → ${senderId}`);
        // 3️⃣ Préparation du contexte
        const cleanText = receivedMessage.toLowerCase().replace(/[^\w\s]/gi, '').trim();
        const session = getSession(senderId) || {};
        const isEndSession = cleanText === 'end session';

        // 4️⃣ Mémorisation brute du message

        if (shouldSkipMessage(session, receivedMessage, timestamp)) {
            return res.sendStatus(200);
        }

        setLastPayload(session, receivedMessage, timestamp);

        session.lastUserMessage = receivedMessage;

        const context = {
            senderId,
            message: receivedMessage,
            timestamp,
            cleanText,
            greetings: ["bonjour", "salut", "hello", "hi", "comment ca va"],
            timestamp,
            res
        };

        // 5️⃣ Exécution de la logique principale
        console.log(`[RECEIVED] From: ${senderId} | Message: "${receivedMessage}"`);
  //      console.log(`[DEBUG] Message transmis au directeur`);
        await runDirector(context);

        return res.sendStatus(200);
    } catch (error) {
        console.error("[ERROR]", error);
        res.status(500).send('Server Error');
    }
});

// === Start Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[Index] Server running on port ${PORT}`));


