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

async function sendMarkSeen(senderId) {
    console.log(`[ACK] mark_seen → ${senderId}`);
    await axios.post(
        `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
        {
            recipient: { id: senderId },
            sender_action: 'mark_seen'
        },
        {
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

async function sendTypingOn(senderId) {
    console.log(`[TYPING] typing_on → ${senderId}`);
    await axios.post(
        `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
        {
            recipient: { id: senderId },
            sender_action: 'typing_on'
        },
        {
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

async function acknowledgeAndRespond(senderId, text, session, delayMs = 1200) {
    console.log(`[RESPOND] ACK + typing + reply → ${senderId}`);
    await sendMarkSeen(senderId);
    await sendTypingOn(senderId);
    await wait(delayMs);
    await sendMessage(senderId, text, session);
}

async function acknowledgeOnly(senderId) {
    console.log(`[ACK-ONLY] mark_seen → ${senderId}`);
    await sendMarkSeen(senderId);
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    sendMessage,
    sendMarkSeen,
    sendTypingOn,
    acknowledgeAndRespond,
    acknowledgeOnly
};

