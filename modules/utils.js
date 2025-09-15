// modules/utils.js
const axios = require('axios');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const { sendMessage } = require('./messenger');
const { questions } = require('./questions');
const { getMaxQuestions } = require('./googleData');
const evalPrix = require('./evalPrix');

console.log("🧩 [utils.js] **************************** Chargé — typeof isNumeric =", typeof isNumeric);

function stripGptSignature(text) {
    return text
        .replace(/\[.*?\]/g, '')        // Supprime les blocs comme [Votre Nom], [Coordonnées], etc.
        .replace(/\n{2,}/g, '\n')       // Réduit les doubles sauts de ligne
        .trim();
}

// === 🆕 Historique des conversations par utilisateur ===


function buildContextualPrompt(senderId, currentMessage, session, lang = 'fr') {
    if (!session.conversationHistory) session.conversationHistory = [];
    session.conversationHistory.push(currentMessage);
    if (session.conversationHistory.length > 5) {
        session.conversationHistory.shift(); // garde les 5 derniers
    }

    // Historique excluant le message courant
    const previous = session.conversationHistory.slice(0, -1).join(' ');
    const history = previous.trim();

    // Specs concaténées
    const specSummary = session?.specSummary ? session.specSummary.replace(/\n/g, ' ') : "";

    // Retourne juste contexte + specs, sans currentMessage
    return `${history} ${specSummary}`.trim();
}


// ✅ Nouveau format centralisé de FAQ, indexé par catégorie
const faqMapByKey = {
    hours: {
        fr: "Si vous désirez connaître nos heures de travail, sachez que nous sommes flexibles. N'hésitez pas à nous contacter pour en savoir davantage.",
        en: "If you would like to know our working hours, please note that we are flexible. Feel free to contact us for more details."
    },
    contact: {
        fr: "Pour nous joindre rapidement ou consulter nos offres, contacter le 514-231-6370 (Christophe Marcellin) ou le (514) 912-5343 (Carole Baillargeon), par courriel christophe.marcellin@century21 carole.baillargeon@century21.ca, pour nos offres en ligne et notre site: www.carolebaillargeon.com ou www.christophe-marcellin.c21.ca",
        en: "To contact us quickly or browse our listings, call 514-231-6370 (Christophe Marcellin) or (514) 912-5343 (Carole Baillargeon), or email christophe.marcellin@century21 and carole.baillargeon@century21.ca. For our online offers and websites: www.carolebaillargeon.com or www.christophe-marcellin.c21.ca"
    },
    consultation: {
        fr: "Nous pouvons vous aider à estimer votre bien sur une base de comparables. La consultation est gratuite, et inclut l'estimation de votre bien.  Vous pouvez même me demander une approximation tout de suite pour votre adresse cible.  Toutefois, seuls Carole ou Christophe peuvent vous fournir un estimé fiable: la qualité des comparables, la condition de votre propriété, son emplacement, les rénovations faites sont autant de facteurs à considérer auxquels CasaNova ne peut répondre.",
        en: "We can help you estimate your property based on comparable sales. The consultation is free and includes an estimate of your property. You can even ask me for an approximation right away for your your address. However, only Carole or Christophe can provide you with a reliable estimate: the quality of the comparables, the condition of your property, its location, and any renovations made are all factors to consider that CasaNova cannot fully address."
    },
    rental: {
        fr: "Dans le domaine de la location, nous pouvons vous aider à promouvoir votre offre de location et trouver votre prochain locataire.",
        en: "In rental services, we can help you market your property and find your next tenant."
    },
    commercial: {
        fr: "Nous sommes accrédités pour vous aider tant côté commercial que résidentiel.",
        en: "We are accredited to assist with both commercial and residential real estate."
    },
    territory: {
        fr: "Nous sommes très actifs dans les secteurs du Vieux Montréal, l'Ile des Soeurs, Griffintown et Saint-Lambert.",
        en: "We are very active in the areas of Old Montreal, Nuns’ Island, Griffintown, and Saint-Lambert."
    },
    carole: {
        fr: "Carole pratique le courtage immobilier depuis plus de 25 ans et a remporté de nombreux prix. Désignée Maître Vendeur en 2000, 2001, 2002, 2010, 2014 à 2024 et Prix Centurion 2003 à 2013 (2010 exclus) et membre du temple de la Renommée Canada 2007.",
        en: "Carole has been a real estate broker for over 25 years and has won numerous awards. She was named Master Salesperson in 2000, 2001, 2002, 2010, 2014 to 2024 and received the Centurion Award from 2003 to 2013 (except 2010), and is a member of the Century 21 Canada Hall of Fame since 2007."
    },
    christophe: {
        fr: "Christophe pratique le courtage depuis 2 ans et apporte à sa clientèle 25 ans d'expérience en technologie pour vous aider à vendre rapidement. Cet assistant virtuel est d'ailleurs un excellent exemple de la technologie à votre service.",
        en: "Christophe has been a broker for 2 years and brings 25 years of technology experience to help his clients sell efficiently. This virtual assistant is a great example of technology working for you."
    },
    office:
    {
        fr: "Notre bureau Century 21 est situé au 1980 Rue Notre-Dame Ouest. Montréal, QC H3J1M8. Contact. Principal: (514) 933-1221",
        en: "Our Century 21 office is located at 1980 Rue Notre-Dame Ouest. Montréal, QC H3J1M8. Contact. Principal: (514) 933-1221"
    },
    team: {
        fr: "Carole et Christophe font équipe pour mieux vous servir. Carole apporte plus de 25 ans d'expérience en courtage et est gagnante de nombreux prix. Christophe met à votre service son expérience de courtier et 25 ans d'expérience en technologie pour vous aider à vendre rapidement ou acheter.",
        en: "Carole and Christophe work together to better serve you. Carole brings over 25 years of brokerage experience and many awards, while Christophe offers his brokerage expertise combined with 25 years in tech to help you sell or buy quickly."
    },
    homestaging: {
        fr: "Bien entendu, nous vous aidons à montrer votre propriété sous son meilleur jour en vous fournissant les services conseils appropriés.",
        en: "Of course, we help you homestage your property at its best by providing the appropriate advisory services."
    },
    website: {
        fr: "En plus de nos sites Web respectifs www.carolebaillargeon.com et https://christophe-marcellin.c21.ca/ pour consulter nos propriétés en vente, nous pouvons concevoir rapidement un site qui présente les propriétés qui se concentrent sur vos attentes.",
        en: "In addition to our respective websites www.carolebaillargeon.com and https://christophe-marcellin.c21.ca/ to view our properties for sale, we can quickly design a website that showcases properties precisely matching your expectations."
    }
};

