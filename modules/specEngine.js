const questions = require('./questions');
const displayMap = require('./displayMap');

// Génère la question avec les choix dynamiques selon la langue
function getPromptForSpec(projectType, specKey, lang = "en") {
    const questionSet = questions?.[projectType];
    const rawQuestion = questionSet?.[specKey]?.text || `${specKey}?`;

    const options = displayMap?.[specKey]?.[lang];
    let formattedChoices = "";

    if (options) {
        formattedChoices = Object.entries(options)
            .map(([key, label]) => `${key} → ${label}`)
            .join("\n");
    }

    return formattedChoices
        ? `${rawQuestion}\n${formattedChoices}`
        : rawQuestion;
}

// Retourne le prochain champ non répondu
const getNextUnansweredSpec = (session) => {
    const projectType = session.specValues?.projectType;
    if (!projectType || !questions[projectType]) return undefined;

    return Object.keys(questions[projectType]).find(
        (key) => session.specValues[key] === null || session.specValues[key] === "?"
    );
};

// Faut-il poser une nouvelle question ?
const shouldAskNextSpec = (session) => {
    return !!getNextUnansweredSpec(session);
};

// Mise à jour d'un champ avec trace des changements
const updateSpecFromInput = (field, decodedValue, specValues) => {
    const previous = specValues[field] ?? "undefined";
    const next = (decodedValue && decodedValue.trim() !== "") ? decodedValue : "?";
    specValues[field] = next;
    console.log(`[UPDATE] spec field "${field}" changed from "${previous}" to "${next}"`);
};

// Construction du résumé final
function buildSpecSummary(session, lang = "en") {
    const fields = session.specValues;
    let summary = lang === "fr"
        ? "Voici le résumé des informations fournies :\n"
        : "Here is the summary of the information you provided:\n";

    for (const key in fields) {
        if (key !== "projectType" && fields[key] !== "?") {
            const display = getDisplayValue(key, fields[key], lang);
            summary += `- ${key}: ${display}\n`;
        }
    }

    return summary;
}

// Nettoie les champs invalides
const resetInvalidSpecs = (session) => {
    for (let key in session.specValues) {
        if (session.specValues[key] === "?") {
            delete session.specValues[key];
        }
    }
};

// Transforme une valeur stockée en libellé utilisateur lisible
function getDisplayValue(field, value, lang = "en") {
    const map = displayMap[field]?.[lang];
    return map?.[value] ?? value;
}

module.exports = {
    getPromptForSpec,
    getNextUnansweredSpec,
    shouldAskNextSpec,
    updateSpecFromInput,
    buildSpecSummary,
    resetInvalidSpecs,
    getDisplayValue,
};
