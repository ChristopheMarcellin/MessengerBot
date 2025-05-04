// stepHandleProjectType.js

const { Configuration, OpenAIApi } = require('openai');

function noSpecStarted(session) {
  const specs = session.specValues || {};
  return Object.values(specs).every(value => value === "?");
}

async function tryToClassifyProjectType(userMessage) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const prompt = `Catégorise le projet en répondant par une seule lettre :
B pour acheter,
S pour vendre,
R pour louer,
E si ce n’est pas clair.
Message utilisateur : "${userMessage}"`;

  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
  });

  const answer = response.data.choices[0].message.content.trim().toUpperCase();
  if (["B", "S", "R"].includes(answer)) return answer;
  return "E";
}

module.exports = async function stepHandleProjectType(session, userMessage) {
  const previousValue = session.projectType || "undefined";
  const isFirstMessage = previousValue === undefined;

  const classified = await tryToClassifyProjectType(userMessage);

  if (classified === "E" && isFirstMessage && noSpecStarted(session)) {
    session.projectType = "?";
    console.log(`[TRACK] projectType changed from ${previousValue} to ? | reason: fallback on vague first message`);
  } else {
    session.projectType = classified;
    console.log(`[TRACK] projectType changed from ${previousValue} to ${classified} | reason: GPT session init`);
  }

  return true;
};
