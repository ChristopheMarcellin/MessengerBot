const questions = require('./questions');
const displayMap = require('./displayMap');

function getPromptForSpec(projectType, specKey, lang = "en") {
    const questionSet = questions?.[projectType];
    const rawQuestion = questionSet?.[specKey]?.[lang] || `_${specKey}?`;
    const options = displayMap?.[specKey]?.[lang];
    let formattedChoices = "";

    if (options) {
        formattedChoices = Object.entries(options)
            .map(([key, label]) => `_${key} → _${label}`)
            .join("\n");
    }

    return formattedChoices ? `_${rawQuestion}\n_${formattedChoices}` : rawQuestion;
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

function getDisplayValue(field, value, lang = "fr") {
    if (value === "?" || value === "E") {
        return lang === "fr" ? "non précisé" : "not specified";
    }

    if (field === "price") {
        const numericValue = Number(value);
        if (!isNaN(numericValue)) {
            return lang === "fr"
                ? `Prix cible : ${numericValue} milles`
                : `Target price: ${numericValue} thousands`;
        }
    }

    if (field === "location") {
        return lang === "fr"
            ? `Région : ${value}`
            : `Region: ${value}`;
    }

    if (field === "firstName") {
        return lang === "fr" ? `Prénom : ${value}` : `First name: ${value}`;
    }

    if (field === "lastName") {
        return lang === "fr" ? `Nom : ${value}` : `Last name: ${value}`;
    }
    if (field === "phone") {
        return lang === "fr" ? `Téléphone : ${value}` : `Phone: ${value}`;
    }

    if (field === "email") {
        return lang === "fr" ? `Courriel : ${value}` : `Email: ${value}`;
    }

    const map = displayMap[field]?.[lang];
    return map?.[value] ?? value;
}

function buildSpecSummary(session, lang = "fr") {
    const fields = session.specValues;
    const summaryHeader = lang === "fr"
        ? "Voici un petit résumé des informations que vous nous avez transmises:\n"
        : "Here is a short summary of the information you provided:\n";

    const translatedProjectType = getDisplayValue("projectType", session.projectType, lang);
    const translatedPropertyUsage = getDisplayValue("propertyUsage", fields.propertyUsage, lang);

    let summary = `${summaryHeader} ${translatedProjectType}\n`;

    if (fields.propertyUsage && fields.propertyUsage !== "?") {
        summary += `${translatedPropertyUsage}\n`;
    }

    for (const key in fields) {
        if (key === "propertyUsage") continue;
        if (fields[key] !== "?") {
            const display = getDisplayValue(key, fields[key], lang);
            summary += `${display}\n`;
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
function isValidAnswer(message, projectType, field) {
    //cm
    console.log(`[spec Engine] validating message or interpretation text value: __${message}_ and projecttype: _${projectType} for: field=_${field}`);
    if (!message) return false;

    const input = message.trim();

    // 🎯 0. Cas spécial : refus explicite (valable sauf pour projectType)
    if (input === "E" && field !== "projectType") {
        console.log(`[spec Engine] validating field=__${field}_ | input="E" | valid=true (refus explicite accepté)`);
        return true;
    }

    // 🎯 1. valide le texte de location
    if (field === "location") {
        const isValid = typeof message === "string" && input.length > 0 && input.length <= 25;
        console.log(`[spec Engine] validating field=location | input=__${input}_ | valid=_${isValid}_`);
        return isValid;
    }

    // 🎯 2. projectType : choix numéroté 1 à 4
    if (field === "projectType") {
        const isValid = ["1", "2", "3", "4"].includes(input);
        console.log(`[spec Engine] validating field=projectType | input=__${input}_ | valid=_${isValid}_`);
        return isValid;
    }

    // 🎯 3. Champs numériques purs
    const numericFields = ["price", "bedrooms", "bathrooms", "garage", "parking"];
    if (numericFields.includes(field)) {
        const isValid = /^\d+$/.test(input);
        console.log(`[spec Engine] validating field=__${field}_ | input=__${input}_ | valid=_${isValid}_`);
        return isValid;
    }

    // 🎯 4. Réponse à "Souhaitez-vous être contacté ?"
    if (field === "wantsContact") {
        const isValid = ["1", "2"].includes(input);
        console.log(`[spec Engine] validating field=wantsContact | input=__${input}_ | valid=_${isValid}_`);
        return isValid;
    }

    // 🎯 5. Détermine si c'est une propriété à revenus
    if (field === "propertyUsage") {
        const isValid = ["1", "2"].includes(input);
        console.log(`[spec Engine] validating field=propertyUsage | input="${input}" | valid=_${isValid}_`);
        return isValid;
    }

    // 🎯 6. Téléphone
    if (field === "phone") {
        const isValid = /^[\d\s\-\+\(\)]{7,25}$/.test(input);
        console.log(`[spec Engine] validating field=phone | input="${input}" | valid=_${isValid}_`);
        return isValid;
    }

    // 🎯 7. Email
    if (field === "email") {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
        console.log(`[spec Engine] validating field=email | input="${input}" | valid=_${isValid}_`);
        return isValid;
    }

    // 🎯 8. Nom et prénom
    if (["firstName", "lastName"].includes(field)) {
        const isValid = /^[a-zA-ZÀ-ÿ' -]{2,}$/.test(input);
        console.log(`[spec Engine] validating field=_${field} | input="${input}" | valid=_${isValid}_`);
        return isValid;
    }

    // 🎯 9. Fallback sur displayMap
    const lang = ["B", "S", "R"].includes(projectType) ? "fr" : "en";
    const map = displayMap?.[field]?.[lang];
    const isValid = map ? Object.keys(map).includes(input) : true;
    console.log(`[spec Engine] validating field=_${field} | input="${input}" | valid=_${isValid}_ (via displayMap fallback)`);
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
