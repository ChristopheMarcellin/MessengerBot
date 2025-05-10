require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const PORT = process.env.PORT || 10000;

// === Vérification du webhook ===
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

// === Réception des messages ===
app.post('/webhook', async (req, res) => {
    try {
        const body = req.body;

        if (body.object === 'page') {
            for (const entry of body.entry) {
                const messagingEvent = entry.messaging?.[0];
                const senderId = messagingEvent?.sender?.id;
                const messageText = messagingEvent?.message?.text;

                console.log(`[RECEIVED] senderId: ${senderId} | message: ${messageText}`);

                // 🚫 Ignorer les senderId suspects ou inconnus
                if (!senderId || senderId === '663804066810317' || senderId.length < 10) {
                    console.warn(`[SKIP] Ignoring senderId: ${senderId}`);
                    continue;
                }

                // ✅ Envoie du mark_seen
                try {
                    await axios.post(
                        `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
                        {
                            recipient: { id: senderId },
                            sender_action: 'mark_seen',
                        }
                    );
                    console.log(`[ACK] mark_seen → ${senderId}`);
                } catch (err) {
                    console.error(`[ERROR] mark_seen failed → ${senderId}`);
                    console.error(err.response?.data || err.message);
                    continue; // Ne pas poursuivre si échec de mark_seen
                }

                // ✅ Réponse simple pour test
                try {
                    await axios.post(
                        `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
                        {
                            recipient: { id: senderId },
                            message: { text: '✅ Test ok' }
                        }
                    );
                    console.log(`[SEND] test ok → ${senderId}`);
                } catch (err) {
                    console.error(`[ERROR] sendMessage failed → ${senderId}`);
                    console.error(err.response?.data || err.message);
                }
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
    console.log(`[INIT] Messenger test server running on port ${PORT}`);
});
