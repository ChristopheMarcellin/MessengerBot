// modules/dataExport.js
const webhookUrl = 'https://script.google.com/macros/s/AKfycbzWGmTLaIFi6UA067lxMg026k7z7zJh_OmkPQsL8fn7PnSrM-MHgHJWU-b66n7hTB4e/exec;

async function logQnA(senderId, message, type) {
    const payload = {
        senderId,
        type,
        message,
        timestamp: new Date().toISOString(),
        action: 'appendQnA'
    };
    console.log("[DEBUG logQnA] Payload envoyé à Google:", payload);
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
