// modules/dataExport.js
const webhookUrl = 'https://script.google.com/macros/s/AKfycbxguRpiWDJHmqP153umdsXbZ_JlWLenlRXnH-vst12885H-Adse98OTm-A4NN-PFIZY/exec';

async function logQnA(senderId, message, type) {
    const payload = {
        senderId,
        type,
        message,
        timestamp: new Date().toISOString(),
        action: 'appendQnA'
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
