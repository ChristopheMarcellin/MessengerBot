const questions = require('./questions');
const displayMap = require('./displayMap');

// Génère la question avec les choix dynamiques selon la langue
function getPromptForSpec(projectType, specKey, lang = "en") {
    const questionSet = questions?.[projectType];
    const rawQuestion = questionSet?.[specKey]?.text || `${specKey}?`;

    const options = displayMap?.[specKey]?.[lang];
    let formattedChoices = "";

    if (options) {
        formattedChoices = Object.entries(options)
            .map(([key, label]) => `${key} → ${label}`)
            .join("\n");
    }

    return formattedChoices
        ? `${rawQuestion}\n${formattedChoices}`
        : rawQuestion;
}

// Retourne le prochain champ non répondu
const getNextUnansweredSpec = (session) => {
    const projectType = session.specValues?.projectType;
    if (!projectType || !questions[projectType]) return undefined;

    return Object.keys(questions[projectType]).find(
        (key) => session.specValues[key] === null || session.specValues[key] === "?"
    );
};

// Faut-il poser une nouvelle question ?
const shouldAskNextSpec = (session) => {
    return !!getNextUnansweredSpec(session);
};

// Mise à jour de la valeur
