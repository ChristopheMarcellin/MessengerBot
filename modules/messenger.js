const axios = require('axios');
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

async function sendMessage(senderId, text, session) {
    console.log(`[SEND] To: ${senderId} | Message: ${text}`);

    if (session) {
        session.lastBotMessage = text;
    }

    await axios.post(
        `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
        {
            recipient: { id: senderId },
            message: { text }
        },
        {
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

module.exports = {
    sendMessage
};
