/**
 * Filtres de sécurité pour protéger le bot contre les événements indésirables de Messenger.
 * Ce module centralise toute la logique défensive (echo, message vide, ID invalide, etc.)
 */

/**
 * Vérifie si un événement Messenger doit être traité comme un message utilisateur valide.
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
 * Vérifie si l'événement est un echo (même si on ne souhaite pas bloquer ici).
 */
function isEcho(event) {
  return !!event?.message?.is_echo;
}

/**
 * Vérifie si le message est vide, ou invalide (sans texte exploitable)
 */
function isInvalidMessage(event) {
  const text = event?.message?.text;
  return !text || typeof text !== 'string' || text.trim().length === 0;
}

/**
 * Vérifie si le senderId est douteux
 */
function isBadSender(event) {
  const senderId = event?.sender?.id;
  return !senderId || typeof senderId !== 'string' || senderId.length < 10;
}

module.exports = {
  isValidIncomingMessage,
  isEcho,
  isInvalidMessage,
  isBadSender
};
