const axios = require('axios');
const { setProjectType, initializeSpecFields } = require('../utils');
const { sendMessage } = require('../messenger');

const userSessions = require('../../index').userSessions;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function stepInitializeSession(context) {
    const { senderId, message, cleanText, greetings } = context;
    if (userSessions[senderId]) return true;

    const prompt = `Detect user's language and project intent. Return JSON like: {"language": "en/fr", "project": "B/S/R/E"}\n\n"${message}"`;

    const detectionResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0
    }, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }
    });

    let lang = 'en', project;
    try {
        const parsed = JSON.parse(detectionResponse.data.choices?.[0]?.message?.content?.replace(/```json|```/g, '').trim());
        lang = parsed.language || 'en';
        project = parsed.project;
    } catch {
        console.warn('[DETECT] Failed to parse detection result.');
    }

    if (greetings.some(g => cleanText.includes(g))) project = undefined;

    console.log(`[INIT] New session for ${senderId} | Lang: ${lang} | Project: ${project || 'undefined'}`);

    userSessions[senderId] = {
        language: lang,
        ProjectDate: new Date().toISOString(),
        questionCount: 1,
        maxQuestions: 40,
        askedSpecs: {},
        specValues: {}
    };

    const session = userSessions[senderId];
    const finalProject = ['B', 'S', 'R'].includes(project) ? project : '?';

    if (finalProject !== '?') {
        setProjectType(session, finalProject, 'GPT session init (confident)');
        initializeSpecFields(session);
        return true;
    }

    setProjectType(session, '?', project === 'E' ? 'E -> forced ?' : 'fallback -> ?');
    session.awaitingProjectType = 'firstTry';

    const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o',
        messages: [{
            role: 'user',
            content: (lang === 'fr' ? 'Repondez en francais : ' : 'Please answer in English: ') + message
        }],
        max_tokens: 400,
        temperature: 0.5
    }, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }
    });

    const fallback = gptResponse.data.choices?.[0]?.message?.content?.trim() || (
        lang === 'fr' ? 'Desole, je nai pas compris.' : 'Sorry, I did not understand.'
    );

    await sendMessage(senderId, fallback);

    const question = lang === 'fr'
        ? 'Quel est le but de votre projet ? 1-acheter, 2-vendre, 3-louer, 4-autre raison (svp repondez avec un chiffre seulement).'
        : 'What is the purpose of your project? 1-buy, 2-sell, 3-rent, 4-other reason (please reply with a number only).';

    session.askedSpecs.projectType = true;
    await sendMessage(senderId, question);

    return false;
}

module.exports = stepInitializeSession;