async function classifyIntent(message, lang = 'fr') {
    // Petits raccourcis directs
    if (/carole/i.test(message)) return "faq:carole";
    if (/christophe|marcellin/i.test(message)) return "faq:christophe";

    const faqExamples = lang === 'fr'
        ? `Exemples :\n` +
        `"Quand êtes-vous ouverts ?" → faq:hours\n` +
        `"Quelles sont vos heures d'affaires ?" → faq:hours\n` +
        `"Comment procédez-vous pour faire l'estimation d'une propriété" → faq:consultation\n` +
        `"Est-ce que vous aidez pour la location ?" → faq:rental\n` +
        `"Puis-je vous appeler directement ?" → faq:contact\n` +
        `"Où est situé votre bureau ?" → faq:contact\n` +
        `"Qui est carole baillargeon, quelle est son expérience ?" → faq:carole\n` +
        `"Qui est christophe marcellin, quelle est son expérience ?" → faq:christophe\n` +
        `"Que pouvez-vous me dire de votre équipe ?" → faq:team\n` +
        `"Faites-vous de la location ou du locatif ?" → faq:rental\n` +
        `"Faites-vous des propriétés commerciales ?" → faq:commercial\n` +
        `"Quelle est votre adresse, où sont situés vos bureaux ?" → faq:office\n` +
        `"Travaillez-vous sur la Rive-Sud ou à Montréal ?" → faq:territory\n` +
        `"Faites-vous de la valorisation immobilière ou du home staging ?" → faq:homestaging\n` +
        `"Parlez moi de votre site web ou du siteweb personnalisé" → faq:website\n`
        : `Examples:\n` +
        `"What are your business hours?" → faq:hours\n` +
        `"How does an evaluation work?" → faq:consultation\n` +
        `"Do you handle rentals?" → faq:rental\n` +
        `"Can I call you directly?" → faq:contact\n` +
        `"Where is your office located?" → faq:contact\n` +
        `"Who is Carole Baillargeon, what is her experience?" → faq:carole\n` +
        `"Who is Christophe Marcellin, what is his experience?" → faq:christophe\n` +
        `"What can you tell me about your team?" → faq:team\n` +
        `"Do you work with commercial properties?" → faq:commercial\n` +
        `"What is your address, where are your offices located?" → faq:office\n` +
        `"Do you work on the South Shore and or in Montreal?" → faq:territory\n` +
        `"Tell me about your website or the website that is customized with my expecations" → faq:website\n`;

    const prompt = lang === 'fr'
        ? `Tu es un assistant virtuel spécialisé en immobilier résidentiel et commercial au Québec.
L'utilisateur peut envoyer soit une question, soit une affirmation.\n\n${faqExamples}\n
Voici le message de l'utilisateur :\n"${message}"\n\n
Catégories disponibles :
- faq:<catégorie>
- estimate
- gpt (question immobilière hors FAQ)
- declaration (affirmation liée à l'immobilier)
- other (hors immobilier)\n\n
Règles :
1. Si le message correspond clairement à une FAQ, réponds par : faq:<catégorie>
2. Si c'est une question de prix, d'estimation → estimate
3. Si c'est une question immobilière mais pas dans la FAQ → gpt
4. Si c'est une affirmation (ex: "je veux acheter un condo") → declaration
5. S'il n'y a rien qui fait référence à de l'immobilier → other

Réponds uniquement par un mot : faq:<catégorie>, gpt, declaration ou other.`
        : `You are a virtual assistant specialized in residential and commercial real estate in Quebec.
The user may send either a question or a statement.\n\n${faqExamples}\n
Here is the user's message:\n"${message}"\n\n
Available categories:
- faq:<category>
- estimate
- gpt (real estate question not in FAQ)
- declaration (real estate statement)
- other (unrelated)\n\n
Rules:
1. If the message clearly matches one of our predefined FAQ topics → faq:<category>
2. if it is about a price or an estimate → estimate
3. If it is a real estate question but not in the FAQ → gpt
4. If it is a statement related to real estate (ex: "I want to buy a condo") → declaration
5. If nothing ties with real estate → other.\n
Respond with a single word: faq:<category>, estimate, gpt, declaration, or other.`;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 20,
            temperature: 0
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });

        const raw = response.data.choices?.[0]?.message?.content?.trim();
        const result = raw?.toLowerCase();
        console.log(`[classifyIntent] 🔎 Réponse brute GPT = "${raw}"`);
        console.log(`[FAQ CLASSIFIER] Message : "${message}" → Résultat GPT : ${result}`);
        return result || 'other';

    } catch (err) {
        console.error(`[FAQ CLASSIFIER] *** ERREUR GPT : ${err.message}`);
        return 'other';
    }
}

