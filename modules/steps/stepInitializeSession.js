const { setProjectType, initializeSpecFields } = require('../utils');
const { getSession, setSession } = require('../sessionStore');
const axios = require('axios');

// 🔎 Fonction d'audit de la session
function logSessionState(label, session) {
    const snapshot = {
        language: session.language,
        ProjectDate: session.ProjectDate,
        questionCount: session.questionCount,
        maxQuestions: session.maxQuestions,
        askedSpecs: session.askedSpecs,
        specValues: session.specValues,
        projectType: session.projectType,
        currentSpec: session.currentSpec
    };
    console.log(`[INIT] ${label} :`, JSON.stringify(snapshot, null, 2));
}

async function stepInitializeSession(context) {
    const { senderId, message, cleanText } = context;

    // 🔐 Vérifier présence du senderId
    if (typeof senderId !== 'string' || senderId.trim() === '') {
        console.warn('[INIT] senderId manquant → impossible de poursuivre.');
        return true;
    }

    // 🧠 Session existante ou création vide
    let session = getSession(senderId);
    if (!session || typeof session !== 'object') {
        console.log('[INIT] Aucune session trouvée dans le store → nouvelle session créée');
        session = {};
    } else {
        console.log('[INIT] Session existante trouvée dans le store');
    }

    // 🔍 Log AVANT réparation
    logSessionState("Vérification AVANT réparation", session);

    // 🔧 Réparation
    const isEndSession = message.trim().toLowerCase() === 'end session';
    if (isEndSession) {
        console.log('[INIT] "end session" détecté → session réinitialisée à neuf');
        session = {
            language: 'fr',
            ProjectDate: new Date().toISOString(),
            questionCount: 0,
            maxQuestions: 40,
            askedSpecs: {},
            specValues: {},
            projectType: undefined,
            currentSpec: null
        };
        setSession(senderId, session);
        context.session = session;
        logSessionState("Vérification APRÈS réparation (post-reset)", session);
        return true;
    }

    // 🧼 Normalisation minimale
    session.language ??= 'fr';
    session.ProjectDate ??= new Date().toISOString();
    session.questionCount ??= 1;
    session.maxQuestions ??= 40;
    session.askedSpecs ??= {};
    session.specValues ??= {};
    session.currentSpec ??= null;

    // 🔍 Log APRÈS réparation
    logSessionState("Vérification APRÈS réparation", session);

    // 🎯 Analyse projectType logique
    const hasProject = typeof session.projectType === 'string' && ['B', 'S', 'R'].includes(session.projectType);
    const hasAskedSpecs = Object.values(session.askedSpecs).some(v => v === true);

    if (hasProject && hasAskedSpecs) {
        console.log('[INIT] Session en cours détectée → reprise possible');
        setSession(senderId, session);
        context.session = session;
        return true;
    }

    if (hasProject && !hasAskedSpecs) {
        console.log('[INIT] ProjectType connu mais specs non commencées → prêt à commencer');
        setSession(senderId, session);
        context.session = session;
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
- ? : toute autre situation (salutation, question, humour, etc.)

Réponds uniquement par : B, S, R ou ?.

Message : "${message}"`.trim();

    let project = "?";

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
        if (["B", "S", "R", "?"].includes(content)) {
            project = content;
        }

    } catch (err) {
        console.warn(`[INIT] GPT erreur :`, err.message);
    }

    const finalProject = ["B", "S", "R"].includes(project) ? project : "?";

    if (finalProject !== "?") {
        setProjectType(session, finalProject, "GPT session init");
        initializeSpecFields(session);
        console.log(`[INIT] Nouvelle session avec projectType = ${finalProject}`);
    } else if (typeof session.projectType === "undefined") {
        setProjectType(session, "?", "GPT → ?");
    }

    setSession(senderId, session);
    context.session = session;

    return true;
}

module.exports = { stepInitializeSession };
