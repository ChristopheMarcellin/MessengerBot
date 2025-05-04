const { getNextUnansweredSpec } = require('./specEngine');
const allQuestions = require('./questions');

function setProjectType(session, value, reason = "unspecified") {
    const previous = session.specValues?.projectType ?? "undefined";
    session.specValues.projectType = value;
    console.log(`[TRACK] projectType changed from ${previous} to ${value} | reason: ${reason}`);
}

function initializeSpecFields(session) {
    const type = session.specValues?.projectType;
    const fields = allQuestions?.[type];
    if (!type || !fields) return;

    if (!session.specValues || Object.keys(session.specValues).length <= 1) {
        session.specValues = { projectType: type };
        Object.keys(fields).forEach(key => {
            session.specValues[key] = "?";
        });
    }
}

function allSpecsCollected(session) {
    return !getNextUnansweredSpec(session);
}

async function tryToClassifyProjectType(session, userMessage) {
    const prompt = session.language === "fr"
        ? `Determinez le type de projet exprime par l'utilisateur. Repondez par B, S, R ou E.\n\n"${userMessage}"`
        : `Determine the user's project type. Reply with B, S, R, or E.\n\n"${userMessage}"`;

    const res = await require('axios').post('https://api.openai.com/v1/chat/completions', {
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

    return res.data.choices?.[0]?.message?.content?.trim().toUpperCase();
}

module.exports = {
    setProjectType,
    initializeSpecFields,
    allSpecsCollected,
    tryToClassifyProjectType
};
