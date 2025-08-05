const axios = require('axios');
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const { logQnA } = require('./dataExport'); 

async function sendMessage(senderId, text, session) {
    console.log(`[SEND] To: ${senderId} | Message: ${text}`);

    if (typeof text === 'string' && text.trim() === '4') {
    //    console.warn(`[ALERTE TRACE] >>> Le bot s’apprête à ENVOYER "4" vers ${senderId}`);
     //   console.trace('[TRACE ORIGINE] Envoi de "4" déclenché ici :');
    }

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
    if (session && session.mode !== 'spec') {
        await logQnA(senderId, text, "A");
    }
    else { console.log(`[SEND] pas de logQnA session mode: ${session.mode} | Message: ${text}`)}

}
async function sendMarkSeen(senderId) {
  //  console.log(`[ACK] mark_seen → ${senderId}`);
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
   // console.log(`[TYPING] typing_on → ${senderId}`);
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
 //   console.log(`[RESPOND] ACK + typing + reply → ${senderId}`);
    await sendMarkSeen(senderId);
    await sendTypingOn(senderId);
    await wait(delayMs);
    await sendMessage(senderId, text, session);
}

async function acknowledgeOnly(senderId) {
   // console.log(`[ACK-ONLY] mark_seen → ${senderId}`);
    await sendMarkSeen(senderId);
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendGif(senderId, gifUrl) {
 //   console.log(`[SEND] To: ${senderId} | GIF: ${gifUrl}`);

    await axios.post(
        `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
        {
            recipient: { id: senderId },
            message: {
                attachment: {
                    type: "image",
                    payload: {
                        url: gifUrl,
                        is_reusable: false
                    }
                }
            }
        },
        {
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

module.exports = {
    sendMessage,
    sendMarkSeen,
    sendTypingOn,
    acknowledgeAndRespond,
    acknowledgeOnly,
    sendGif
};

