const { getSession, setSession } = require('../sessionStore');
const { sendMessage } = require('../messenger');

async function stepCollectContact({ senderId, message }) {
    const session = getSession(senderId);
    if (!session || !session.summarySent) return true;

    if (!session.awaitingContactField) {
        session.awaitingContactField = 'firstName';
        await sendMessage(senderId, "Souhaitez-vous qu’un conseiller vous contacte ? Si oui, quel est votre prénom ?");
        setSession(senderId, session);
        return false;
    }

    const fields = ['firstName', 'lastName', 'email', 'phoneNumber', 'message'];
    const prompts = {
        firstName: "Quel est votre prénom ?",
        lastName: "Merci ! Et votre nom de famille ?",
        email: "Parfait. Quelle est votre adresse email ?",
        phoneNumber: "Et votre numéro de téléphone ?",
        message: "Souhaitez-vous laisser un message additionnel ?"
    };

    const field = session.awaitingContactField;
    session.contactInfo = session.contactInfo || {};
    session.contactInfo[field] = message.trim();

    const nextFieldIndex = fields.indexOf(field) + 1;
    if (nextFieldIndex < fields.length) {
        session.awaitingContactField = fields[nextFieldIndex];
        await sendMessage(senderId, prompts[fields[nextFieldIndex]]);
        setSession(senderId, session);
        return false;
    }

    await sendMessage(senderId, "Merci, nous avons bien reçu vos coordonnées !");
    session.awaitingContactField = null;
    session.contactCompleted = true;
    setSession(senderId, session);
    return true;
}

module.exports = { stepCollectContact };
