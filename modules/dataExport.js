// modules/dataExport.js
const fetch = require('node-fetch');

const webhookUrl = 'https://script.google.com/macros/s/AKfycbxguRpiWDJHmqP153umdsXbZ_JlWLenlRXnH-vst12885H-Adse98OTm-A4NN-PFIZY/exec';

/**
 * Ajoute un message (Q ou A) dans la colonne QnA
 * pour la ligne correspondant au senderId et timestamp le plus récent
 * @param {string} senderId - ID Messenger de l'utilisateur
 * @param {string} message - Texte du message
 * @param {string} type - "Q" (Question) ou "A" (Answer)
 */
async function logQnA(senderId, message, type) {
    const payload = {
        senderId,
        type,                // "Q" ou "A"
        message,
        timestamp: new Date().toISOString(),
        action: 'appendQnA'  // ← Indique au Apps Script qu’on veut mettre à jour la colonne QnA
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        console.log(`[QnA LOG] ${type} de ${senderId} → "${message}" | Sheets: ${text}`);
    } catch (err) {
        console.error("[QnA LOGGING] Erreur d'envoi :", err);
    }
}

module.exports = { logQnA };
