const axios = require('axios');
const questions = require('./questions');
const displayMap = require('./displayMap');
const { isNumeric } = require('./utils');
//const { propertyUsage } = require('./displayMap');

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
    "0": "E",
    "1": "B",
    "2": "S",
    "3": "R",
    "4": "E", // projet autre
    "5": "?"  // réponse incomprise
};

function getProjectTypeFromNumber(input) {
    return input === "?" ? "?" : (projectTypeMap[input?.trim()] || "?");
}

async function gptClassifyNumericSpecAnswer(input, lang = "fr") {
    if (typeof input !== 'string' || input.trim() === "") return "?";

    const prompt = lang === "fr"
        ? `Si la phrase qui suit réfère à une valeur numérique, me retourner cette valeur, autrement me retourner un "?". Ne retourner qu'un seul chiffre (comme 1, 2, 3, etc.) ou la valeur "?" lorsque la phrase ne réfère à aucun chiffre. Ne retourner aucun texte. Maintenant voici la phrase à analyser : "${input}".`
        : `If the following sentence refers to a numeric value, return that value. Otherwise, return "?". Return only a single digit (like 1, 2, 3, etc.) or "?" if the sentence does not refer to any number. Do not return any text. Now here is the sentence to analyze: "${input}".`;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 10,
            temperature: 0
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });

        const raw = response.data.choices?.[0]?.message?.content?.trim() || "?";
        const match = raw.match(/^\d+$/);
        return match ? match[0] : "?";

    } catch (err) {
        console.warn(`[gptClassifyNumericSpecAnswer] GPT ERROR: ${err.message}`);
        return "?";
    }
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
 //   console.log(`[SPEC ENGINE] spec field "${field}" changed from "${previous}" to "${next}" AND THIS LOG SHOULD SHOULD BE DEAD CODE`);
};

