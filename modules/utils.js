const { getSpecFieldsForProjectType } = require('./specEngine');

// Initialise tous les champs de spec � "?" sauf projectType.
// Ne modifie rien si les champs sont d�j� initialis�s.
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

module.exports = {
    initializeSpecFields,
};
