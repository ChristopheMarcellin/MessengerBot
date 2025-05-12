// modules/utils.js

function traceCaller(label) {
    const stack = new Error().stack;
    const line = stack.split('\n')[3] || 'inconnu';
    console.log(`[TRACE] ${label} ← ${line.trim()}`);
}

function getNextSpec(session) {
    traceCaller('getNextSpec');
    if (!session || !session.askedSpecs || !session.specValues) return null;

    const allKeys = Object.keys(session.specValues);
    for (const key of allKeys) {
        if (!session.askedSpecs[key]) {
            console.log(`[NEXT] Prochaine spec attendue: ${key}`);
            return key;
        }
    }
    console.log('[NEXT] Aucune spec restante à poser');
    return null;
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
    session.projectType = value;
    console.log(`[TRACK] projectType changed from ${old} to ${value} | reason: ${reason}`);
    if (value !== old) {
        initializeSpecFields(session, value);
    }
}

function setSpecValue(session, key, value) {
    traceCaller('setSpecValue');
    if (!session.specValues) session.specValues = {};
    session.specValues[key] = value;
    console.trace(`[TRACK] spec "${key}" modifiée → "${value}"`);
}

module.exports = {
    getNextSpec,
    initializeSpecFields,
    setProjectType,
    setSpecValue,
};
