const { getSpecFieldsForProjectType } = require('./specEngine');
const specOrderByProject = {
    B: ["price", "bedrooms", "bathrooms", "garage", "location","parking"],
    S: ["price", "bedrooms", "bathrooms", "garage", "location", "parking"],
    R: ["rentalPrice", "bedrooms", "bathrooms", "parking", "location", "parking"]
};




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

function getNextSpec(projectType, specValues = {}, askedSpecs = {}) {
    if (!["B", "S", "R", "E", "?"].includes(projectType)) {
        return "projectType";
    }

    // 1️⃣ Projet encore inconnu
    if (projectType === "?" || typeof projectType === "undefined") {
        return "projectType";
    }

    // 2️⃣ Projet de type "E" → pas de suite structurée
    if (projectType === "E") {
        return "none";
    }

    // 3️⃣ Projet valide → trouver la prochaine spec utile
    const orderedSpecs = specOrderByProject[projectType] || [];

    for (const key of orderedSpecs) {
        const asked = askedSpecs[key];
        const value = specValues[key];

        // On veut reposer si jamais posée OU réponse partielle ("?")
        const needsToBeAsked =
            asked !== true || value === "?";

        // Mais jamais si la valeur est "E" ou une vraie réponse
        const isFinal = typeof value === "string" && value !== "?" && value !== "";

        if (needsToBeAsked && !isFinal) {
            return key;
        }
    }

    // 4️⃣ Tout est couvert → on peut résumer
    return "summary";
}

module.exports = { getNextSpec };

module.exports = {
    initializeSpecFields,
    setProjectType,
    getNextSpec
};
