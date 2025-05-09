const { getSpecFieldsForProjectType } = require('./specEngine');

//Initialise tous les champs de spec à "?" sauf projectType.

function initializeSpecFields(session) {
    if (!session.specValues) {
        session.specValues = {};
    }

    const type = session.projectType;
    if (!type || !["B", "S", "R"].includes(type)) return;

    const fields = getSpecFieldsForProjectType(type);
    for (const field of fields) {
        if (session.specValues[field] === undefined) {
            session.specValues[field] = "?";
        }
    }
}

function setProjectType(session, newValue, reason = '') {
    const oldValue = session.projectType;

    // Ne rien faire si aucune modification réelle
    if (oldValue === newValue) return;

    session.projectType = newValue;

    // Clarification du motif
    let logReason = reason;

    if (!reason) {
        if (typeof oldValue === 'undefined') {
            logReason = `initial → ${newValue}`;
        } else if (oldValue === 'E') {
            logReason = `E (temporaire) → forcé ${newValue}`;
        } else {
            logReason = `modifié manuellement`;
        }
    }

    console.log(`[TRACK] projectType changed from ${oldValue ?? 'undefined'} to ${newValue} | reason: ${logReason}`);
}

module.exports = {
    initializeSpecFields,
    setProjectType,
};