async function chatOnly(senderId, message, session) {
    if (!session.language) {
        if (message && isNaN(message)) { // exclure numériques simples
            session.language = detectLanguageFromText(message) || "fr";
          
        } else {
            session.language = "fr"; // fallback dur
        }
    }

    const lang = session.language || "fr";
    const contextualMessage = buildContextualPrompt(senderId, message, session, lang);
    const classification = await classifyIntent(message, lang);
    console.log(`[chatOnly] classification = ${classification}`);

    // Cas 1 : FAQ → PAS de quota
    if (classification?.startsWith("faq:")) {
        const key = classification.split(":")[1];
        const faqText = faqMapByKey[key]?.[lang];
        if (faqText) {
            console.log(`[CHAT] FAQ détectée → ${key}`);
            await sendMessage(senderId, faqText, session);
            return;
        }
    }

    // 🚨 Vérification quota obligatoire pour tout le reste
    const ok = await checkQuota(senderId, session);
    if (!ok) return;

    // Cas 2 : ESTIMATE
    if (classification === "estimate") {
        console.log(`[YYYYYY CHATONLY INTENT: "${classification}" `)
        await handlePriceEstimate(senderId, message, session);
        return;
    }

    // Cas 3 : GPT (questions hors FAQ mais immo)
    if (classification === "gpt") {

        const prompt = lang === "fr"
            ? `Vous êtes un assistant virtuel spécialisé en immobilier résidentiel et commercial au Québec. ` +
            `Vous parlez au nom du courtier Christophe Marcellin. ` +
            `Votre rôle est de répondre précisément et de façon concise à toute question liée à l’immobilier. ` +
            `Donnez une réponse directe, sans salutation, sans reformulation, sans détour. ` +
            `Vous pouvez donner des avis professionnels, juridiques ou stratégiques selon les cas. ` +
            `N’utilisez jamais de formules comme “je suis là pour vous aider” ou “posez-moi vos questions”. ` +
            `Ne demandez jamais les coordonnées. ` +
            `L’historique suivant est fourni uniquement comme contexte: ${contextualMessage}. ` +
            `Voici le dernier message de l’utilisateur, que vous devez traiter en priorité: ${message}`
            : `You are a virtual assistant specialized in residential and commercial real estate in Quebec. ` +
            `You speak on behalf of Christophe Marcellin Broker. ` +
            `Your job is to immediately, precisely and concisely answer any real estate-related question. ` +
            `Give a direct and informative answer — no greetings, no restating the question. ` +
            `You are allowed to give professional, legal, or strategic advice. ` +
            `Never use phrases like "I'm here to help" or "feel free to ask." Never ask for contact details. ` +
            `The following history is provided only as background: ${contextualMessage}. ` +
            `Here is the user's most recent message, which you must address as the priority: ${message}`;

        console.log(`[YYYYYY CHATONLY INTENT: "${classification}"`);
        console.log(`[YYYYYY CHATONLY PROMPT: "${prompt}"`);
        return await askGptAndSend(senderId, session, prompt, lang);
    }

    // Cas 4 : Declaration (affirmations)
    if (classification === "declaration") {
        const contextualMessage = buildContextualPrompt(senderId, message, session, lang);
        const prompt = lang === "fr"
            ? `L'utilisateur vous a précédemment partagé ce contexte: ${contextualMessage}. ` +
            `Voici son dernier message, que vous devez traiter en priorité: "${message}". ` +
            `Engagez le dialogue au nom du courtier Christophe Marcellin. ` +
            `Ne posez pas de questions dont la réponse est déjà présente dans le message ou dans le contexte. ` +
            `Vous pouvez donner des avis professionnels, juridiques ou stratégiques selon la nature du message. ` +
            `N’utilisez jamais de formules vides comme “je suis là pour vous aider” ou “posez-moi vos questions”. ` +
            `Vous pouvez poser des questions pour préciser le besoin de l'utilisateur mais ne demandez jamais de coordonnées.`
            : `The user has previously shared this context: ${contextualMessage}. ` +
            `Here is the most recent message, which you must address as the priority: "${message}". ` +
            `Engage in dialogue on behalf of broker Christophe Marcellin. ` +
            `Do not ask questions whose answers are already contained in the message or the context. ` +
            `You may provide professional, legal, or strategic advice depending on the nature of the message. ` +
            `Never use empty phrases such as “I am here to help” or “feel free to ask your questions.” ` +
            `You may ask questions to clarify the user's needs, but never request contact details.`;


        console.log(`[YYYYYY CHATONLY INTENT: "${classification}"`);
        console.log(`[YYYYYY CHATONLY PROMPT: "${prompt}"`);
        return await askGptAndSend(senderId, session, prompt, lang);
    }


    // Cas 5 : Other (hors sujet)
    if (classification === "other") {
        const prompt = lang === "fr"
            ? `Le message de l'utilisateur semble hors sujet par rapport à l'immobilier: "${message}". 
Répondez poliment mais ramenez la conversation vers l'immobilier ou nos services.`
            : `The user's message seems unrelated to real estate: "${message}". 
Respond politely but redirect the conversation back to real estate or our services.`;
        console.log(`[YYYYYY CHATONLY INTENT: "${classification}" `)
        console.log(`[YYYYYY CHATONLY INTENT: "${prompt}" `)
        return await askGptAndSend(senderId, session, prompt, lang);
    }
}

