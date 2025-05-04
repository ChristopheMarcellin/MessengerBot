const { userSessions } = require('../../index');

async function stepCheckEndSession({ senderId, cleanText, res }) {
    if (cleanText.includes("end session")) {
        console.log(`[RESET] Session for ${senderId}:`, JSON.stringify(userSessions[senderId]?.specValues || {}, null, 2));
        delete userSessions[senderId];
        console.log(`[RESET] Session deleted for sender: ${senderId}`);
        res.status(200).send('EVENT_RECEIVED');
        return false;
    }
    return true;
}

module.exports = stepCheckEndSession;
