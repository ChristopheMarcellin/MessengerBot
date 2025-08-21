/**
 * Filtres de sécurité pour protéger le bot contre les événements indésirables de Messenger.
 * Ce module centralise toute la logique défensive (echo, message vide, ID invalide, timestamp, duplication).
 */

/**
 * Vérifie si un événement Messenger doit être traité comme un message utilisateur valide.
 * Ce test regroupe : senderId valide, texte exploitable, non-echo, etc.
 * @param {object} event - Objet `messaging` de Messenger
 * @returns {boolean}
 */
function isValidIncomingMessage(event) {
    const senderId = event?.sender?.id;
    const message = event?.message;
    const text = message?.text;

    return (
        senderId &&
        typeof senderId === 'string' &&
        senderId.length > 10 &&
        message &&
        !message.is_echo &&
        typeof text === 'string' &&
        text.trim().length > 0
    );
}

/**
 * Vérifie si le senderId est invalide (trop court, absent ou non string)
 * @param {object} event
 * @returns {boolean}
 */
function isBadSender(event) {
    const senderId = event?.sender?.id;
    return !senderId || typeof senderId !== 'string' || senderId.length < 10;
}

/**
 * Vérifie si le message est un echo Messenger (envoyé par le bot lui-même)
 * @param {object} event
 * @returns {boolean}
 */
function isEcho(event) {
    return !!event?.message?.is_echo;
}

/**
 * Vérifie si le message est vide ou sans texte utile
 * @param {object} event
 * @returns {boolean}
 */
function isInvalidMessage(event) {
    const text = event?.message?.text;
    return !text || typeof text !== 'string' || text.trim().length === 0;
}

/**
 * Vérifie si le message est trop ancien (> 60 secondes)
 * @param {number} timestamp - Timestamp UNIX en millisecondes fourni par Messenger
 * @param {number} maxAgeMs - Durée maximale acceptée en ms (par défaut 60000)
 * @returns {boolean}
 */
function isTooOld(timestamp, maxAgeMs = 60000) {
    const age = Date.now() - timestamp;
    return age > maxAgeMs;
}

/**
 * Vérifie si un message a déjà été vu (doublon exact texte + timestamp)
 * @param {object} session
 * @param {string} text
 * @param {number} timestamp
 * @returns {boolean}
 */
function isRepeatMessage(session, text, timestamp) {
    const payload = `${text}|${timestamp}`;
    return session?.lastPayload === payload;
}

/**
 * Mémorise le dernier message vu pour ce sender (texte + timestamp)
 * @param {object} session
 * @param {string} text
 * @param {number} timestamp
 */
function setLastPayload(session, text, timestamp) {
    session.lastPayload = `${text}|${timestamp}`;
}
// modules/filters.js

function shouldSkipMessage(session, message, timestamp) {
    if (!message || !timestamp) return true; // sécurité

    const now = Date.now();
    const MAX_AGE_MS = 60 * 1000; // 1 minute de tolérance (à ajuster si tu veux plus)

    // 1️⃣ Trop vieux
    if (now - timestamp > MAX_AGE_MS) {
        console.warn(`[SKIP] Message trop vieux ignoré: "${message}" @${timestamp}`);
        return true;
    }

    // 2️⃣ Doublon du dernier message
    if (session?.lastPayload
        && session.lastPayload.message === message
        && session.lastPayload.timestamp === timestamp) {
        console.warn(`[HARD BLOCK] Message déjà traité: "${message}" @${timestamp}`);
        return true;
    }

    return false;
}

function setLastPayload(session, message, timestamp) {
    session.lastPayload = { message, timestamp };
}

module.exports = {
    shouldSkipMessage,
    setLastPayload
};

module.exports = {
    isValidIncomingMessage,
    isBadSender,
    isEcho,
    isInvalidMessage,
    isTooOld,
    isRepeatMessage,
    setLastPayload
};
