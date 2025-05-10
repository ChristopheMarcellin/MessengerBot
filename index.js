require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

const PORT = process.env.PORT || 10000;

// Vérification webhook (GET)
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

// Réception de messages (POST)
app.post('/webhook', async (req, res) => {
    try {
        const body = req.body;

        if (body.object === 'page') {
            for (const entry of body.entry) {
                const messagingEvent = entry.messaging?.[0];
                const senderId = messagingEvent?.sender?.id;
                const messageText = messagingEvent?.message?.text;

                console.log(`[RECEIVED] senderId: ${senderId} | message: ${messageText}`);

                // Vérification basique de validité du senderId
                if (!senderId || typeof senderId !== 'string' || senderId.length < 10) {
                    console.warn('[ABORT] Invalid senderId. Skipping mark_seen and reply.');
                    continue;
                }

                // Envoie d'un mark_seen
                await axios.post(
                    `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
                    {
                        recipient: { id: senderId },
                        sender_action: 'mark_seen',
                    }
                ).then(() => {
                    console.log(`[ACK] mark_seen → ${senderId}`);
                }).catch((error) => {
                    console.error(`[ERROR] mark_seen failed → ${senderId}`);
                    console.error(error.response?.data || error.message);
                });

                // Envoi d'un message simple pour confirmer que ça marche
                await axios.post(
                    `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
                    {
                        recipient: { id: senderId },
                        message: { text: '✅ Test ok' }
                    }
                ).then(() => {
                    console.log(`[SEND] test ok → ${senderId}`);
                }).catch((error) => {
                    console.error(`[ERROR] sendMessage failed → ${senderId}`);
                    console.error(error.response?.data || error.message);
                });
            }

            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        console.error('[FATAL ERROR]', err);
        res.sendStatus(500);
    }
});

app.listen(PORT, () => {
    console.log(`[INIT] Test Messenger server running on port ${PORT}`);
});
