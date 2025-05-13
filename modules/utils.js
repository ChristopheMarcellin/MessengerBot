// modules/utils.js

function traceCaller(label) {
    const stack = new Error().stack;
    const line = stack.split('\n')[3] || 'inconnu';
    console.log(`[TRACE] ${label} ← ${line.trim()}`);
}
function getNextSpec(projectType, specValues = {}, askedSpecs = {}) {
    // 1. Cas spécial : projectType manquant ou non demandé
    if (projectType === "?" || askedSpecs.projectType !== true) {
        return "projectType";
    }

    // 2. Cas spécial : projectType = E → aucun traitement structuré
    if (projectType === "E") {
        return "none";
    }

    // 3. Liste des specs à poser selon le type de projet
    const specsByType = {
        B: ["price", "bedrooms", "bathrooms", "garage", "location"],
        S: ["price", "bedrooms", "bathrooms", "garage", "location"],
        R: ["price", "bedrooms", "bathrooms", "parking", "location"]
    };

    const specList = specsByType[projectType] || [];

    // 4. Parcours des specs en ordre → première à poser (non posée ou vide)
    for (const field of specList) {
        const isAsked = askedSpecs[field] === true;
        const isAnswered = typeof specValues[field] !== "undefined" && specValues[field] !== "?";
        if (!isAsked || !isAnswered) {
            return field;
        }
    }

    // 5. Si tout est posé et répondu → on retourne "summary"
    return "summary";
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

    console.log(`[INIT] Champs de spec initialisés pour ${projectType}: ${list.join(', ')}`);
}

function setProjectType(session, value, reason = 'unknown') {
    traceCaller('setProjectType');

    const old = session.projectType;

    // 🚫 Règle #1 : ne pas écraser B/S/R par "?"
    if (["B", "S", "R"].includes(old) && value === "?") {
        console.warn(`[BLOCKED] Tentative d'écrasement de projectType "${old}" par "?" — bloqué`);
        return;
    }

    // 🚫 Règle #2 : ne pas réécrire la même valeur
    if (old === value) {
        console.log(`[SKIP] projectType déjà égal à "${value}" — aucune modification`);
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
        console.warn(`[BLOCKED] Tentative d'écrasement de "${key}"="${old}" par "?" — bloqué`);
        return;
    }

    // 🚫 Éviter la réécriture identique
    if (old === value) {
        console.log(`[SKIP] spec "${key}" déjà égale à "${value}" — aucune modification`);
        return;
    }

    // ✅ Mise à jour acceptée
    session.specValues[key] = value;
    session.askedSpecs[key] = true;

    const specs = Object.entries(session.specValues)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');

    console.trace(`[TRACK] spec "${key}" modifiée → "${value}" | current state: projectType=${session.projectType} | specs: ${specs}`);
}


module.exports = {
    getNextSpec,
    getCurrentSpec,
    initializeSpecFields,
    setProjectType,
    setSpecValue,
};
