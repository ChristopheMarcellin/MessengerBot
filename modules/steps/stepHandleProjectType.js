// stepHandleProjectType.js

const axios = require('axios');

function noSpecStarted(session) {
  const specs = session.specValues || {};
  return Object.values(specs).every(value => value === "?");
}

async function tryToClassifyProjectType(session, userMessage) {
  const prompt = session.language === "fr"
    ? `Déterminez le type de projet exprimé par l'utilisateur. Répondez par B, S, R ou E.\n\n"${userMessage}"`
    : `Determine the user's project type. Reply with B, S, R, or E.\n\n"${userMessage}"`;

  const res = await axios.post('https://api.openai.com/v1/chat/completions', {
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

module.exports = async function stepHandleProjectType(session, userMessage) {
  const previousValue = session.projectType || "undefined";
  const isFirstMessage = previousValue === undefined;

  const classified = await tryToClassifyProjectType(session, userMessage);

  if (classified === "E" && isFirstMessage && noSpecStarted(session)) {
    session.projectType = "?";
    console.log(`[TRACK] projectType changed from ${previousValue} to ? | reason: fallback on vague first message`);
  } else {
    session.projectType = classified;
    console.log(`[TRACK] projectType changed from ${previousValue} to ${classified} | reason: GPT session init`);
  }

  return true;
};
