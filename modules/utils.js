// modules/utils.js
const axios = require('axios');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const { getProjectTypeFromNumber } = require('./specEngine');
const { sendMessage } = require('./messenger');
const questions = require('./questions');



function traceCaller(label) {
    const stack = new Error().stack;
    const line = stack.split('\n')[3] || 'inconnu';
    console.log(`[UTILS traceCaller] ${label} ← ${line.trim()}`);
 }

function getNextSpec(projectType, specValues = {}) {

    console.log(`[getNextSpec] projectType: ${projectType}, session.projectType: ${specValues.projectType}, propertyUsage: ${specValues.propertyUsage}, session.propertyUsage: ${specValues.propertyUsage}`);
    if (!projectType || projectType === '?') return 'projectType';
    const puValue = specValues.propertyUsage;
    // Bloc 0 : refus explicite → pas de résumé, on arrête
    if (projectType === 'E' || puValue === 'E') return null;


    // Bloc 1 : spec manquantes de base
    if (projectType === '?') return 'projectType';
    if (puValue === '?') return 'propertyUsage';

    // Bloc 2 : specs spécifiques au projectType
    const skipIfIncome = ['bedrooms', 'bathrooms', 'garage', 'parking'];
    const typeBlock = questions[projectType] || {};
    for (const field of Object.keys(typeBlock)) {
        if (puValue === 'income' && skipIfIncome.includes(field)) continue;
        if (specValues[field] === '?') {
            return field;
        }    }

    // Bloc 3 : specs génériques
    const genericBlock = questions._generic || {};
    for (const field of Object.keys(genericBlock)) {
        if (specValues[field] === '?') {
            return field;
        }
    }

    // Bloc 4 : tout est rempli → résumé
    return 'summary';
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

    // 🔒 Important : initialisation explicite de propertyUsage
    setSpecValue(session, "propertyUsage", "?", "initializeSpecFields");

    console.log(`[UTILS initialize] Champs de spec initialisés pour ${projectType}: ${list.join(', ')}`);
}

function setProjectType(session, value, reason = 'unknown') {
    traceCaller('setProjectType');

    const old = session.projectType;

    // 🚫 Règle #1 : ne jamais écraser B/S/R/E par "?"
    if (["B", "S", "R", "E"].includes(old) && value === "?") {
        console.warn(`[UTILS setProjectType] Tentative d'écrasement de projectType "${old}" par "?" — bloqué`);
        return;
    }

    // 🚫 Règle #2 : si valeur forte identique → aucune action
    if (["B", "S", "R", "E"].includes(old) && old === value) {
        console.log(`[UTILS setProjectType] projectType déjà égal à "${value}" — aucune modification`);
        return;
    }

    // ✅ Initialisation minimale si structures manquantes
    if (!session.specValues) session.specValues = {};
    if (!session.askedSpecs) session.askedSpecs = {};
    if (typeof session.specValues.propertyUsage === "undefined") {
        console.log(`[UTILS setProjectType] property usage undefined end of setProjectType`);
        session.askedSpecs.propertyUsage = false;
    }

    // ✅ Mise à jour des deux emplacements
    console.log(`[UTILS setProjectType] tentative de synchronisation du projectType dans setProjectType`);
    session.projectType = value;
    session.specValues.projectType = value;
    console.log(`[UTILS setProjectType] synchronisation du projectType dans setProjectType compltée`);

    // ✅ Initialisation des specs uniquement si changement de ? → valeur forte
    if (old === "?" && ["B", "S", "R"].includes(value)) {
        initializeSpecFields(session, value);

    }

    // ✅ Initialisation forcée si value === "?" et aucune spec encore définie
    if (value === "?" && Object.keys(session.specValues).length === 0) {
        initializeSpecFields(session, value);
        console.log(`[INIT] Specs initialisées pour projectType="?" (post-reset)`);
    }

    const specs = Object.entries(session.specValues || {})
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');

    console.log(`[setProjectType] ... specs: ${JSON.stringify(session.specValues)}`);
}

function setSpecValue(session, key, value, source = "unspecified") {
    if (!session.specValues) session.specValues = {};

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

    // 🔁 Traitement spécial pour propertyUsage
    if (key === "propertyUsage") {
        if (value !== "1" && value !== "2" && value !== "E") {
            console.warn(`[UTILS] Valeur invalide pour propertyUsage : "${value}" → ignorée`);
            return; // ❌ Rejet immédiat
        }

        const usage = value === "1" ? "income"
            : value === "2" ? "personal"
                : "E";

        session.propertyUsage = usage;
        session.specValues[key] = usage;
        setAskedSpec(session, key, source);

        console.trace(`[utilsTRACK] propriété "propertyUsage" définie → "${usage}" | current state: projectType=${session.projectType}`);
        return;
    }


    // ✅ Mise à jour standard
    session.specValues[key] = value;

    // ✅ Ne pas faire de double log si déjà fait manuellement dans runDirector
    if (source !== "runDirector/?→E after 2 invalid") {
        setAskedSpec(session, key, source);
    }

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

function setAskedSpec(session, specKey, source = "manual") {
    if (!session.askedSpecs) {
        session.askedSpecs = {};
        console.warn(`[UTILS] askedSpecs manquant → recréé`);
    }
    session.askedSpecs[specKey] = true;
    console.log(`[UTILS set Asked specs] for ["${specKey}"] ← true | par: ${source}`);
}


module.exports = {
    getNextSpec,
    getCurrentSpec,
    initializeSpecFields,
    setProjectType,
    setSpecValue,
    setAskedSpec,
    gptClassifyProject,
    chatOnly,
    detectLanguageFromText
};
