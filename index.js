//TEMP POUR TESTER MESSENGER

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN || 'your_page_token_here';
const PORT = process.env.PORT || 10000;

app.post('/webhook', async (req, res) => {
    const entries = req.body.entry || [];

    for (const entry of entries) {
        const messagingEvents = entry.messaging || [];
        for (const event of messagingEvents) {
            const senderId = event.sender?.id;
            const timestamp = event.timestamp;
            const text = event.message?.text;

            if (senderId && timestamp) {
                const now = Date.now();
                const ageMs = now - timestamp;
                const ageMin = Math.floor(ageMs / 60000);
                const dateSent = new Date(timestamp).toISOString();

                console.log(`[RECEIVED] Message: "${text}"`);
                console.log(`[DEBUG] Sent at: ${dateSent}`);
                console.log(`[DEBUG] Age: ${ageMin} minutes (${ageMs} ms)`);

                // Envoi silencieux d'un mark_seen
                try {
                    await axios.post(`https://graph.facebook.com/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
                        recipient: { id: senderId },
                        sender_action: 'mark_seen'
                    });
                    console.log(`[ACK] Sent mark_seen to ${senderId}`);
                } catch (err) {
                    console.error('[ERROR] mark_seen failed:', err?.response?.data || err.message);
                }
            }
        }
    }

    res.sendStatus(200);
});

app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'helloworldtoken';
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[WEBHOOK] Verified');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

app.listen(PORT, () => {
    console.log(`[INIT] Test server running on port ${PORT}`);
});
