// modules/specEngine.js

const questions = require('./questions');

const getPromptForSpec = (projectType, specName, lang = 'en') => {
    return questions[projectType]?.[specName]?.[lang] || "Please provide this detail:";
};

const getNextUnansweredSpec = (session) => {
    const projectType = session.specValues?.projectType;
    if (!projectType || !questions[projectType]) return undefined;

    return Object.keys(questions[projectType]).find((key) => session.specValues[key] === null || session.specValues[key] === "?");
};

const shouldAskNextSpec = (session) => {
    return !!getNextUnansweredSpec(session);
};

const updateSpecFromInput = (field, decodedValue, specValues) => {
    specValues[field] = decodedValue || "?";
};

const buildSpecSummary = (session, lang = 'en') => {
    const projectType = session.specValues?.projectType;
    if (!projectType || !questions[projectType]) return "";

    const entries = Object.keys(questions[projectType]).map((key) => {
        const label = questions[projectType][key][lang]
            .split("?")[0]
            .replace(/(How many|Do you have|What is|What|Combien|Avez-vous|Quel est|Quel|Dans quelle ville ou quel quartier)( de)?/gi, "")
            .trim();

        return `- ${label} : ${session.specValues[key] || "?"}`;
    });

    const intro = lang === 'fr' ? "Voici ce que j’ai compris :" : "Here’s what I’ve gathered:";
    const outro = lang === 'fr' ? "Est-ce que tout est correct ?" : "Is everything correct?";

    return [intro, ...entries, outro].join("\n");
};

const resetInvalidSpecs = (session) => {
    for (let key in session.specValues) {
        if (session.specValues[key] === "?") {
            delete session.specValues[key];
        }
    }
};

module.exports = {
    getPromptForSpec,
    getNextUnansweredSpec,
    shouldAskNextSpec,
    updateSpecFromInput,
    buildSpecSummary,
    resetInvalidSpecs,
};