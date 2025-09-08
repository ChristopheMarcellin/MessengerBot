// modules/googleData.js anciennement dataExport
const webhookUrl = 'https://script.google.com/macros/s/AKfycbzIK5Nts-JZ5IM0dIGun266ZTm9Qr5QKQvtIEUs3jsMuTF11eJz2MRASgp2DZwlFIQ/exec';

/**
 * Exporte un enregistrement complet (specs) vers Google Sheets
 * @param {Object} rowData - Données de la ligne (toutes les specs)
 */
async function exportToGoogleSheets(rowData) {
    const payload = {
        ...rowData,
        action: 'appendRow', // Indique au Google Script que c'est un appendRow
        timestamp: new Date().toISOString()
    };

  //  console.log("[EXPORT] Payload envoyé à Google Sheets:", payload);

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
    //    console.log("[EXPORT] Réponse Sheets :", text);
    } catch (err) {
        console.error("[EXPORT] Erreur export Sheets :", err);
    }
}

/**
 * Ajoute une entrée QnA (Question/Réponse) à un enregistrement existant
 * @param {string} senderId - Identifiant de session
 * @param {string} message - Texte du QnA
 * @param {string} type - "Q" ou "A"
 */
async function logQnA(senderId, message, type, session) {
    const payload = {
        senderId,
        message,
        type,
        action: 'appendQnA',
        timestamp: new Date().toISOString(),
        questionCount: session?.questionCount || 0
    };
    // console.log("[QnA] Payload envoyé à Google Sheets:", payload);

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        // console.log(`[QnA] ${type} de ${senderId} → "${message}" | Sheets: ${text}`);
    } catch (err) {
        console.error("[QnA] Erreur d'envoi :", err);
    }
}

async function getMaxQuestions(senderId) {
  const url = `${webhookUrl}?senderId=${encodeURIComponent(senderId)}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.value;
}



module.exports = { exportToGoogleSheets, logQnA, getMaxQuestions };
