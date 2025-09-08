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
const conversationHistory = {};

function buildContextualPrompt(senderId, currentMessage, lang = 'fr') {
    if (!conversationHistory[senderId]) conversationHistory[senderId] = [];
    conversationHistory[senderId].push(currentMessage);
    if (conversationHistory[senderId].length > 5) conversationHistory[senderId].shift(); // garde les 5 derniers
    const context = conversationHistory[senderId].slice(0, -1).join('\n');
    return (lang === 'fr'
        ? `Voici le contexte des questions précédentes:\n${context}\n\nVoici la nouvelle question:\n${currentMessage}\n\nRéponds en tenant compte du contexte.`
        : `Here is the context of previous questions:\n${context}\n\nHere is the new question:\n${currentMessage}\n\nAnswer considering the context.`);
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
    if (/carole/i.test(message)) return "faq:carole";
    if (/christophe|marcellin/i.test(message)) return "faq:christophe";
    const categories = [
        'hours', 'contact', 'consultation', 'rental',
        'commercial', 'territory', 'carole', 'christophe', 'team', 'homestaging', 'website'
    ];
    const examples = lang === 'fr'
        ? `Exemples :\n` +
        `"Quand êtes-vous ouverts ?" → faq:hours\n` +
        `"Quelles sont vos heures d'affaires ?" → faq:hours\n` +
        `"Comment procédez-vous pour faire l'estimation d'une propriété" → faq:consultation\n` +
        `"Est-ce que vous aidez pour la location ?" → faq:rental\n` +
        `"Puis-je vous appeler directement ?" → faq:contact\n` +
        `"Où est situé votre bureau ?" → faq:contact\n` +
        `"Qui est carole baillargeon, quelle est son expérience ?" → faq:carole \n` +
	    `"Qui est christophe marcellin, quelle est son expérience ?" → faq:christophe\n` +
	    `"Que pouvez-vous me dire de votre équipe ?" → faq:team \n` +
	    `"Faites vous de la location ou du locatif ?" → faq:rental \n` +
        `"Faites-vous des propriétés commerciales ?" → faq:commercial\n` +
	    `"Quelle est votre adresse, où sont situés vos bureaux ?" → faq:office\n` +
        `"Travaillez-vous sur la Rive-Sud ou à Montréal ?" → faq:territory\n` +
        `"Faites-vous de la valorisation immobilière ou du home staging ?" → faq:homestaging\n` +
        `"Parlez moi de votre site web ou du siteweb personnalisé" → faq:website\n` +
        `"Quels documents faut-il fournir pour vendre une propriété ?" → gpt\n` +
        `"Combien coûte vendre une maison avec un courtier ?" → gpt\n` +
        `"Est-ce que les offres multiples sont encore fréquentes ?" → gpt\n` +
        `"Quels sont les frais à prévoir à l’achat d’un condo ?" → gpt\n` +
        `"Puis-je transformer un duplex en unifamiliale ?" → gpt\n` +
        `"Quel est le meilleur moment pour vendre une propriété au Québec ?" → gpt\n` +
        `"Est-ce qu’une copropriété indivise peut être financée ?" → gpt\n` +
        `"Est-ce que les taxes municipales sont plus élevées en banlieue ?" → gpt\n` +
        `"Comment savoir si un logement est légalement louable ?" → gpt\n` +
        `"Comment savoir si une propriété est zonée résidentielle ou commerciale ?" → gpt\n` +
        `"Dois-je déclarer une infiltration d’eau lors de la vente ?" → gpt\n` +
        `"Est-ce obligatoire d’avoir un certificat de localisation à jour ?" → gpt\n` +
        `"Puis-je vendre sans passer par un notaire ?" → gpt\n` +
        `"Combien de temps dure une promesse d’achat ?" → gpt\n` +
        `"Quel est le rôle de chaque professionnel de l'immobilier?" → gpt\n` +
        `"Vaut-il mieux vendre avant d’acheter ?" → gpt\n` +
        `"Est-ce risqué de vendre sans courtier ?" → gpt\n` +
        `"Est-ce que Proprio Direct est mieux qu’un courtier ?" → gpt\n` +
        `"Faut-il toujours faire une inspection ou quand dois-je faire une inspection?" → gpt\n` +
        `"Combien vaut ma maison à Brossard ?" → estimate\n` +
        `"Quel est le prix du pied carré dans Griffintown ?" → estimate\n` +
        `"Quel est le marché actuel à Saint-Lambert ?" → gpt\n` +
        `"Peux-tu me recommander un bon restaurant ?" → other\n`
        : `Examples:\n` +
        `"What are your business hours?" → faq:hours\n` +
        `"How does an evaluation work?" → faq:consultation\n` +
        `"Do you handle rentals?" → faq:rental\n` +
        `"How do you proceed to estimate a property?" → faq:consultation\n` +
        `"Can I call you directly?" → faq:contact\n` +
        `"Where is your office located?" → faq:contact\n` +
        `"Who is Carole Baillargeon, what is her experience?" → faq:carole\n` +
        `"Who is Christophe Marcellin, what is his experience?" → faq:christophe\n` +
        `"What can you tell me about your team?" → faq:team\n` +
        `"Do you work with commercial properties?" → faq:commercial\n` +
        `"What is your address, where are your offices located?" → faq:office\n` +
        `"Do you work on the South Shore and or in Montreal?" → faq:territory\n` +
        `"Do you handle commercial properties?" → faq:commercial\n` +
        `"Tell me about your website or the website that is customized with my expecations" → faq:website\n` 
        `"What documents are required to sell a property?" → gpt\n` +
        `"How much does it cost to sell a home with a broker?" → gpt\n` +
        `"Are multiple offers still common?" → gpt\n` +
        `"What fees should I expect when buying a condo?" → gpt\n` +
        `"Can I convert a duplex into a single-family home?" → gpt\n` +
        `"When is the best time to sell a property in Quebec?" → gpt\n` +
        `"Can an undivided co-ownership be financed?" → gpt\n` +
        `"Are municipal taxes higher in the suburbs?" → gpt\n` +
        `"How can I tell if a rental unit is legal?" → gpt\n` +
        `"How can I check if a property is zoned residential or commercial?" → gpt\n` +
        `"Do I have to disclose a water infiltration?" → gpt\n` +
        `"Is a recent certificate of location mandatory?" → gpt\n` +
        `"Can I sell without a notary?" → gpt\n` +
        `"How long is a purchase offer valid?" → gpt\n` +
        `"What is the role of real estate professionals?" → gpt\n` +
        `"Is it better to sell before buying?" → gpt\n` +
        `"Is it risky to sell without an agent?" → gpt\n` +
        `"Is Proprio Direct better than a broker?" → gpt\n` +
        `"Should I always do an inspection or when should I do an inspection?" → gpt\n` +
        `"How much is my home worth in Brossard?" → estimate\n` +
        `"What’s the price per square foot in Griffintown?" → estimate\n` +
        `"What’s the market like in Saint-Lambert?" → gpt\n` +
        `"Can you recommend a good restaurant?" → other\n`;


    const prompt = lang === 'fr'
        ? `Tu es un assistant virtuel spécialisé en immobilier résidentiel et commercial au Québec. ` +
        `L'utilisateur te pose une question.\n\n` +
        `${examples}\n` +
        `Voici la question de l'utilisateur :\n"${message}"\n\n` +
        `Voici les catégories disponibles :\n- faq:<catégorie>\n- gpt\n- other\n\n` +
        `Si la question correspond clairement à une catégorie de notre FAQ, réponds par : faq:<catégorie>.\n` +
        `Si elle concerne l'immobilier (juridique, estimation, stratégie, inspection, etc.) mais ne figure pas dans la FAQ, réponds par : gpt.\n` +
        `Si la question ne concerne pas l'immobilier ni nos services, réponds par : other.\n\n` +
        `Réponds uniquement par un mot : faq:<catégorie>, gpt ou other.`
        : `You are a virtual assistant specialized in residential and commercial real estate in Quebec. ` +
        `The user is asking you a question.\n\n` +
        `${examples}\n` +
        `Here is the user's question:\n"${message}"\n\n` +
        `Available categories are:\n- faq:<category>\n- gpt\n- other\n\n` +
        `If the question clearly matches one of our predefined FAQ topics, reply with: faq:<category>.\n` +
        `If it concerns real estate (legal, strategy, inspection, value, etc.) but is not covered by the FAQ, reply with: gpt.\n` +
        `If the question is unrelated to real estate or our services, reply with: other.\n\n` +
        `Respond with a single word: faq:<category>, gpt, or other.`;



    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 50,
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

        console.log(`[FAQ CLASSIFIER] Question : "${message}" → Résultat GPT : ${result}`);
        return result || 'other';

    } catch (err) {
        console.error(`[FAQ CLASSIFIER] *** ERREUR GPT : ${err.message}`);
        return 'other';
    }
}