// Fonction utilitaire réutilisée pour GPT/Declaration/Other
async function askGptAndSend(senderId, session, prompt, lang) {
    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200,
            temperature: 0.6
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });

        const gptReply = response.data.choices?.[0]?.message?.content?.trim();
        const fallback = gptReply || (lang === "fr" ? "Je comprends 👍" : "I understand 👍");
        await sendMessage(senderId, fallback, session);

    } catch (err) {
        console.error(`[chatOnly] ERREUR GPT: ${err.message}`);
        const fallback = lang === "fr"
            ? "Désolé, je n’ai pas compris."
            : "Sorry, I didn’t understand.";
        await sendMessage(senderId, fallback, session);
    }
}


async function handlePriceEstimate(senderId, message, session) {
    //const session = context.session;
    const lang = session?.lang || "fr";

    console.log("🔍 [PIPELINE] Demande d'estimation détectée");

    // 1) GPT LIGHT → extraire code postal
    const lightPrompt = lang === "fr"
        ? `Retourne uniquement le code postal canadien (6 caractères) correspondant à l'adresse ou au quartier mentionné dans ce texte: "${message}". 
          Si aucun code postal n'est trouvé, retourne uniquement "NONE". Ne donne aucune explication.`
        : `Return only the Canadian postal code (6 characters) corresponding to the address or neighborhood mentioned in this text: "${message}". 
          If no postal code is found, return only "NONE". Do not provide any explanation.`;

    console.log("[GPT LIGHT] Prompt:", lightPrompt);
    let codePostal = "NONE";
    try {
        const gptLightResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o',
            messages: [{ role: 'user', content: lightPrompt }],
            max_tokens: 20,
            temperature: 0
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
        codePostal = gptLightResponse.data.choices?.[0]?.message?.content?.trim().toUpperCase() || "NONE";
    } catch (err) {
        console.error(`[handlePriceEstimate] *** ERREUR GPT LIGHT : ${err.message}`);
    }

    console.log("📬 Code postal extrait :", codePostal);

    // 2) Si code postal → appel evalPrix
    if (codePostal !== "NONE") {
        console.log("→ Passage en mode JAVA (appel evalPrix réel)");
        const { valeur, precision } = evalPrix(codePostal);

        if (valeur > 0) {
            // On a trouvé des stats valides
            const reply = buildEstimateMessage(valeur, precision, lang);
            await sendMessage(senderId, reply, session);
            return;
        }

        console.log("[INFO] Aucune donnée trouvée dans la BD pour ce code postal → fallback GPT Heavy");
        // On continue vers GPT Heavy (pas de return ici)
    }

    // 3) GPT HEAVY → estimation qualitative
    const heavyPrompt = lang === "fr"
        ? `Vous êtes un assistant virtuel spécialisé en immobilier résidentiel et commercial au Québec. 
          L'utilisateur souhaite obtenir une estimation de prix. 
          Calculez la valeur médiane haute la plus récente (si la statistique la plus récente date de 2023, ajoutez 4% par année manquante, soit 8%). 
          Donnez le résultat de ce calcul. Précisez que la valeur est estimative et que peu de statistiques ont été compilées pour ce territoire, qu’une validation est requise avec un professionnel de l'immobilier de notre équipe. 
          Donnez un ou deux exemples de variations qui peuvent influer sur l'estimation, 
          Ne jamais expliquer comment vous êtes arrivé à votre estimé ne jamais référe à la médiane haute. 
          N’utilisez jamais de formule comme “je suis là pour vous aider” ou “posez-moi vos questions”. 
          Question: ${message}`
        : 
        `You are a virtual assistant specialized in residential and commercial real estate in Quebec. 
        The user wants to obtain a price estimate. 
        Calculate the most recent high median value (if the most recent statistic is from 2023, add 4% per missing year, i.e., 8%). 
        Return the result of the calculation and specify that the value is only an estimate and that few statistics have been gathered for this territory, so validation with a professional from our team is required. 
        Give one or two examples of variations that may influence the estimate. 
        Never explain how you arrived at your estimate never mention the terms 'high median'. 
        Never use phrases like “I’m here to help you” or “ask me your questions.” 
        Question:  ${message}`;

    console.log("[GPT HEAVY] Prompt:", heavyPrompt);
    try {
        const gptHeavyResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o',
            messages: [{ role: 'user', content: heavyPrompt }],
            max_tokens: 200,
            temperature: 0.6
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });

        const gptReply = gptHeavyResponse.data.choices?.[0]?.message?.content?.trim();
        const cleaned = gptReply ? stripGptSignature(gptReply) : null;
        const fallback = cleaned || (lang === "fr"
            ? "Désolé, je n’ai pas pu générer une estimation."
            : "Sorry, I couldn't generate an estimate.");

        const reply = `${fallback} ${lang === 'fr' ? '(qualité statistique : basse)' : '(statistical sample quality: low)'}`;
        await sendMessage(senderId, reply, session);

    } catch (err) {
        console.error(`[handlePriceEstimate] *** ERREUR GPT HEAVY : ${err.message}`);
        const fallback = lang === "fr"
            ? "Désolé, je n’ai pas pu générer une estimation."
            : "Sorry, I couldn't generate an estimate.";
        await sendMessage(senderId, `${fallback} ${lang === 'fr' ? '(qualité statistique : basse)' : '(statistical sample quality : low)'}`, session);
    }
}
async function checkQuota(senderId, session) {
    const max = await getMaxQuestions(senderId);
    const quota = parseInt(max, 10) || 0;

    session.questionCount = (session.questionCount || 0) + 1;
    console.log("[UTILS checkQuota]", senderId, session.questionCount, "/", max);

    if (session.questionCount > quota) {
        const lang = session.language || "fr";
        const limitMsg = (lang === "fr")
            ? `Nb de questions : ${session.questionCount}, Quota : ${quota}.  
J'aimerais pouvoir vous fournir davantage d'informations et j'espère vous avoir été utile jusqu'ici. Toutefois, pour des raisons techniques ou parce que les conditions d'utilisation l'imposent, il m'est impossible de répondre à des questions autres que celles portant sur notre service.  
👉 Vous pouvez communiquer avec Christophe Marcellin au 514-231-6370 pour de plus amples renseignements.`
            : `Number of questions: ${session.questionCount}, Quota: ${quota}.  
I would like to be able to provide you with more information and I hope I have been helpful so far. However, for technical reasons or due to terms of use, I am unable to answer questions other than those related to our service.  
👉 You may contact Christophe Marcellin at 514-231-6370 for further information.`;

        await sendMessage(senderId, limitMsg);
        return false; // 🚫 stop: quota dépassé
    }

    return true; // ✅ quota OK
}

