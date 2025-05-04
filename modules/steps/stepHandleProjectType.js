// stepHandleProjectType.js

const { tryToClassifyProjectType } = require('../gptTools');
const { noSpecStarted } = require('../sessionHelpers');

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
