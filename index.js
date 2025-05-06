const { setProjectType, initializeSpecFields } = require('../utils');
const { sendMessage } = require('../messenger');
const { getSession, setSession } = require('../sessionStore');
const axios = require('axios');

async function stepInitializeSession(context) {
    const { senderId, message, cleanText, res } = context;

    let existing = getSession(senderId);
    if (existing) {
        context.session = existing;
        return true;
    }

    // Nouvelle session : liaison immédiate au store
    const session = {};
    setSession(senderId, session);
    context.session = session;

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

    if (isVagueMessage) {
        console.log(`[DETECT] Message vague détecté → projectType annulé (était: ${project})`);
        project = "E";
    }

    // Remplissage contrôlé de la session
    session.language = language;
    session.ProjectDate = new Date().toISOString();
    session.questionCount = 1;
    session.maxQuestions = 40;
    session.askedSpecs = {};
    session.specValues = {};

    console.log(`[TRACK] projectType changed from undefined to ${project} | reason: GPT session init`);

    const finalProject = ["B", "S", "R"].includes(project) ? project : "?";

    if (finalProject !== "?") {
        setProjectType(session, finalProject, "GPT session init (contexte structuré)");
        initializeSpecFields(session);
    } else {
        if (project === "E") {
            console.log(`[TRACK] projectType changed from E to ? | reason: fallback → ?`);
        }

        setProjectType(session, "?", project === "E" ? "E → forced ?" : "fallback → ?");
        session.awaitingProjectTypeAttempt = 1;

        const retry = language === "fr"
            ? "Quelle est le but de votre projet : 1-acheter, 2-vendre, 3-louer, 4-autre raison ?\n(Répondez seulement par le chiffre svp)"
            : "What is your project goal: 1-buy, 2-sell, 3-rent, 4-other reason?\n(Please reply with the number only)";

        console.log(`[SEND] Asking for projectType after vague or unclear message (lang=${language}, GPT=${project})`);
        console.log(`[MESSAGE] → ${retry}`);

        await sendMessage(senderId, retry);
        return false;
    }

    console.log(`[INIT] New session for ${senderId} | Lang: ${language} | Project: ${finalProject}`);
    return true;
}

module.exports = { stepInitializeSession };