// === Fonction utilitaire pour mapper la précision ===
function getPrecisionLabel(level, lang = 'fr') {
    if (lang === 'fr') {
        switch (level) {
            case 3: return "élevé";
            case 2: return "moyen";
            case 1: return "bas";
            default: return "inconnu";
        }
    } else {
        switch (level) {
            case 3: return "high";
            case 2: return "fair";
            case 1: return "low";
            default: return "unknown";
        }
    }
}

// === Construction du message complet ===
function buildEstimateMessage(valeur, precision, lang = 'fr') {
    if (valeur === 0) {
        return lang === 'fr'
            ? "Désolé, je n’ai pu trouver de statistiques pertinentes pour le lieu désigné."
            : "Sorry, I couldn’t find any relevant statistics for the specified location.";
    }

    const confiance = getPrecisionLabel(precision, lang);
    if (lang === 'fr') {
        return (
            `D’après nos données, la valeur estimative pour l'endroit ciblé est de ${valeur} $ le pied carré, ` +
            `ce qui signifie environ ${(valeur * 1000).toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} $ pour 1000 pieds carrés. ` +
            `(qualité de l'échantillonage statistique : ${confiance}). ` +
            `Évidemment, plusieurs critères peuvent influer sur l'exactitude de l'estimé, ` +
            `comme le positionnement de la propriété ou les rénovations faites. ` +
            `Vous devriez toujours vous fier à un professionnel de l'immobilier pour fournir un estimé fiable.`
        );
    } else {
        return (
            `Based on our data, the estimated value for the targeted location is ${valeur} $ per square foot, ` +
            `which means approximately ${(valeur * 1000).toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} $ for 1000 square feet. ` +
            `(statistical sample quality: ${confiance}). ` +
            `Obviously, several factors can influence the accuracy of this estimate, ` +
            `such as the property's positioning or renovations made. ` +
            `You should always rely on a real estate professional to provide a reliable estimate.`
        );
    }
}

