const { setProjectType, initializeSpecFields } = require('../utils');
const { sendMessage } = require('../messenger');
const { getSession, setSession } = require('../sessionStore');
const axios = require('axios');

async function stepInitializeSession(context) {
    const { senderId, message, cleanText } = context;

    // 🔐 Vérifier présence du senderId
    if (typeof senderId !== 'string' || senderId.trim() === '') {
        console.warn('[INIT] senderId manquant → impossible de poursuivre.');
        context._initStatus = 'error';
        return false;
    }

    // 🧠 Session existante ou création vide
    let session = getSession(senderId);
    if (!session || typeof session !== 'object') {
        session = {};
        console.log('[INIT] Aucune session trouvée → nouvelle session créée');
    }

    setSession(senderId, session);
    context.session = session;

    const isEndSession = message.trim().toLowerCase() === 'end session';
    if (isEndSession) {
        console.log('[InitBLOCK] "end session" détecté → session réinitialisée');

        const reset = {
            language: 'fr',
            ProjectDate: new Date().toISOString(),
            questionCount: 0,
            maxQuestions: 40,
            askedSpecs: {},
            specValues: {},
            projectType: undefined,
            currentSpec: null
        };

        setSession(senderId, reset);
        context.session = reset;
        context._initStatus = 'reset';
        return false;
    }

    // 🧼 Normalisation minimale
    session.language ??= 'fr';
    session.ProjectDate ??= new Date().toISOString();
    session.questionCount ??= 1;
    session.maxQuestions ??= 40;
    session.askedSpecs ??= {};
    session.specValues ??= {};
    session.currentSpec ??= null;

    // 🎯 Détecter l’état logique
    const hasProject = typeof session.projectType === 'string' && ['B', 'S', 'R'].includes(session.projectType);
    const hasAskedSpecs = Object.values(session.askedSpecs).some(v => v === true);

    if (hasProject && hasAskedSpecs) {
        console.log('[INIT] Session en cours détectée → reprise possible');
        context._initStatus = 'resume';
        return true;
    }

    if (hasProject && !hasAskedSpecs) {
        console.log('[INIT] ProjectType connu mais specs non commencées → prêt à commencer');
        context._initStatus = 'continue';
        return true;
    }

    // 🤖 Classification GPT
    const vagueInputs = [
        "bonjour", "allo", "salut", "hello", "hi", "cc", "ça va",
        "comment ca va", "comment ça va", "yo", "hey", "coucou", "re"
    ];
    const isVague = vagueInputs.some(g => cleanText === g || cleanText.startsWith(g));

    const prompt = `
Tu es un assistant spécialisé en immobilier. Classe le message de l'utilisateur dans l'une des catégories suivantes :
- B : l'utilisateur veut acheter une propriété
- S : l'utilisateur veut vendre une propriété
- R : l'utilisateur veut louer une propriété
- E : toute autre situation (salutation, question, humour, etc.)

Réponds uniquement par : B, S, R ou E.

Message : "${message}"`.trim();

    let project = "E";

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
        console.warn(`[Init GPT ERROR] GPT erreur :`, err.message);
    }

    if (isVague) {
        console.log(`[InitDETECT] Message vague détecté → projectType forcé à ? (était: ${project})`);
        project = "E";
    }

    const finalProject = ["B", "S", "R"].includes(project) ? project : "?";

    if (finalProject !== "?") {
        setProjectType(session, finalProject, "GPT session init");
        initializeSpecFields(session);
        console.log(`[INIT] Nouvelle session avec projectType = ${finalProject}`);
        context._initStatus = 'fresh';
        return true;
    }

    // 🟡 Si projet indéfini, on relance la question
    setProjectType(session, "?", project === "E" ? "E → forced ?" : "fallback → ?");
    session.awaitingProjectTypeAttempt = 1;

    const retry = session.language === "fr"
        ? "Quelle est le but de votre projet : 1-acheter, 2-vendre, 3-louer, 4-autre raison ?\n(Répondez seulement par le chiffre svp)"
        : "What is your project goal: 1-buy, 2-sell, 3-rent, 4-other reason?\n(Please reply with the number only)";

    console.log(`[InitSent] Poser la question projet (lang=${session.language}, GPT=${project})`);
    console.log(`[InitMessenger] → ${retry}`);
    await sendMessage(senderId, retry);
    context._initStatus = 'retry';
    return false;
}

module.exports = { stepInitializeSession };
