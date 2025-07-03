// modules/utils.js
const axios = require('axios');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const { getProjectTypeFromNumber } = require('./specEngine');
const { sendMessage } = require('./messenger');
const { questions } = require('./questions');



function traceCaller(label) {
    const stack = new Error().stack;
    const line = stack.split('\n')[3] || 'inconnu';
    console.log(`[UTILS traceCaller] ${label} ← ${line.trim()}`);
 }


function getNextSpec(session) {
    const { projectType, specValues = {}, askedSpecs = {} } = session;
    const propertyUsage = specValues.propertyUsage;

    // 🧩 LOGS DIAGNOSTIQUES
    console.log(`[getNextSpec] État initial → projectType="${projectType}", propertyUsage="${propertyUsage}"`);
    console.log(`[getNextSpec] specValues =`, JSON.stringify(specValues));
    console.log(`[getNextSpec] askedSpecs =`, JSON.stringify(askedSpecs));

    // Bloc 1 : spec manquantes de base
    if (projectType === '?') return 'projectType';

    // Bloc 0 : refus explicite
    if (projectType === 'E' || propertyUsage === 'E') return null;

    if (propertyUsage === '?' || propertyUsage === undefined) return 'propertyUsage';

    // Bloc 2 : specs spécifiques
    const typeBlock = questions[projectType];
    if (!typeBlock || typeof typeBlock !== 'object') {
        console.warn(`[getNextSpec] ❌ Aucune spec définie pour projectType="${projectType}"`);
        return 'none';
    }
    console.log(`[getNextSpec] ✅ Champs spécifiques pour ${projectType} =`, Object.keys(typeBlock));

    const skipIfIncome = ['bedrooms', 'bathrooms', 'garage', 'parking'];
    for (const field of Object.keys(typeBlock)) {
        console.log(`[getNextSpec DEBUG] Spéc = ${field} → ${specValues[field]}`);
        if (propertyUsage === 'income' && skipIfIncome.includes(field)) continue;
        if (specValues[field] === '?' || specValues[field] === undefined || specValues[field] === null) {
            return field;
        }
    }

    // Bloc 3 : specs génériques
    const genericBlock = questions.generic;
    if (!genericBlock || typeof genericBlock !== 'object') {
        console.warn(`[getNextSpec] ❌ Bloc générique introuvable`);
    } else {
        console.log(`[getNextSpec] ✅ Champs génériques =`, Object.keys(genericBlock));
        for (const field of Object.keys(genericBlock)) {
            if (
                specValues[field] === '?' ||
                specValues[field] === undefined ||
                specValues[field] === null
            ) {
                return field;
            }
        }
    }

    // Bloc 4 : tout est rempli ou refusé → on vérifie que toutes les specs ont été posées
    const allFields = [
        ...Object.keys(typeBlock || {}),
        ...Object.keys(genericBlock || {})
    ];

    const done = allFields.every(field =>
        askedSpecs[field] === true &&
        specValues[field] !== null
    );

    if (done) {
        console.log('[getNextSpec] ✅ Toutes les specs ont été posées et ont une valeur définie (même "?" ou "E")');
        return null;
    }

    console.warn('[getNextSpec] ⚠️ Specs terminées mais certaines non posées → incohérence');
    return 'none';

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

    console.log(`[UTILS initialize] Champs de spec initialisés pour project Type ${projectType}: ${list.join(', ')}`);
}

function setProjectType(session, value, caller = 'unknown') {
    traceCaller('setProjectType');

    const old = session.projectType;

    // 🚫 Règle fusionnée : aucune modification si écrasement par "?" ou si redondant
    if (["B", "S", "R", "E"].includes(old)) {
        if (value === "?") {
            console.warn(`[UTILS setProjectType] Tentative d'écrasement de projectType "${old}" par "?" — bloqué, caller = "${caller}"`);
            return;
        }
        if (old === value) {
            console.log(`[UTILS setProjectType] projectType déjà égal à "${value}" — aucune modification, caller ="${caller}"`);
            return;
        }
    }

    // ✅ Initialisation minimale si structures manquantes
    if (!session.specValues) session.specValues = {};
    if (!session.askedSpecs) session.askedSpecs = {};

    // ✅ Mise à jour
    console.log(`[UTILS setProjectType] la valeur qui sera affectée à session.projectType = "${value}", caller ="${caller}"`);
    session.projectType = value;

    // ✅ Initialisation des specs uniquement si changement de ? → B/S/R
    if ((old === undefined || old === "?") && ["B", "S", "R"].includes(value)) {

        initializeSpecFields(session, value);
    }

    console.log(`[UTILS setProjectType] ... specs: _${JSON.stringify(session.specValues)}_`);
}
function setSpecValue(session, key, value, caller = "unspecified") {
    if (!session.specValues) session.specValues = {};

    const old = session.specValues[key];

    // 🚫 Ne pas écraser une vraie valeur par "?" (ex: 3 → ?)
    if (old && old !== "?" && old !== "E" && value === "?") {
        console.warn(`[UTILS] Tentative d'écrasement de "${key}"="${old}" par "?" — bloqué, caller ="${caller}"`);
        return;
    }

    // 🚫 Éviter la réécriture identique
    if (old === value) {
        console.log(`[UTILS] spec "${key}" déjà égale à "${value}" — aucune ré-écriture, caller ="${caller}"`);
        return;
    }

    // 🔁 Traitement spécial pour propertyUsage
    if (key === "propertyUsage") {
        if (value === "?") {
            session.specValues[key] = "?";
            console.trace(`[utilsTRACK] propriété "propertyUsage" initialisée à "?" | caller ="${caller}"`);
            return;
        }

        if (value !== "1" && value !== "2" && value !== "E") {
            console.warn(`[UTILS] Valeur invalide pour propertyUsage : "${value}" → ignorée , caller ="${caller}"`);
            return; // ❌ Rejet immédiat
        }

        const usage = value === "1" ? "income"
            : value === "2" ? "personal"
                : "E";

        session.specValues[key] = usage;
        console.trace(`[utilsTRACK] propriété "propertyUsage" définie → "${usage}" | current state: projectType=${session.projectType}, caller ="${caller}"`);
        return;
    }

    // ✅ Mise à jour standard
    session.specValues[key] = value;

    // ✅ Ne pas faire de double log si déjà fait manuellement dans runDirector
    if (caller !== "runDirector/?→E after 2 invalid") {
        //    setAskedSpec(session, key, caller);
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
        console.warn(`[UTILS setAskedSpec] array askedSpecs manquant recréé par: ${source}`);
    }
    session.askedSpecs[specKey] = true;
    console.log(`[UTILS setAskedspec] for ["${specKey}"] = true | par: ${source}`);
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
