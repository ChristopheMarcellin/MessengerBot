const { setProjectType, initializeSpecFields } = require('../utils');
const { sendMessage } = require('../messenger');
const { getSession, setSession } = require('../sessionStore');
const axios = require('axios');

async function stepInitializeSession(context) {
    const { senderId, message, cleanText, res } = context;

    let session = getSession(senderId);
    if (session) {
        context.session = session;
        return true;
    }

    // Nouvelle session
    const vagueInputs = [
        "bonjour", "allo", "salut", "hello", "hi", "cc", "ça va",
        "comment ca va", "comment ça va", "yo", "hey", "coucou", "re"
    ];

    const isVagueMessage = vagueInputs.some(g => cleanText === g || cleanText.startsWith(g));

    // Prompt structuré pour GPT
    const prompt = `
Tu es un assistant spécialisé en immobilier. Classe le message de l'utilisateur dans l'une des catégories suivantes :
- B : l'utilisateur veut acheter une propriété
- S : l'utilisateur veut vendre une propriété
- R : l'utilisateur veut louer une propriété
- E : toute autre situation (salutation, question, humour, etc.)

Réponds uniquement par : B, S, R ou E.

Message : "${message}"`.trim();

    let project = "E";
    let language = "fr";

    try {
        const gptRes = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 10,
            temperature: 0
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const content = gptRes.data.choices?.[0]?.message?.content?.trim().toUpperCase();
        if (["B", "S", "R", "E"].includes(content)) {
            project = content;
        }

    } catch (err) {
        console.warn(`[GPT ERROR] Unable to classify project type:`, err.message);
    }

    // Si message vague → override GPT
    if (isVagueMessage) {
        console.log(`[DETECT] Message vague détecté → projectType annulé (était: ${project})`);
        project = "E";
    }

    // Initialisation session
    session = {
        language,
        ProjectDate: new Date().toISOString(),
        questionCount: 1,
        maxQuestions: 40,
        askedSpecs: {},
        specValues: {}
    };

    // 🔁 Tracking GPT classification
    console.log(`[TRACK] projectType changed from undefined to ${project} | re
