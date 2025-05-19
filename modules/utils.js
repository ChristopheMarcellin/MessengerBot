// modules/utils.js
const { getProjectTypeFromNumber } = require('./specEngine');

const axios = require('axios');
const { sendMessage } = require('./messenger');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;


function traceCaller(label) {
    const stack = new Error().stack;
    const line = stack.split('\n')[3] || 'inconnu';
    console.log(`[UTILS] ${label} ← ${line.trim()}`);
}

// validé par CM, attention le none devrait être extensionné lorsque toutes les specs sont
function getNextSpec(projectType, specValues = {}, askedSpecs = {}) {

    // 1. Type de projet invalide → poser la question
    if (!["B", "S", "R", "E"].includes(projectType)) {
        // console.log(`[UTILS1] Type de projet non défini  ("${projectType}")`);
        return "projectType";
    }

    // 2. Type de projet défini à "E" le robot cesse de poser des questions
    if (projectType === "E") {
        console.log('[UTILS] Fin des questions');
        return "none";
    }
    // ✅ 2.5 : Type de propriété non défini → poser propertyUsage
    const usageValue = specValues.propertyUsage;
    const usageAsked = askedSpecs.propertyUsage;

    if (!usageAsked && (usageValue === "?" || usageValue === "undetermined" || typeof usageValue === "undefined")) {
        // console.log(`[UTILS3] propertyUsage jamais traité`);
        return "propertyUsage";
    }
    if (usageAsked && usageValue === "?") {
        // console.log(`[UTILS3B] propertyUsage déjà posée mais floue → relance`);
        return "propertyUsage";
    }


    // 3. Specs attendues selon le type
    const specsByType = {
        B: ["price", "bedrooms", "bathrooms", "garage", "location"],
        S: ["price", "bedrooms", "bathrooms", "garage", "location"],
        R: ["price", "bedrooms", "bathrooms", "parking", "location"]
    };

    const expectedSpecs = specsByType[projectType] || [];

    for (const field of expectedSpecs) {
        const asked = askedSpecs[field];
        const value = specValues[field];

        if (value === "E") continue;

        // ✅ On ne retourne que si la question n’a PAS été posée et la valeur est encore floue
        if (value === "?" || value === "undetermined" || typeof value === "undefined") {
            // console.log(`[UTILS4] Spec principale à poser → retour "${field}"`);
            return field;
        }
    }

    // 4. Toutes les specs principales sont complètes → enchaîner sur questions génériques
    const genericSpecs = ["wantsContact", "firstName", "lastName", "phone", "email"];

    for (const field of genericSpecs) {
        const asked = askedSpecs[field];
        const value = specValues[field];

        if (value === "E") continue;

        // ✅ Retourner uniquement les champs jamais posés avec valeur floue
        if (value === "undetermined" || typeof value === "undefined") {
            console.log(`[UTILS5] Question générique à poser → retour "${field}"`);
            return field;
        }
    }

    return "summary"; // ✅ Toutes les specs sont traitées
}



function getCurrentSpec(session) {
    if (!session || typeof session.currentSpec !== "string") {
        return null;
    }
    return session.currentSpec;
}


function initializeSpecFields(session, projectType) {
    traceCaller('initializeSpecFields');
    const fields = {
        B: ['price', 'bedrooms', 'bathrooms', 'garage', 'location'],
        S: ['price', 'bedrooms', 'bathrooms', 'garage', 'location'],
        R: ['price', 'bedrooms', 'bathrooms', 'parking', 'location'],
    };

    const list = fields[projectType] || [];

    session.specValues = {};
    session.askedSpecs = {};

    for (const field of list) {
        session.specValues[field] = '?';
        session.askedSpecs[field] = false;
    }

    console.log(`[UTILS] Champs de spec initialisés pour ${projectType}: ${list.join(', ')}`);
}

function setProjectType(session, value, reason = 'unknown') {
    traceCaller('setProjectType');

    const old = session.projectType;

    // 🚫 Règle #1 : ne pas écraser B/S/R par "?"
    if (["B", "S", "R", "E"].includes(old) && value === "?") {
        console.warn(`[UTILS] Tentative d'écrasement de projectType "${old}" par "?" — bloqué`);
        return;
    }

    // 🚫 Règle #2 : ne pas réécrire la même valeur
    if (old === value) {
        console.log(`[UTILS] projectType déjà égal à "${value}" — aucune modification`);
        return;
    }

    session.projectType = value;

    if (["B", "S", "R"].includes(value)) {
        initializeSpecFields(session, value);
    }

    const specs = Object.entries(session.specValues || {})
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');

    console.log(`[TRACK] projectType changed from ${old} to ${value} | reason: ${reason} | current state: projectType=${value} | specs: ${specs}`);
}

