const axios = require('axios');
const allQuestions = require('./questions');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

async function tryToClassifyProjectType(session, userMessage) {
    const prompt = session.language === "fr"
        ? `Determinez le type de projet exprime par l'utilisateur. Repondez par B, S, R ou E.\n\n"${userMessage}"`
        : `Determine the user's project type. Reply with B, S, R, or E.\n\n"${userMessage}"`;

    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 10,
        temperature: 0
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
    });

    return res.data.choices?.[0]?.message?.content?.trim().toUpperCase();
}

module.exports = {
    setProjectType,
    initializeSpecFields,
    tryToClassifyProjectType
};