//gpt classifies project
async function gptClassifyProject(message, language = "fr") {
    const prompt = language === "fr"
        ? `Tu es un assistant immobilier. L'utilisateur a dit : "${message}". Classe cette réponse dans l'une de ces catégories :
0 → refus explicite
1 → acheter
2 → vendre
3 → louer
4 → autre (ex: question générale sur l'immobilier)
5 → incompréhensible ou message sans intention (ex: "bonjour")
Réponds uniquement par un chiffre.`
        : `You are a real estate assistant. The user said: "${message}". Classify the intent into one of the following:
0 → explicit refusal
1 → buy
2 → sell
3 → rent
4 → other (e.g. general real estate question)
5 → unclear or no intent (e.g. "hi")
Reply with a single number only.`;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 10,
            temperature: 0
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });

        const raw = response.data.choices?.[0]?.message?.content?.trim();
        const classification = raw?.match(/^[0-5]/)?.[0] || "5"; // Sécurité si retour non numérique
        const output = classification;

        console.log(`[gptClassifyProject] GPT = "${classification}" → retour final: "${output}"`);
        return output;

    } catch (err) {
        console.warn(`[gptClassifyProject] GPT ERROR: ${err.message}`);
        return "?";
    }
}


function isText(input) {
    if (typeof input !== 'string') return false;

    const trimmed = input.trim();

    // Empty or purely numeric (e.g., "123", " 456 ")
    if (/^\d+$/.test(trimmed)) return false;

    // Contains any letter (even accented), assume it's text
    return /[a-zA-Zàâçéèêëîïôûùüÿœæ]/i.test(trimmed);
}

function isNumeric(input) {
    if (typeof input === 'number') return true;
    if (typeof input !== 'string') return false;
    const trimmed = input.trim();
    return trimmed !== '' && !isNaN(trimmed);
}
//original detectLanguage
//function detectLanguageFromText(text) {


//    if (typeof text !== "string" || text.trim() === "") {

//        console.log(`[LANG DETECT] Texte ${text} fr désigné`);
//        return 'fr';
//    }
//    const isFrench =
//        /[àâçéèêëîïôûùüÿœæ]/i.test(text) ||
//        /\b(le|la|est|une|bonjour|je|j’|ça|tu|vous|avec|maison|acheter|vendre|salut|allo|propriété)\b/i.test(text);

//    const detected = isFrench ? 'fr' : 'en';
//    console.log(`[LANG DETECT] Langue détectée pour ${text}: ${detected}`);

//    return detected;
//}
function detectLanguageFromText(text) {
    if (typeof text !== "string" || text.trim() === "") {
        console.log(`[LANG DETECT] Texte vide ou invalide: forcé à 'fr'`);
        return "fr";
    }

    const sample = text.toLowerCase();

    // ✅ Détection français
    const frenchRegex =
        /[àâçéèêëîïôûùüÿœæ]/i.test(sample) ||
        /\b(le|la|est|une|bonjour|salut|allo|propriété|acheter|vendre|maison|ça|vous|tu|j’|je)\b/i.test(sample);

    // ✅ Détection anglais
    const englishRegex =
        /\b(the|house|hello|hi|property|buy|sell|good|morning|evening|you|your)\b/i.test(sample);

    let detected = "fr"; // valeur par défaut
    if (frenchRegex && !englishRegex) {
        detected = "fr";
    } else if (englishRegex && !frenchRegex) {
        detected = "en";
    } else if (englishRegex && frenchRegex) {
        // ⚖️ Cas mixte : on choisit selon la majorité des mots
        const frMatches = sample.match(/\b(le|la|est|une|bonjour|salut|allo|propriété|acheter|vendre|maison|ça|vous|tu|j’|je)\b/gi) || [];
        const enMatches = sample.match(/\b(the|house|hello|hi|property|buy|sell|good|morning|evening|you|your)\b/gi) || [];
        detected = frMatches.length >= enMatches.length ? "fr" : "en";
    }

    console.log(`[LANG DETECT] Langue détectée pour "${text}": ${detected}`);
    return detected;
}