function setSpecValue(session, key, value) {
    traceCaller('setSpecValue');

    if (!session.specValues) session.specValues = {};
    if (!session.askedSpecs) session.askedSpecs = {};

    const old = session.specValues[key];

    // 🚫 Ne pas écraser une vraie valeur par "?" (ex: 3 → ?)
    if (old && old !== "?" && old !== "E" && value === "?") {
        console.warn(`[UTILS] Tentative d'écrasement de "${key}"="${old}" par "?" — bloqué`);
        return;
    }

    // 🚫 Éviter la réécriture identique
    if (old === value) {
        console.log(`[UTILS] spec "${key}" déjà égale à "${value}" — aucune ré-écriture`);
        return;
    }

    if (key === "propertyUsage") {
        const usage = value === "1" ? "income" : "residential";
        session.propertyUsage = usage;
        session.specValues[key] = usage; // ✅ nécessaire pour que getNextSpec et stepWhatNext fonctionnent
        session.askedSpecs[key] = true;

        console.trace(`[utilsTRACK] propriété "propertyUsage" définie → "${usage}" | current state: projectType=${session.projectType}`);
        return; // on sort ici sans toucher specValues plus bas
    }

    // ✅ Mise à jour standard
    session.specValues[key] = value;
    session.askedSpecs[key] = true;

    const specs = Object.entries(session.specValues)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');

    console.trace(`[utilsTRACK] spec "${key}" modifiée → "${value}" | current state: projectType=${session.projectType} | specs: ${specs}`);
}


//gpt classifies project

async function gptClassifyProject(message, language = "fr") {
    const prompt = language === "fr"
        ? `Tu es un assistant immobilier. L'utilisateur a dit : "${message}". Classe cette réponse dans l'une de ces catégories :\n1 → acheter\n2 → vendre\n3 → louer\n4 → autre\nNe commente pas, réponds seulement par un chiffre.`
        : `You are a real estate assistant. The user said: "${message}". Classify the intent into one of the following:\n1 → buy\n2 → sell\n3 → rent\n4 → other\nReply with a single number only.`;

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

        const raw = response.data.choices?.[0]?.message?.content?.trim();
        const classification = raw?.match(/^[1-4]/)?.[0] || "5"; // défaut: 5 → autre → ?

        const map = getProjectTypeFromNumber();
        return map[classification];

    } catch (err) {
        console.warn(`[classifyProject] GPT error: ${err.message}`);
        return "?";
    }
}





async function chatOnly(senderId, message, lang = "fr") {
    const prompt = lang === "fr"
        ? `Tu es un assistant amical. Réagis à cette phrase sans chercher à interpréter des données : "${message}"`
        : `You are a friendly assistant. React to this phrase without trying to interpret data: "${message}"`;

    console.log(`[GPT] Mode: chatOnly | Lang: ${lang} | Prompt → ${prompt}`);

    try {
        const chatGptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200,
            temperature: 0.6
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });

        const gptReply = chatGptResponse.data.choices?.[0]?.message?.content?.trim();
        const fallback = gptReply || (lang === "fr" ? "Désolé, je n'ai pas compris." : "Sorry, I didn’t understand.");
        await sendMessage(senderId, fallback);

    } catch (err) {
        console.error(`[chatOnly] Erreur GPT : ${err.message}`);
        const fallback = lang === "fr" ? "Désolé, je n'ai pas compris." : "Sorry, I didn’t understand.";
        await sendMessage(senderId, fallback);
    }
}

function detectLanguageFromText(text) {
    if (typeof text !== "string") return 'fr'; // sécurité minimale

    const isFrench = /[àâçéèêëîïôûùüÿœæ]/i.test(text) ||
        /\b(le|la|est|une|bonjour|je|j’|ça|tu|vous|avec|maison|acheter|vendre|salut|allo|propriété)\b/i.test(text);

    return isFrench ? 'fr' : 'en';
}

module.exports = {
    getNextSpec,
    getCurrentSpec,
    initializeSpecFields,
    setProjectType,
    setSpecValue,
    gptClassifyProject,
    chatOnly,
    detectLanguageFromText
};
