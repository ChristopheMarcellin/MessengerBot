const {
    isValidAnswer,
    getProjectTypeFromNumber
} = require('../specEngine');

const {
    setProjectType,
    gptClassifyProject
} = require('../utils');

const { stepWhatNext } = require('./stepWhatNext');
const { saveSession } = require('../sessionStore');

async function stepHandleProjectType(context) {
    const { message, session } = context;

    const isValid = isValidAnswer(message, "projectType", "projectType");

    if (isValid) {
        const interpreted = getProjectTypeFromNumber(message);
        setProjectType(session, interpreted, "user input");
        await stepWhatNext(context, "projectType");
        saveSession(context);
        return true;
    }

    const interpreted = await gptClassifyProject(message, session.language || "fr");
    const isValidGPT = ["B", "S", "R", "E"].includes(interpreted);
    const current = session.projectType;
    const alreadyAsked = session.askedSpecs.projectType === true;

    if (isValidGPT) {
        setProjectType(session, interpreted, "interprétation par gpt");
    } else {
        if (alreadyAsked && current === "?") {
            setProjectType(session, "E", "GPT → refus après 2 échecs");
            console.log(`[DIRECTOR !isValidGPT] projectType passé à "E" après deux tentatives floues`);
        } else {
            setProjectType(session, "?", "GPT → invalide");
        }
    }

    console.log('[DIRECTOR isValidGPT] projectType détecté et traité via GPT');
    saveSession(context);
    await stepWhatNext(context, "projectType");
    return true;
}

module.exports = stepHandleProjectType;