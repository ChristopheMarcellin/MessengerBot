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
        console.log(`[XXXXXXXXXXXXXXXX CAS 1 interpreted = "${interpreted}"`);
        if (interpreted === "E") {
            setSpecValue(session, "propertyUsage", "E", "lié à projectType=E (user input)");
        }

        await stepWhatNext(context, "projectType");
        saveSession(context);
        return true;
    }

    // === Cas 2 : classification GPT ===
    const classification = await gptClassifyProject(message, session.language || "fr");
    const interpreted = getProjectTypeFromNumber(classification);
    const isValidGPT = ["B", "S", "R", "E"].includes(interpreted);//n'est pas un "?"
    const current = session.projectType;
    const alreadyAsked = session.askedSpecs.projectType === true;

    console.log(`XXXXXXXXXXXXXXXX CAS 2 interpreted = "${classification}" interpreted = "${interpreted}"`);

    if (isValidGPT) {
        setProjectType(session, interpreted, "interprétation par gpt");
       // console.log(`[stepHandleProjectType isValidGpt] = "${interpreted}"`);

        if (interpreted === "E") {
            setSpecValue(session, "propertyUsage", "E", "lié à projectType=E (GPT)");
        //    console.log(`[stepHandleProjectType] projectType=E (GPT) → propertyUsage aussi fixé à "E"`);
        }

    } else {
        // === Cas 3 : double échec GPT ===
        if (alreadyAsked && current === "?") {
            setProjectType(session, "E", "GPT → refus après 2 échecs");
            setSpecValue(session, "propertyUsage", "E", "lié à projectType=E (2 échecs GPT)");
           console.log(`[xxxxxx DIRECTOR !isValidGPT] projectType et propertyUsage passés à "E" après deux tentatives floues`);
        } else {
            setProjectType(session, "?", "GPT → invalide");
            setSpecValue(session, "propertyUsage", "?", "lié à projectType=? (GPT invalide)");
            console.log(`[xxxxxx stepHandleProjectType] projectType invalide → reste à "?"`);
        }
    }
    saveSession(context);
    await stepWhatNext(context, "projectType");
    return true;
}

module.exports = stepHandleProjectType;