function traceCaller(label) {
    const stack = new Error().stack;
    const line = stack.split('\n')[3] || 'inconnu';
   // console.log(`[UTILS traceCaller] ${label} ← ${line.trim()}`);
 }

function getNextSpec(session) {
    const { projectType, specValues = {}, askedSpecs = {} } = session;
    const propertyUsage = specValues.propertyUsage;


    // Bloc 0 : pas de specs spécifiques quand projectType = E
    if (projectType === 'E') {
        // on saute direct au bloc génériques
        const genericBlock = questions.generic;
        if (genericBlock && typeof genericBlock === 'object') {
            for (const field of Object.keys(genericBlock)) {
                if (field === "expectations") continue;
                if (specValues[field] === '?' || specValues[field] === undefined || specValues[field] === null) {
                    return field;
                }
            }
        }
        return null; // tout est rempli
    }

    // Bloc 1 : spec manquantes de base
    if (projectType === '?') return 'projectType';

    // Bloc 1b : propertyUsage juste après projectType
    if (!propertyUsage || propertyUsage === '?') return 'propertyUsage';

    // Bloc 2 : specs spécifiques
    const typeBlock = questions[projectType];
    if (!typeBlock || typeof typeBlock !== 'object') {
        return 'none';
    }
    const skipIfIncome = ['bedrooms', 'bathrooms', 'garage', 'parking'];
    for (const field of Object.keys(typeBlock)) {
        if (propertyUsage === 'income' && skipIfIncome.includes(field)) continue;
        if (specValues[field] === '?' || specValues[field] === undefined || specValues[field] === null) {
            return field;
        }
    }

    // Bloc 3 : specs génériques
    const genericBlock = questions.generic;
    if (!genericBlock || typeof genericBlock !== 'object') {
        console.warn(`[getNextSpec] ❌ Bloc générique introuvable`);
    } else {
        console.log(`[getNextSpec] ✅ Champs génériques =`, Object.keys(genericBlock));
        for (const field of Object.keys(genericBlock)) {

            // 🆕 Si projectType = E, on saute expectations et propertyUsage
            //if (projectType === 'E' && (field === 'expectations' || field === 'propertyUsage')) {
            //    console.log(`[getNextSpec] projectType = E → question générique "${field}" ignorée.`);
            //    continue;
            //}

            if (specValues[field] === '?' ||specValues[field] === undefined || specValues[field] === null) {
                return field;
            }
        }
    }

    // Bloc 4 : tout est rempli ou refusé → on vérifie que toutes les specs ont été posées
    const allFields = [
        ...Object.keys(typeBlock || {}),
        ...Object.keys(genericBlock || {})
    ];

    const done = allFields.every(field =>
        askedSpecs[field] === true &&
        specValues[field] !== null
    );

    if (done) {
        console.log('[getNextSpec] ✅ Toutes les specs ont été posées et ont une valeur définie (même "?" ou "E")');
        return null;
    }


    console.warn("[getNextSpec] ⚠️ Specs terminées mais certaines non posées → incohérence");
    for (const [k, v] of Object.entries(session.specValues)) {
        console.log(`  - ${k}: value="${v}", asked=${session.askedSpecs[k] === true}`);
    }

    return 'none';
}

function getCurrentSpec(session) {
    if (!session || typeof session.currentSpec !== "string") {
        return null;
    }
    return session.currentSpec;
}

function initializeSpecFields(session, projectType) {
   // traceCaller('initializeSpecFields');
    const fields = {
        B: ['price', 'bedrooms', 'bathrooms', 'garage', 'location'],
        S: ['price', 'bedrooms', 'bathrooms', 'garage', 'location'],
        R: ['price', 'bedrooms', 'bathrooms', 'parking', 'location'],
    };

    const list = fields[projectType] || [];

    session.specValues = {};
    session.askedSpecs = {};

    for (const field of list) {
        session.specValues[field] = '?';
        session.askedSpecs[field] = false;
    }

    // 🔒 Important : initialisation explicite de propertyUsage
    setSpecValue(session, "propertyUsage", "?", "initializeSpecFields");

    console.log(`[UTILS initialize] Champs de spec initialisés pour project Type ${projectType}: ${list.join(', ')}`);
}

