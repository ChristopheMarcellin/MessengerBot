const { getSession, deleteSession } = require('../sessionStore');
const { sendMessage } = require('../messenger');

async function stepCheckEndSession({ senderId, message }) {
    const lower = message.trim().toLowerCase();
    if (lower === "end session") {
        const session = getSession(senderId);
        if (session) {
            console.log(`[RESET] Session for ${senderId}:`, JSON.stringify(session.specValues, null, 2));
        } else {
            console.log(`[RESET] No session found for ${senderId}`);
        }

        deleteSession(senderId);
        await sendMessage(senderId, "Votre session a été réinitialisée. Démarrons une nouvelle conversation.");
        return false;
    }
    return true;
}

module.exports = stepCheckEndSession;