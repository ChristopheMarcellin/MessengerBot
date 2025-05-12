const { getSpecFieldsForProjectType } = require('./specEngine');
const specOrderByProject = {
    B: ["price", "bedrooms", "bathrooms", "garage", "location","parking"],
    S: ["price", "bedrooms", "bathrooms", "garage", "location", "parking"],
    R: ["rentalPrice", "bedrooms", "bathrooms", "parking", "location"]
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

function setProjectType(session, newType, reason = "unspecified") {
    const allowed = ["B", "S", "R", "E", "?"];
    const previous = session.projectType;
    const safeType = allowed.includes(newType) ? newType : "?";

    session.projectType = safeType;
    console.log(`[TRACK] projectType changed from ${previous} to ${safeType} | reason: ${reason}`);
}
function getNextSpec(projectType, specValues = {}, askedSpecs = {}) {
    if (!["B", "S", "R", "E", "?"].includes(projectType)) {
        return "projectType";
    }

    // 1️⃣ Projet encore inconnu
    if (projectType === "?" || typeof projectType === "undefined") {
        if (askedSpecs.projectType === true) {
            return "none"; // ou "summary", selon le flux souhaité
        }
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
