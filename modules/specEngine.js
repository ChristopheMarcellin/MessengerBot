const questions = require('./questions');
const displayMap = require('./displayMap');

function getPromptForSpec(projectType, specKey, lang = "en") {
    const questionSet = questions?.[projectType];
    const rawQuestion = questionSet?.[specKey]?.[lang] || `${specKey}?`;
    const options = displayMap?.[specKey]?.[lang];
    let formattedChoices = "";

    if (options) {
        formattedChoices = Object.entries(options)
            .map(([key, label]) => `${key} → ${label}`)
            .join("\n");
    }

    return formattedChoices ? `${rawQuestion}\n${formattedChoices}` : rawQuestion;
}

const getNextUnansweredSpec = (session) => {
    const projectType = session.projectType;
    if (!projectType || !questions[projectType]) return undefined;

    return Object.keys(questions[projectType]).find(
        (key) => session.specValues[key] === null || session.specValues[key] === "?"
    );
};

const shouldAskNextSpec = (session) => {
    return !!getNextUnansweredSpec(session);
};

const updateSpecFromInput = (field, decodedValue, specValues) => {
    const previous = specValues[field] ?? "undefined";
    const next = (decodedValue && decodedValue.trim() !== "") ? decodedValue : "?";
    specValues[field] = next;
    console.log(`[UPDATE] spec field "${field}" changed from "${previous}" to "${next}"`);
};

function getDisplayValue(field, value, lang = "en") {
    const map = displayMap[field]?.[lang];
    return map?.[value] ?? value;
}

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

const resetInvalidSpecs = (session) => {
    for (let key in session.specValues) {
        if (session.specValues[key] === "?") {
            delete session.specValues[key];
        }
    }
};

// ✅ Validation spécifique pour projectType
function isValidAnswer(value, projectType, field) {
    if (!value) return false;
    const input = value.trim();

    // 🎯 1. projectType : choix numéroté 1 à 4
    if (field === "projectType") {
        const isValid = ["1", "2", "3", "4"].includes(input);
        console.log(`[VALIDATION] field=projectType | input="${input}" | valid=${isValid}`);
        return isValid;
    }

    // 🎯 2. Champs numériques purs
    const numericFields = ["price", "bedrooms", "bathrooms", "garage", "parking"];
    if (numericFields.includes(field)) {
        return /^\d+$/.test(input);
    }

    // 🎯 3. Téléphone
    if (field === "phone") {
        return /^[\d\s\-\+\(\)]{7,25}$/.test(input);
    }

    // 🎯 4. Email
    if (field === "email") {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    }

    // 🎯 5. Nom et prénom
    if (["firstName", "lastName"].includes(field)) {
        return /^[a-zA-ZÀ-ÿ' -]{2,}$/.test(input);
    }

    // 🎯 6. Fallback sur displayMap
    const lang = ["B", "S", "R"].includes(projectType) ? "fr" : "en";
    const map = displayMap?.[field]?.[lang];
    return map ? Object.keys(map).includes(input) : true;
}



function getSpecFieldsForProjectType(projectType) {
    return Object.keys(questions?.[projectType] || {});
}

function allSpecsCollected(session) {
    return !getNextUnansweredSpec(session);
}

module.exports = {
    getPromptForSpec,
    getNextUnansweredSpec,
    shouldAskNextSpec,
    updateSpecFromInput,
    buildSpecSummary,
    resetInvalidSpecs,
    getDisplayValue,
    isValidAnswer,
    getSpecFieldsForProjectType,
    allSpecsCollected
};
