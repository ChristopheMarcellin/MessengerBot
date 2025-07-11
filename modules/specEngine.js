const questions = require('./questions');
const displayMap = require('./displayMap');
const isNumeric = require('./utils');
const gptClassifyNumericSpecAnswer = require('./utils');


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

    if (field === "expectations") {
        return lang === "fr"
            ? `Autres spécifications : ${value}`
            : `Other specifications: ${value}`;
    }

    if (field === "firstName") {
        return lang === "fr" ? `Prénom : ${value}` : `First name: ${value}`;
    }

    if (field === "lastName") {
        return lang === "fr" ? `Nom : ${value}` : `Last name: ${value}`;
    }

    if (field === "age") {
        return lang === "fr"
            ? `Âge : ${value} ans`
            : `Age: ${value} years old`;
    }
    if (field === "phone") {
        return lang === "fr" ? `Téléphone : ${value}` : `Phone: ${value}`;
    }

    if (field === "email") {
        return lang === "fr" ? `Courriel : ${value}` : `Email: ${value}`;
    }

    if (field === "wantsContact") {
        const map = displayMap?.wantsContact?.[lang];
        const key = value in map ? value : String(value);
        return map?.[key] ?? value;
    }

    const map = displayMap[field]?.[lang];
    return map?.[value] ?? value;
}

function buildSpecSummary(session, lang = "fr") {
    const fields = session.specValues;
    console.log("CM on entre dans specSummary")
    const summaryHeader = lang === "fr"
        ? "Voici un petit résumé des informations que vous nous avez transmises, vous pouvez adresser vos questions par la suite:  \n\n"
        : "Here is a short summary of the information you provided, you may ask your questions next:   \n\n";

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
const { isNumeric } = require('./utils');
const { gptClassifyNumericSpecAnswer } = require('./utilsGPT');

async function isValidAnswer(message, projectType, field, lang = "fr") {
    console.log(`[spec Engine] validating message or interpretation text value: __${message}_ and projecttype: _${projectType} for: field=_${field}`);
    if (!message) return false;

    const input = message.trim();

    // 🎯 0. Cas spécial : refus explicite (valable sauf pour projectType)
    if (input === "E" && field !== "projectType") {
        console.log(`[spec Engine] validating field=__${field}_ | input="E" | valid=true (refus explicite accepté)`);
        return true;
    }

    // 🎯 1. location (texte libre court)
    if (field === "location") {
        const isValid = typeof input === "string" && input.length > 0 && input.length <= 25;
        console.log(`[spec Engine] validating field=location | input=__${input}_ | valid=_${isValid}_`);
        return isValid;
    }

    // 🎯 2. projectType : réponse numérique directe
    if (field === "projectType") {
        const isValid = ["1", "2", "3", "4"].includes(input);
        console.log(`[spec Engine] validating field=projectType | input=__${input}_ | valid=_${isValid}_`);
        return isValid;
    }

    // 🎯 3. wantsContact : réponse 1 ou 2
    if (field === "wantsContact") {
        const validValues = ["1", "2"];
        if (validValues.includes(input)) return true;

        const decoded = await gptClassifyNumericSpecAnswer(input, lang);
        const isValid = validValues.includes(decoded);
        console.log(`[spec Engine] validating field=wantsContact | input=__${input}_ | decoded=${decoded} | valid=${isValid}`);
        return isValid;
    }

    // 🎯 4. Champs numériques purs (price, bedrooms, etc.)
    const numericFields = ["price", "bedrooms", "bathrooms", "garage", "parking", "age", "propertyUsage"];
    if (numericFields.includes(field)) {
        if (isNumeric(input)) return true;

        const decoded = await gptClassifyNumericSpecAnswer(input, lang);
        const isValid = isNumeric(decoded);
        console.log(`[spec Engine] validating field=__${field}_ | input=__${input}_ | decoded=${decoded} | valid=${isValid}`);
        return isValid;
    }

    // 🎯 5. phone
    if (field === "phone") {
        const isValid = /^[\d\s\-\+\(\)]{7,25}$/.test(input);
        console.log(`[spec Engine] validating field=phone | input="${input}" | valid=_${isValid}_`);
        return isValid;
    }

    // 🎯 6. email
    if (field === "email") {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
        console.log(`[spec Engine] validating field=email | input="${input}" | valid=_${isValid}_`);
        return isValid;
    }

    // 🎯 7. firstName / lastName
    if (["firstName", "lastName"].includes(field)) {
        const isValid = /^[a-zA-ZÀ-ÿ' -]{2,}$/.test(input);
        console.log(`[spec Engine] validating field=_${field} | input="${input}" | valid=_${isValid}_`);
        return isValid;
    }

    // 🎯 8. expectations (aucune validation)
    if (field === "expectations") {
        return true;
    }

    // 🎯 9. fallback via displayMap
    const language = ["B", "S", "R"].includes(projectType) ? "fr" : "en";
    const map = displayMap?.[field]?.[language];
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

function buildExportRecord(session) {
    const flatRecord = {
        senderId: session.senderId || "",
        language: session.language || "",
        mode: session.mode || "",
        questionCount: session.questionCount || 0,
        maxQuestions: session.maxQuestions || 40,
        timestamp: new Date().toISOString()
    };

    // Log des champs fixes
    Object.entries(flatRecord).forEach(([key, value]) => {
        console.log(`[EXPORT] Champ: ${key} → Valeur: ${value}`);
    });

    // Ajoute toutes les specs enregistrées
    if (session.specValues && typeof session.specValues === 'object') {
        Object.entries(session.specValues).forEach(([key, value]) => {
            flatRecord[key] = value;
            console.log(`[EXPORT] Champ: ${key} (spec) → Valeur: ${value}`);
        });
    }

    return flatRecord;
}


async function exportToGoogleSheets(rowData) {
    const webhookUrl = 'https://script.google.com/macros/s/AKfycbxguRpiWDJHmqP153umdsXbZ_JlWLenlRXnH-vst12885H-Adse98OTm-A4NN-PFIZY/exec' // ← colle ton URL ici

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rowData)
        });

        const text = await response.text();
        console.log("[EXPORT] Réponse Sheets :", text);
    } catch (err) {
        console.error("[EXPORT] Erreur export Sheets :", err);
    }
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
    getProjectTypeFromNumber,
    buildExportRecord,
    exportToGoogleSheets
};
