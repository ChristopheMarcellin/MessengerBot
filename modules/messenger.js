const axios = require('axios');
const { logQnA } = require('./googleData');

async function sendMessage(senderId, text, session) {
    //   console.log(`[SEND] To: ${senderId} | Message: ${text}`);

    const token = session.currentPageToken;
    console.log(`[SEND] To: ${senderId} | Message: ${text.substring(0, 20)} and token : ${token}`);
    
    if (typeof text === 'string' && text.trim() === '4') {
        // console.warn(`[ALERTE TRACE] >>> Le bot s’apprête à ENVOYER "4" vers ${senderId}`);
        // console.trace('[TRACE ORIGINE] Envoi de "4" déclenché ici :');
    }

    // Sécurisation : si pas de session
    if (!session) {
        session = {};
    }

    if (session) {
        session.lastBotMessage = text;
        }

    await axios.post(
        `https://graph.facebook.com/v18.0/me/messages?access_token=${token}`,
        {
            recipient: { id: senderId },
            message: { text }
        },
        {
            headers: { 'Content-Type': 'application/json' }
        }
    );

    if (session && session.mode !== 'spec') {
        //   console.log(`Entré dans l'envoi de réponse: ${session ? session.mode : 'undefined'} | Message: ${text}`);
        await logQnA(senderId, text, "A", session);
    } else {
        // console.log(`[SEND] pas de logQnA session mode: ${session ? session.mode : 'undefined'} | Message: ${text}`);
    }
}

async function sendMarkSeen(senderId, pageToken) {
    //  console.log(`[ACK] mark_seen → ${senderId}`);
    await axios.post(
        `https://graph.facebook.com/v18.0/me/messages?access_token=${pageToken}`,
        {
            recipient: { id: senderId },
            sender_action: 'mark_seen'
        },
        {
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

//async function sendTypingOn(senderId, pageToken) {
//    // console.log(`[TYPING] typing_on → ${senderId}`);
//    await axios.post(
//        `https://graph.facebook.com/v18.0/me/messages?access_token=${pageToken}`,
//        {
//            recipient: { id: senderId },
//            sender_action: 'typing_on'
//        },
//        {
//            headers: { 'Content-Type': 'application/json' }
//        }
//    );
//}

//async function acknowledgeAndRespond(senderId, text, session, pageToken, delayMs = 1200) {
//    //   console.log(`[RESPOND] ACK + typing + reply → ${senderId}`);
//    await sendMarkSeen(senderId, pageToken);
//    await sendTypingOn(senderId, pageToken);
//    await wait(delayMs);
//    await sendMessage(senderId, text, session, pageToken);
//}

//async function acknowledgeOnly(senderId, pageToken) {
//    // console.log(`[ACK-ONLY] mark_seen → ${senderId}`);
//    await sendMarkSeen(senderId, pageToken);
//}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//async function sendGif(senderId, gifUrl, pageToken) {
//    //   console.log(`[SEND] To: ${senderId} | GIF: ${gifUrl}`);

//    await axios.post(
//        `https://graph.facebook.com/v18.0/me/messages?access_token=${pageToken}`,
//        {
//            recipient: { id: senderId },
//            message: {
//                attachment: {
//                    type: "image",
//                    payload: {
//                        url: gifUrl,
//                        is_reusable: false
//                    }
//                }
//            }
//        },
//        {
//            headers: { 'Content-Type': 'application/json' }
//        }
//    );
//}

module.exports = {
    sendMessage,
    sendMarkSeen
 //   sendTypingOn,
   // acknowledgeAndRespond,
//acknowledgeOnly,
  //  sendGif
};