async function chatOnly(senderId, message, session) {
    if (!session.language) {
        if (message && isNaN(message)) { // exclure numériques simples
            session.language = detectLanguageFromText(message) || "en";
        } else {
            session.language = "en"; // fallback dur
        }
    }

    const lang = session.language || 'fr';
    const intent = await classifyIntent(message, lang);
    console.log(`Intent: ${intent}`);

    // 🔎 Cas 1 : FAQ → PAS de quota
    if (intent?.startsWith("faq:")) {
        const key = intent.split(":")[1];
        const faqText = faqMapByKey[key]?.[lang];
        if (faqText) {
            console.log(`[CHAT] Réponse FAQ détectée via GPT → cat: ${key}`);
            await sendMessage(senderId, faqText, session);
            return;
        }
    }

    // 🚨 Étape 2 : quota check obligatoire pour tout le reste
    const ok = await checkQuota(senderId, session);
    if (!ok) return;

    // 🔎 Cas 2 : ESTIMATE
    if (intent === "estimate") {
        await handlePriceEstimate(senderId, message, session);
        return;
    }

    // 🤖 Cas 3 : GPT (libre) avec contexte
    if (intent === "gpt") {
        const contextualMessage = buildContextualPrompt(senderId, message, lang);
        const prompt = lang === "fr"
            ? `Vous êtes un assistant virtuel spécialisé en immobilier résidentiel et commercial au Québec. ` +
            `Vous parlez au nom du courtier Christophe Marcellin. ` +
            `Votre rôle est de répondre immédiatement, précisément et de façon concise à toute question liée à l’immobilier. ` +
            `Donnez une réponse directe, sans salutation, sans reformulation, sans détour. ` +
            `Vous pouvez donner des avis professionnels, juridiques ou stratégiques selon les cas. ` +
            `N’utilisez jamais de formule comme “je suis là pour vous aider” ou “posez-moi vos questions”. ` +
            contextualMessage
            : `You are a virtual assistant specialized in residential and commercial real estate in Quebec. ` +
            `You speak on behalf of Christophe Marcellin Broker. ` +
            `Your job is to immediately, precisely and concisely answer any real estate-related question. ` +
            `Give a direct and informative answer — no greetings, no restating the question. ` +
            `You are allowed to give professional, legal, or strategic advice. ` +
            `Never use phrases like "I'm here to help" or "feel free to ask." ` +
            contextualMessage;

        console.log(`[GPT] Mode: chatOnly | Lang: ${lang} | Prompt → ${prompt}`);

        try {
            const chatGptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 200,
                temperature: 0.6
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                }
            });

            const gptReply = chatGptResponse.data.choices?.[0]?.message?.content?.trim();
            const cleaned = gptReply ? stripGptSignature(gptReply) : null;
            const fallback = cleaned || (lang === "fr"
                ? "Désolé, je n’ai pas compris votre réponse en fonction de la question posée !"
                : "Sorry, I didn’t understand your answer in relation to the question asked!");

            await sendMessage(senderId, fallback, session);
            return;

        } catch (err) {
            console.error(`[chatOnly] *** ERREUR GPT : ${err.message}`);
            const fallback = lang === "fr"
                ? "Désolé, je n’ai pas compris."
                : "Sorry, I didn’t understand.";
            await sendMessage(senderId, fallback, session);
            return;
        }
    }

    // 🙃 Cas 4 : autre (compte dans le quota)
    const fallback = lang === "fr"
        ? "Désolé, cette question ne semble pas porter sur l'immobilier, peut-être une reformulation m'aiderait à mieux vous répondre !"
        : "Sorry, this question seems unrelated to real estate, but perhaps rephrasing it could help me provide a better answer.";

    await sendMessage(senderId, fallback, session);
}

