// === Load env 
//+ dependencies ===
// === Load env & dependencies ===
//require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

const { sendMarkSeen } = require('./modules/messenger');
const { getSession } = require('./modules/sessionStore');
const { runDirector } = require('./modules/director');
const {
    isValidIncomingMessage,
    shouldSkipMessage,
    setLastPayload
} = require('./filters');



// === Vérification webhook ===
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
console.log("ENV CHECK:", {
    CC21: process.env.PAGE_ACCESS_TOKEN_CC21 ? "OK" : "MISSING",
    CMIMMO: process.env.PAGE_ACCESS_TOKEN_CMIMMO ? "OK" : "MISSING",
    CASANOVA: process.env.PAGE_ACCESS_TOKEN_CASANOVA
});

// Multi-pages : dictionnaire PageID → Token
const PAGE_TOKENS = {
    "663804066810317": process.env.PAGE_ACCESS_TOKEN_CC21,   // Page Condo Montréal
    "214465451751956": process.env.PAGE_ACCESS_TOKEN_CMIMMO,  // Page CM Immo
    "932819363252702": process.env.PAGE_ACCESS_TOKEN_CASANOVA // Page Casanova
};

function getPageAccessToken(pageId) {
    return PAGE_TOKENS[pageId];
}

// === Webhook Verification (GET) ===
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// === Webhook POST ===
app.post('/webhook', async (req, res) => {
    const botEnabled = (process.env.BOT_ENABLED || '').trim().toLowerCase() === 'true';

    if (!botEnabled) {
        console.log('[SAFE MODE] Bot désactivé — traitement ignoré');
        return res.sendStatus(200);
    }

    try {
        const entry = req.body.entry?.[0];
        const pageId = entry?.id; // ID de la Page concernée
        console.log(`[DEBUG PAGEID] entry.id reçu = ${pageId}`);
        const messagingEvent = entry?.messaging?.[0];
        if (!messagingEvent) return res.sendStatus(200);

        // ✅ Token spécifique à la page
        const pageToken = getPageAccessToken(pageId);
        if (!pageToken) {
            console.error(`[ERROR] Aucun token configuré pour la page ${pageId}`);
            return res.sendStatus(200);
        }

        // ✅ Protection contre les messages invalides
        if (!isValidIncomingMessage(messagingEvent)) {
            return res.sendStatus(200);
        }

        // === Extraction message ===
        const senderId = messagingEvent.sender?.id;
        const receivedMessage = messagingEvent.message?.text?.trim();
        const timestamp = messagingEvent.timestamp;

        console.log(`[RECEIVED-RAW] Page=${pageId} From=${senderId} | "${receivedMessage}" @ ${timestamp}`);

        // ✅ ACK "vu" (spécifique à la page)
        await sendMarkSeen(senderId, pageToken);

        // === Contexte session ===
        const cleanText = (receivedMessage || "").toLowerCase().replace(/[^\w\s]/gi, '').trim();
        const session = getSession(senderId) || {};
        const isEndSession = cleanText === 'end session';

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
      //      greetings: ["bonjour", "salut", "hello", "hi", "comment ca va"],
            res,
            pageId,
            pageToken,
            session
        };

        // === Log + Direction ===
        console.log(`[RECEIVED] Page=${pageId} From=${senderId} | Message="${receivedMessage}"`);
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