function setProjectType(session, interpreted, caller = 'unknown') {
    //traceCaller('setProjectType');

    const old = session.projectType;

    // 🚫 Règle fusionnée : aucune modification si écrasement par "?" ou si redondant
    if (["B", "S", "R", "E"].includes(old)) {
        if (interpreted === "?") {
            console.warn(`[xxxxUTILS setProjectType] Caller = "${caller}" Tentative d'écrasement de projectType "${old}" par "?" — bloqué`);
            return;
        }
        if (old === interpreted) {
           // console.log(`[UTILS setProjectType] Caller = "${caller}", projectType déjà égal à "${value}" — aucune modification`);
            return;
        }
    }

    // ✅ Initialisation minimale si structures manquantes
    if (!session.specValues) session.specValues = {};
    if (!session.askedSpecs) session.askedSpecs = {};

    // ✅ Mise à jour
    //console.log(`[UTILS setProjectType] Caller ="${caller}",  la valeur qui sera affectée à session.projectType = "${value}"`);
    session.projectType = interpreted;

    // ✅ Initialisation des specs uniquement si changement de ? → B/S/R
    if ((old === undefined || old === "?") && ["B", "S", "R"].includes(interpreted)) {

        initializeSpecFields(session, interpreted);
    }
 //   console.log(`[UTILS setProjectType] ... specs: _${JSON.stringify(session.specValues)}_`);
}

function setSpecValue(session, key, value, caller = "unspecified") {
    console.log(`[xxxxx Utils setSpecValue] key="${key}" | value="${value}" | caller="${caller}"`);
    if (!session.specValues) session.specValues = {};

    const all = Object.entries(session.specValues)
        .map(([k, val]) => `${k}="${val}"`)
        .join(" | ");

    const old = session.specValues[key];

    // 🚫 Ne pas écraser une vraie valeur par "?" (ex: 3 → ?)
    if (old && old !== "?" && old !== "E" && value === "?") {
        console.warn(`[xxxxxUTILS] Tentative d'écrasement de "${key}"="${old}" par "?" — bloqué, caller ="${caller}"`);
        return;
    }

    // 🚫 Éviter la réécriture identique
    if (old === value) {
        console.log(`[xxxxUTILS track] valeur de spec non enregistrée pcq même que valeur précédente "${key}"`);

        return;
    }


    // 🔁 Traitement spécial pour propertyUsage
    if (key === "propertyUsage") {
        if (value === "?") {
            session.propertyUsage = "?";
            session.specValues[key] = value;//maintenu à 2 endroits pcq chatGPT est un imbécile, synonyme de la ligne précédente
            console.log(`[xxxxutilsTRACK] propriété "propertyUsage" initialisée à "?" | caller ="${caller}"`);
            setAskedSpec(session, key, `[auto] setAskedSpec appelé depuis setSpecValue`);
            return;
        }

        if (!["0", "1", "2", "3", "4", "E"].includes(value)) {
            console.warn(`[utilsTRACK] Valeur invalide pour propertyUsage : "${value}" → ignorée , caller ="${caller}"`);
            return;
        }

        // 👉 On stocke la valeur brute (numérique ou E)
        session.propertyUsage = value;
        session.specValues[key] = value;//maintenu à 2 endroits pcq chatGPT est un imbécile, synonyme de la ligne précédente
        console.log(`[xxxxutilsTRACK] propertyUsage value after setSpecValue: "${session.propertyUsage}"`);
        setAskedSpec(session, key, `[auto] setAskedSpec appelé depuis setSpecValue`);
        return;
    }


    // ✅ Mise à jour standard
    session.specValues[key] = value;
    setAskedSpec(session, key, `[auto] setAskedSpec appelé depuis setSpecValue`);

    // 🔥 Cascade : appliquer getVoidedSpecs(), on met E à toutes les specs et asked = true pour toutes
    //les questions qui ne seront pas posées.
    const voidedSpecs = getVoidedSpecs(key, value);
    for (const s of voidedSpecs) {
        session.specValues[s] = "E";
        setAskedSpec(session, s, `[auto] forcé à E car ${key} = ${value}`);
    }

    const specs = Object.entries(session.specValues)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
    // console.trace(`[utilsTRACK] spec "${key}" modifiée → "${value}" | current state: projectType=${session.projectType} | specs: ${specs}`);
}

function getVoidedSpecs(spec, value = "E") {
    // Liste des specs à invalider si projectType est "E"
    const voidIfProjectTypeE = [
        "bedrooms",
        "bathrooms",
        "garage",
        "parking",
        "price",
        "location",
        "expectations",
        "propertyUsage"
    ];

    if (spec === "projectType" && value === "E") {
        return voidIfProjectTypeE;
    }

    // Par défaut : aucune spec à void
    return [];
}

function setAskedSpec(session, specKey, source = "manual") {
    if (!session.askedSpecs) {
        session.askedSpecs = {};
      // console.warn(`[UTILS setAskedSpec] array askedSpecs manquant recréé par: ${source}`);
    }
    session.askedSpecs[specKey] = true;
 //   console.log(`[UTILS setAskedspec] for ["${specKey}"] = true | par: ${source}`);
}

module.exports = {
    getNextSpec,
    getCurrentSpec,
    initializeSpecFields,
    setProjectType,
    setSpecValue,
    setAskedSpec,
    gptClassifyProject,
    chatOnly,
    detectLanguageFromText,
    isText,
    isNumeric    
};