async function chatOnlyOriginal(senderId, message, session) {
    // const session = context.session;

    if (!session.language) {
        if (message && isNaN(message)) { // exclure numériques simples
            session.language = detectLanguageFromText(message) || "en";
        } else {
            session.language = "en"; // fallback dur
        }
    }

    const lang = session.language || 'fr';
    const intent = await classifyIntent(message, lang);
    console.log(`Intent: ${intent}`);

    // 🔎 Cas 1 : FAQ
    if (intent?.startsWith("faq:")) {
        const key = intent.split(":")[1];
        const faqText = faqMapByKey[key]?.[lang];
        if (faqText) {
            console.log(`[CHAT] Réponse FAQ détectée via GPT → cat: ${key}`);
            await sendMessage(senderId, faqText, session);
            return;
        }
    }

    if (intent === "estimate") {
        const ok = await checkQuota(senderId, session);
        if (!ok) return; // quota atteint → stop
        await handlePriceEstimate(senderId, message, session); // ← passe maintenant context complet
        return;
    }

    // 🤖 Cas 2 : GPT (libre) avec contexte
    if (intent === "gpt") {
        const ok = await checkQuota(senderId, session);
        if (!ok) return; // quota atteint → stop

        const contextualMessage = buildContextualPrompt(senderId, message, lang);
        const prompt = lang === "fr"
            ? `Vous êtes un assistant virtuel spécialisé en immobilier résidentiel et commercial au Québec. ` +
            `Vous parlez au nom des courtiers Carole Baillargeon et Christophe Marcellin. ` +
            `Votre rôle est de répondre immédiatement, précisément et de façon concise à toute question liée à l’immobilier. ` +
            `Donnez une réponse directe, sans salutation, sans reformulation, sans détour. ` +
            `Vous pouvez donner des avis professionnels, juridiques ou stratégiques selon les cas. ` +
            `N’utilisez jamais de formule comme “je suis là pour vous aider” ou “posez-moi vos questions”. ` +
            contextualMessage
            : `You are a virtual assistant specialized in residential and commercial real estate in Quebec. ` +
            `You speak on behalf of brokers Carole Baillargeon and Christophe Marcellin. ` +
            `Your job is to immediately, precisely and concisely answer any real estate-related question. ` +
            `Give a direct and informative answer — no greetings, no restating the question. ` +
            `You are allowed to give professional, legal, or strategic advice. ` +
            `Never use phrases like "I'm here to help" or "feel free to ask." ` +
            contextualMessage;

        console.log(`[GPT] Mode: chatOnly | Lang: ${lang} | Prompt → ${prompt}`);

        try {
            const chatGptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 200,
                temperature: 0.6
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                }
            });

            const gptReply = chatGptResponse.data.choices?.[0]?.message?.content?.trim();
            const cleaned = gptReply ? stripGptSignature(gptReply) : null;
            const fallback = cleaned || (lang === "fr"
                ? "Désolé, je n’ai pas compris votre réponse en fonction de la question posée !"
                : "Sorry, I didn’t understand your answer in relation to the question asked!");

            await sendMessage(senderId, fallback, session);
            return;

        } catch (err) {
            console.error(`[chatOnly] *** ERREUR GPT : ${err.message}`);
            const fallback = lang === "fr"
                ? "Désolé, je n’ai pas compris."
                : "Sorry, I didn’t understand.";
            await sendMessage(senderId, fallback, session);
            return;
        }
    }

    // 🙃 Cas 3 : autre
    const fallback = lang === "fr"
        ? "Désolé, cette question ne semble pas porter sur l'immobilier, peut-être une reformulation m'aiderait à mieux vous répondre !"
        : "Sorry, this question seems unrelated to real estate, but perhaps rephrasing it could help me provide a better answer.";

    await sendMessage(senderId, fallback, session);
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
    const quota = await getMaxQuestions(senderId);
    const max = parseInt(quota, 10) || 0;

    session.questionCount = (session.questionCount || 0) + 1;
    console.log("[UTILS checkQuota]", senderId, session.questionCount, "/", max);

    if (session.questionCount > max) {
        const lang = session.language || "fr";
        const limitMsg = (lang === "fr")
            ? "J'aimerais pouvoir vous fournir davantage d'informations et espère vous avoir été utile jusqu'ici, toutefois pour des raisons techniques ou avoir enfreint les conditions d'utilisation, il m'est impossible de répondre à des questions autres que celles qui portent sur notre service.  Vous pouvez communiquer avec Christophe Marcellin au 514-231-6370 pour de plus amples renseignements."
            : "I would like to be able to provide you with more information and I hope I have been helpful so far, however, for technical reasons or for having violated the terms of use, I am unable to answer questions other than those related to our service. You may contact Christophe Marcellin at 514-231-6370 for further information.";

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
        ? `Tu es un assistant immobilier. L'utilisateur a dit : "${message}". Classe cette réponse dans l'une de ces catégories :\n1 → acheter\n2 → vendre\n3 → louer\n4 → autre (ex: question générale sur l'immobilier)\n5 → incompréhensible ou message sans intention (ex: "bonjour")\nRéponds uniquement par un chiffre.`
        : `You are a real estate assistant. The user said: "${message}". Classify the intent into one of the following:\n1 → buy\n2 → sell\n3 → rent\n4 → other (e.g. general real estate question)\n5 → unclear or no intent (e.g. "hi")\nReply with a single number only.`;

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
        const classification = raw?.match(/^[1-5]/)?.[0] || "5"; // Sécurité si retour non numérique
        const output = classification; // On garde tel quel maintenant que 5 est prévu

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

function detectLanguageFromText(text) {


    if (typeof text !== "string" || text.trim() === "") {

        console.log(`[LANG DETECT] Texte ${text} fr désigné`);
        return 'fr';
    }
    const isFrench =
        /[àâçéèêëîïôûùüÿœæ]/i.test(text) ||
        /\b(le|la|est|une|bonjour|je|j’|ça|tu|vous|avec|maison|acheter|vendre|salut|allo|propriété)\b/i.test(text);

    const detected = isFrench ? 'fr' : 'en';
    console.log(`[LANG DETECT] Langue détectée pour ${text}: ${detected}`);

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
            if (projectType === 'E' && (field === 'expectations' || field === 'propertyUsage')) {
                console.log(`[getNextSpec] projectType = E → question générique "${field}" ignorée.`);
                continue;
            }

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

function setProjectType(session, value, caller = 'unknown') {
    //traceCaller('setProjectType');

    const old = session.projectType;

    // 🚫 Règle fusionnée : aucune modification si écrasement par "?" ou si redondant
    if (["B", "S", "R", "E"].includes(old)) {
        if (value === "?") {
            console.warn(`[UTILS setProjectType] Caller = "${caller}" Tentative d'écrasement de projectType "${old}" par "?" — bloqué`);
            return;
        }
        if (old === value) {
           // console.log(`[UTILS setProjectType] Caller = "${caller}", projectType déjà égal à "${value}" — aucune modification`);
            return;
        }
    }

    // ✅ Initialisation minimale si structures manquantes
    if (!session.specValues) session.specValues = {};
    if (!session.askedSpecs) session.askedSpecs = {};

    // ✅ Mise à jour
    //console.log(`[UTILS setProjectType] Caller ="${caller}",  la valeur qui sera affectée à session.projectType = "${value}"`);
    session.projectType = value;

    // ✅ Initialisation des specs uniquement si changement de ? → B/S/R
    if ((old === undefined || old === "?") && ["B", "S", "R"].includes(value)) {

        initializeSpecFields(session, value);
    }
 //   console.log(`[UTILS setProjectType] ... specs: _${JSON.stringify(session.specValues)}_`);
}

function setSpecValue(session, key, value, caller = "unspecified") {
    if (!session.specValues) session.specValues = {};

    const all = Object.entries(session.specValues)
        .map(([k, val]) => `${k}="${val}"`)
        .join(" | ");

    const old = session.specValues[key];

    // 🚫 Ne pas écraser une vraie valeur par "?" (ex: 3 → ?)
    if (old && old !== "?" && old !== "E" && value === "?") {
        console.warn(`[UTILS] Tentative d'écrasement de "${key}"="${old}" par "?" — bloqué, caller ="${caller}"`);
        return;
    }

    // 🚫 Éviter la réécriture identique
    if (old === value) {
        return;
    }

    // 🔁 Traitement spécial pour propertyUsage
    if (key === "propertyUsage") {
        if (value === "?") {
            session.specValues[key] = "?";
            console.trace(`[utilsTRACK] propriété "propertyUsage" initialisée à "?" | caller ="${caller}"`);
            setAskedSpec(session, key, `[auto] setAskedSpec appelé depuis setSpecValue`);
            return;
        }

        if (!["1", "2", "3", "4", "E"].includes(value)) {
            console.warn(`[UTILS] Valeur invalide pour propertyUsage : "${value}" → ignorée , caller ="${caller}"`);
            return;
        }

        let usage;
        switch (value) {
            case "1": usage = "Unifamiliale"; break;
            case "2": usage = "Condo"; break;
            case "3": usage = "Logement"; break;
            case "4": usage = "Multiplex"; break;
            case "E": usage = "E"; break;
        }

        session.specValues[key] = usage;
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
    console.log(`[UTILS setAskedspec] for ["${specKey}"] = true | par: ${source}`);
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