function getDisplayValue(field, value, lang = "fr") {
    if (value === "?" || value === "E") {
        return lang === "fr" ? "non précisé" : "not specified";
    }

    if (field === "price") {
        const numericValue = Number(value);
        if (!isNaN(numericValue)) {
            return lang === "fr"
                ? `Prix cible $: ${numericValue} `
                : `Target price $: ${numericValue} `;
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

    //if (field === "firstName") {
    //    return lang === "fr" ? `Prénom : ${value}` : `First name: ${value}`;
    //}

    if (field === "firstName") {
        return lang === "fr" ? `Nom : ${value}` : `Name: ${value}`;
    }

    if (field === "lastName") {
        return lang === "fr" ? `Nom : ${value}` : `Last name: ${value}`;
    }

    if (field === "age") {
        return lang === "fr"
            ? `Année de naissance : ${value}`
            : `Year of birth: ${value}`;
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

//////////////////////////////////////////////////////////////////

function buildSpecSummary(session, lang = "fr") {
    console.log("[SpecEngine] buildSpecSummary");
    const fields = session.specValues;
    //  console.log("CM on entre dans specSummary");

    //const summaryHeader = lang === "fr"
    //    ? `*Mes spécifications:*\n\n`
    //    : `*My specifications:*\n\n`;

    const summaryHeader = lang === "fr"
        ? `*Récapitulatif:*\n\n`
        : `*Recap:*\n\n`;

    let summary = `${summaryHeader}`;

    // Toujours afficher le type de projet (projectType), sauf si "?", "E" ou "0"
    if (session.projectType && !["?", "E", "0"].includes(session.projectType)) {
        const translatedProjectType = getDisplayValue("projectType", session.projectType, lang);
        summary += `${translatedProjectType}\n`;
    }

    // Afficher propertyUsage si défini
    if (session.propertyUsage && !["?", "E", "0"].includes(session.propertyUsage)) {
        const translatedPropertyUsage = getDisplayValue("propertyUsage", session.propertyUsage, lang);
        summary += `${translatedPropertyUsage}\n`;
    }

    // Afficher toutes les autres specs sauf propertyUsage, si valides
    for (const key in fields) {
        if (!fields[key] || ["?", "E", "0"].includes(fields[key])) continue;
        if (key === "propertyUsage") continue;
        const display = getDisplayValue(key, fields[key], lang);
        summary += `${display}\n`;
    }
    if (session.projectType === "S") {
        summary = summary
            .replace(/ ou plus/g, "")
            .replace(/ or more/g, "")
            .replace(/2\+ garages/g, "2 garages");
    }
    const footer = lang === "fr"
        ? `\n*Prêt pour vos questions !*\n\n` +
        `La précision de vos questions améliore la qualité de mes réponses. Il peut m'arriver de faire erreur, il est toujours préférable de valider avec un courtier professionnel !

Voici quelques exemples de ce que je peux adresser:

🚥 *Donner des conseils en immobilier*\n
⚖️ *Répondre aux questions légales en immobilier (Québec)*\n
📊 *Estimer la valeur très approximative d'une propriété dans un quartier ou pour une adresse spécifique (nos estimés sont plus précis pour notre territoire voir www.christophemarcellin.com)*\n
🔢 *Faire un calcul hypothécaire*\n
ℹ️ *Détailler nos services*\n
💬 *Bien plus encore*\n\n

Qu'aimeriez-vous savoir ? (SVP lire ce msg attentivement du début)`


        : `\n*Ready for your questions!*\n\n
The precision of your questions improves the quality of my answers. I may occasionally make mistakes, so it is always best to double-check with a professional real-estate broker!

Here are a few examples of what I can help you with:

🚥  *Provide real-estate advice*\n
⚖️ *Answer legal real-estate questions (Quebec)*\n
📊 *Estimate the approximate value of a property in a neighborhood or for a specific address (our estimates are more accurate within our territory see www.christophemarcellin.com)*\n
🔢 *Perform a mortgage calculation*\n
ℹ️ *Explain our services*\n
💬 *And much more*\n\n

What would you like to ask? (Please carefully read this msg from the start)`;

    summary += `${footer}`;
    session.specSummary = summary;
    return summary;
}

//version précédente (original)
//function buildSpecSummary(session, lang = "fr") {
//    const fields = session.specValues;
//  //  console.log("CM on entre dans specSummary");

//    const summaryHeader = lang === "fr"
//        ? `Voici un récapitulatif, vous pouvez adresser vos questions par la suite:\n\n`
//        : `Here's a short summary of the information provided, you may ask your questions next:\n\n`;

//    const translatedProjectType = getDisplayValue("projectType", session.projectType, lang);
//    const translatedPropertyUsage = getDisplayValue("propertyUsage", fields.propertyUsage, lang);

//    let summary = `${summaryHeader}${translatedProjectType}\n`;

//    if (fields.propertyUsage && fields.propertyUsage !== "?" && fields.propertyUsage !== "E") {
//        summary += `${translatedPropertyUsage}\n`;
//    }

//    for (const key in fields) {
//        if (key === "propertyUsage") continue;
//        if (fields[key] === "?" || fields[key] === "E") continue; // ⬅️ on saute les ? et E
//        const display = getDisplayValue(key, fields[key], lang);
//        summary += `${display}\n\n`;
//    }

//    const footer = lang === "fr"
//        ? `Merci, je suis prêt à répondre à vos questions en matière d'immobilier.\n\n` +
//        `Mes réponses sont à titre de référence seulement et peuvent contenir des erreurs.\n` +
//        `Mieux vaut toujours valider avec un professionnel qualifié de l'immobilier de notre équipe.\n\n` +
//        `Plus votre question est précise, plus ma réponse le sera, espérant vous donner satisfaction !`
//        : `Thank you, I am ready to answer your real estate questions.\n\n` +
//        `My answers are for reference purposes only and may contain errors.\n` +
//        `It is always better to confirm with a qualified real estate professional from our team.\n\n` +
//        `The more precise your question is, the more precise my answer will be, hoping to provide you with satisfaction!`;

//    summary += `\n${footer}`;

//    return summary;
//}



const resetInvalidSpecs = (session) => {
    for (let key in session.specValues) {
        if (session.specValues[key] === "?") {
            delete session.specValues[key];
        }
    }
};

// ✅ Validation spécifique pour projectType


async function isValidAnswer(context, projectType, field, lang = "fr") {
    console.log(`[isValidAnswer] input="${context.message}" (type=${typeof context.message}), field=${field}, projectType=${projectType}`);

    const message = context.message;
    if (typeof message !== 'string') return false;
  //  console.log(`[spec Engine] validating message or interpretation text value: __${message}_ and projecttype: _${projectType} for: field=_${field}`);
    if (!message) return false;

    const input = message.trim();

    // 🎯 -1. Cas spécial : refus explicite (E interne, X alias externe)
    if (input === "0") {
        return true;
    }

    // 🎯 0. Cas spécial : refus explicite (valable sauf pour projectType)
    if (input === "E" && field !== "projectType") {
     //   console.log(`[spec Engine] validating field=__${field}_ | input="E" | valid=true (refus explicite accepté)`);
        return true;
    }

    // 🎯 1. location (texte libre court)
    if (field === "location") {
        const isValid = typeof input === "string" && input.length > 0 && input.length <= 25;
     //   console.log(`[spec Engine] validating field=location | input=__${input}_ | valid=_${isValid}_`);
        return isValid;
    }

    // 🎯 2. projectType : réponse numérique directe
    if (field === "projectType") {

        if (isNumeric(input)) {
            const isValid = ["0","1", "2", "3", "4"].includes(input);
        //    console.log(`[spec Engine] validating field=projectType | input=__${input}_ | valid=_${isValid}_`);
            return isValid;

        }
        else {
            const decoded = await gptClassifyNumericSpecAnswer(input, lang);
            const isValid = ["0", "1", "2", "3", "4"].includes(decoded);
          //  console.log(`[spec Engine] validating field=__${field}_ | input=__${input}_ | decoded=${decoded} | valid=${isValid}`);
            return isValid;
        }
    }

    // 🎯 3. wantsContact : réponse 1 ou 2
    if (field === "wantsContact") {
        const validValues = ["1", "2", "3"];
        const isValid = validValues.includes(input);
        return isValid;
    }

    // 🎯 4. Champs numériques purs (price, bedrooms, etc.)
    if (["price", "bedrooms", "bathrooms", "garage", "parking", "age"].includes(field)) {
        // On accepte chiffres, espaces ou virgules
        const cleaned = input.replace(/[\s,]/g, ""); // supprime espaces et virgules
        const isValid = /^\d+$/.test(cleaned);       // valide uniquement si le reste = chiffres
        return isValid;
    }

    // 🎯 5. phone
    if (field === "phone") {
        const isValid = /^[\d\s\-\+\(\)]{7,25}$/.test(input);
     //   console.log(`[spec Engine] validating field=phone | input="${input}" | valid=_${isValid}_`);
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
      //  console.log(`[spec Engine] validating field=_${field} | input="${input}" | valid=_${isValid}_`);
        return isValid;
    }

    // 🎯 8. expectations (aucune validation)
    if (field === "expectations") {
        return true;
    }

    // 🎯 9. propertyUsage : valeurs brutes 1–4
    if (field === "propertyUsage") {
        const validValues = ["0","1", "2", "3", "4"];
        const isValid = validValues.includes(input);
        return isValid;
    }


    // 🎯 10. fallback via displayMap
    const language = ["B", "S", "R","E"].includes(projectType) ? "fr" : "en";
    const map = displayMap?.[field]?.[language];
    const isValid = map ? Object.keys(map).includes(input) : true;
   // console.log(`[spec Engine] validating field=_${field} | input="${input}" | valid=_${isValid}_ (via displayMap fallback)`);
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
        token: session.currentPageToken,
        questionCount: session.questionCount || 0,
        maxQuestions: session.maxQuestions || 40,
        timestamp: new Date().toISOString(),
        ProjectDate: session.ProjectDate || ""
    };

    // Mapping avec displayMap
    const lang = session.language || "fr";
    if (session.projectType && !["?", "0"].includes(session.projectType)) {
        flatRecord.projectType = getDisplayValue("projectType", session.projectType, lang);
    } else {
        flatRecord.projectType = "";
    }

    if (session.specValues?.propertyUsage && !["?", "0"].includes(session.specValues.propertyUsage)) {
        flatRecord.propertyUsage = getDisplayValue("propertyUsage", session.specValues.propertyUsage, lang);
    } else {
        flatRecord.propertyUsage = "";
    }

    // Ajoute toutes les autres specs (sauf propertyUsage)
    if (session.specValues && typeof session.specValues === 'object') {
        Object.entries(session.specValues).forEach(([key, value]) => {
            if (key === "propertyUsage") return; // exclure pour éviter doublon
            flatRecord[key] = value;
        });
    }

    return flatRecord;
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
    buildExportRecord

};
