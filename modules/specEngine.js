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

const projectTypeMap = {
    "1": "B",
    "2": "S",
    "3": "R",
    "4": "E", // projet autre
    "5": "?"  // réponse incomprise
};

function getProjectTypeFromNumber(input) {
    return projectTypeMap[input?.trim()] || "?";
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
    console.log(`[SPEC ENGINE] spec field "${field}" changed from "${previous}" to "${next}" AND THIS LOG SHOULD SHOULD BE DEAD CODE`);
};

function getDisplayValue(field, value, lang = "en") {
    const map = displayMap[field]?.[lang];
    return map?.[value] ?? value;
}

function buildSpecSummary(session, lang = "en") {
    const fields = session.specValues;
    let summary = lang === "fr"
        ? "Voici un petit résumé des informations fournies que vous nous avez fournies:\n"
        : "Here is a short summary of the information you provided:\n";

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
    //cm
    console.log(`[VALIDATION hint] validating message or interpretation: ${value} projecttype: ${projectType} for: field=${field}`);
    if (!value) return false;

    const input = value.trim();

    // 🎯 0. Cas spécial : refus explicite (valable sauf pour projectType)
    if (input === "E" && field !== "projectType") {
        console.log(`[VALIDATION] field=${field} | input="E" | valid=true (refus explicite accepté)`);
        return true;
    }

    // 🎯 1. valide le texte de location
    if (field === "location") {
        const isValid = typeof value === "string" && input.length > 0 && input.length <= 25;
        console.log(`[VALIDATION] field=location | input="${value}" | valid=${isValid}`);
        return isValid;
    }

    // 🎯 2. projectType : choix numéroté 1 à 4
    if (field === "projectType") {
        const isValid = ["1", "2", "3", "4"].includes(input);
        console.log(`[VALIDATION] field=projectType | input="${input}" | valid=${isValid}`);
        return isValid;
    }

    // 🎯 3. Champs numériques purs
    const numericFields = ["price", "bedrooms", "bathrooms", "garage", "parking"];
    if (numericFields.includes(field)) {
        const isValid = /^\d+$/.test(input);
        console.log(`[VALIDATION] field=${field} | input="${input}" | valid=${isValid}`);
        return isValid;
    }

    // 🎯 4. Réponse à "Souhaitez-vous être contacté ?"
    if (field === "wantsContact") {
        const isValid = ["1", "2"].includes(input);
        console.log(`[VALIDATION] field=wantsContact | input="${input}" | valid=${isValid}`);
        return isValid;
    }

    // 🎯 5. Détermine si c'est une propriété à revenus
    if (field === "propertyUsage") {
        const isValid = ["1", "2"].includes(input);
        console.log(`[VALIDATION] field=propertyUsage | input="${input}" | valid=${isValid}`);
        return isValid;
    }

    // 🎯 6. Téléphone
    if (field === "phone") {
        const isValid = /^[\d\s\-\+\(\)]{7,25}$/.test(input);
        console.log(`[VALIDATION] field=phone | input="${input}" | valid=${isValid}`);
        return isValid;
    }

    // 🎯 7. Email
    if (field === "email") {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
        console.log(`[VALIDATION] field=email | input="${input}" | valid=${isValid}`);
        return isValid;
    }

    // 🎯 8. Nom et prénom
    if (["firstName", "lastName"].includes(field)) {
        const isValid = /^[a-zA-ZÀ-ÿ' -]{2,}$/.test(input);
        console.log(`[VALIDATION] field=${field} | input="${input}" | valid=${isValid}`);
        return isValid;
    }

    // 🎯 9. Fallback sur displayMap
    const lang = ["B", "S", "R"].includes(projectType) ? "fr" : "en";
    const map = displayMap?.[field]?.[lang];
    const isValid = map ? Object.keys(map).includes(input) : true;
    console.log(`[VALIDATION] field=${field} | input="${input}" | valid=${isValid} (via displayMap fallback)`);
    return isValid;
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
    allSpecsCollected,
    getProjectTypeFromNumber
};
