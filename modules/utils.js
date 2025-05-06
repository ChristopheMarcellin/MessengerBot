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

function setProjectType(session, value, reason = "unspecified") {
    const previous = session.specValues?.projectType ?? "undefined";
    session.specValues.projectType = value;
    console.log(`[TRACK] projectType changed from ${previous} to ${value} | reason: ${reason}`);
}

module.exports = {
    initializeSpecFields,
    setProjectType,
};
