const { isValidAnswer, getProjectTypeFromNumber } = require('../specEngine');
const {setProjectType, gptClassifyProject, setSpecValue } = require('../utils');
const { stepWhatNext } = require('./stepWhatNext');
const { saveSession } = require('../sessionStore');

async function stepHandleProjectType(context) {

    const { message, session } = context;
    const isValid = await isValidAnswer(context, session.projectType, "projectType", session.language || "fr");
    // === Cas 1 : entrée utilisateur valide (1,2,3,4) ===
    if (isValid) {
        const interpreted = getProjectTypeFromNumber(message);
        setProjectType(session, interpreted, "user input");

        if (interpreted === "E") {
            setSpecValue(session, "propertyUsage", "E", "lié à projectType=E (user input)");
            console.log(`[stepHandleProjectType] projectType=E (option 4) → propertyUsage aussi fixé à "E"`);
        }

        await stepWhatNext(context, "projectType");
        saveSession(context);
        return true;
    }

    // === Cas 2 : classification GPT ===
    const classification = await gptClassifyProject(message, session.language || "fr");
    const interpreted = getProjectTypeFromNumber(classification);
    console.log(`[stepHandleProjectType] classification = "${classification}" interpreted = "${interpreted}"`);
    const isValidGPT = ["B", "S", "R", "E"].includes(interpreted);
    const current = session.projectType;
    const alreadyAsked = session.askedSpecs.projectType === true;

    if (isValidGPT) {
        setProjectType(session, interpreted, "interprétation par gpt");
        console.log(`[stepHandleProjectType isValidGpt] = "${interpreted}"`);

        if (interpreted === "E") {
            setSpecValue(session, "propertyUsage", "E", "lié à projectType=E (GPT)");
            console.log(`[stepHandleProjectType] projectType=E (GPT) → propertyUsage aussi fixé à "E"`);
        }

    } else {
        // === Cas 3 : double échec GPT ===
        if (alreadyAsked && current === "?") {
            setProjectType(session, "E", "GPT → refus après 2 échecs");
            setSpecValue(session, "propertyUsage", "E", "lié à projectType=E (2 échecs GPT)");
            console.log(`[DIRECTOR !isValidGPT] projectType et propertyUsage passés à "E" après deux tentatives floues`);
        } else {
            setProjectType(session, "?", "GPT → invalide");
            console.log(`[stepHandleProjectType] projectType invalide → reste à "?"`);
        }
    }

    console.log('[DIRECTOR isValidGPT] projectType détecté et traité via GPT');
    saveSession(context);
    await stepWhatNext(context, "projectType");
    return true;
}




module.exports = stepHandleProjectType;