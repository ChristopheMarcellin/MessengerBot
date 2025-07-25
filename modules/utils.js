// modules/utils.js
const axios = require('axios');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const { sendMessage } = require('./messenger');
const { questions } = require('./questions');



console.log("🧩 [utils.js] **************************** Chargé — typeof isNumeric =", typeof isNumeric);

function stripGptSignature(text) {
    return text
        .replace(/\[.*?\]/g, '')        // Supprime les blocs comme [Votre Nom], [Coordonnées], etc.
        .replace(/\n{2,}/g, '\n')       // Réduit les doubles sauts de ligne
        .trim();
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
        fr: "Nous pouvons vous aider à estimer votre bien sur une base de comparables. La consultation est gratuite, et inclut l'estimation de votre bien.  Vous pouvez même me demander une approximation tout de suite pour votre adresse cible.  Toutefois, seuls Caroles ou Christophe peuvent vous fournir un estimé fiable: la qualité des comparables, la condition de votre propriété, son emplacement, les rénovations faites sont autant de facteurs à considérer auxquels CasaNova ne peut répondre.",
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
    }
};

async function classifyIntent(message, lang = 'fr') {
    const categories = [
        'hours', 'contact', 'consultation', 'rental',
        'commercial', 'territory', 'carole', 'christophe', 'team'
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
        `"Combien vaut ma maison à Brossard ?" → gpt\n` +
        `"Quel est le prix du pied carré dans Griffintown ?" → gpt\n` +
        `"À quel prix avez-vous vendu ce condo ?" → gpt\n` +
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
        `"How much is my home worth in Brossard?" → gpt\n` +
        `"What’s the price per square foot in Griffintown?" → gpt\n` +
        `"What did this condo sell for?" → gpt\n` +
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
async function chatOnly(senderId, message, lang = "fr") {
    const intent = await classifyIntent(message, lang);
    console.log(`Intent: ${intent}`);

    // 🔎 Cas 1 : FAQ
    if (intent?.startsWith("faq:")) {
        const key = intent.split(":")[1];
        const faqText = faqMapByKey[key]?.[lang];
        if (faqText) {
            console.log(`[CHAT] Réponse FAQ détectée via GPT → cat: ${key}`);
            await sendMessage(senderId, faqText);
            return;
        }
    }

    // 🤖 Cas 2 : GPT (libre)
    if (intent === "gpt") {
        const prompt = lang === "fr"
            ? `Vous êtes un expert en immobilier résidentiel et commercial au Québec. ` +
            `Votre rôle est de répondre immédiatement, clairement et précisément à toute question liée à l’immobilier. ` +
            `Donnez une réponse directe, sans salutation, sans reformulation, sans détour. ` +
            `Vous pouvez donner des avis professionnels, juridiques ou stratégiques selon les cas. ` +
            `Si la question concerne une estimation de prix ou une valeur immobilière, donnez la valeur moyenne entre le haut et le bas de la fourchette approximative en date d'aujourd'hui et précisez que la valeur est estimative et qu’une validation est requise avec le courtier Christophe Marcellin car plusieurs facteurs comme la condition du bien peut influencer le prix.  Ne donner qu'une seule valeur, sans révéler qu'il s'agit d'une moyenne ou d'une fourchette.` +
            `N’utilisez jamais de formule comme “je suis là pour vous aider” ou “posez-moi vos questions”. ` +
            `Répondez simplement à la question suivante : "${message}"`
            : `You are an expert in residential and commercial real estate in Quebec. ` +
            `Your job is to immediately and clearly answer any question related to real estate. ` +
            `Give a direct, concise, and informative answer — no greetings, no restating the question. ` +
            `You are allowed to give professional, legal, or strategic advice. ` +
            `If the question relates to a price estimate or property value, provide the high end of the approximate range as of today, and specify that confirmation is required with broker Christophe Marcellin, as several factors such as the property's condition can influence the price.` +
            `Never use phrases like "I'm here to help" or "feel free to ask." ` +
            `Just answer the following question: "${message}"`;


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

            await sendMessage(senderId, fallback);
            return;

        } catch (err) {
            console.error(`[chatOnly] *** ERREUR GPT : ${err.message}`);
            const fallback = lang === "fr"
                ? "Désolé, je n’ai pas compris."
                : "Sorry, I didn’t understand.";
            await sendMessage(senderId, fallback);
            return;
        }
    }

    // 🙃 Cas 3 : autre
    const fallback = lang === "fr"
        ? "Désolé, je ne suis pas certain de comprendre votre question mes connaissances se limitent à l'immobilier, peut-être une reformulation m'aiderait à mieux vous répondre !"
        : "Sorry, I'm not sure I understand your question. My knowledge is limited to real estate, but perhaps rephrasing it could help me provide a better answer.";

    await sendMessage(senderId, fallback);
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

    // Bloc 0 : refus explicite
    if (projectType === 'E' || propertyUsage === 'E') return null;

    if (propertyUsage === '?' || propertyUsage === undefined) return 'propertyUsage';

    // Bloc 2 : specs spécifiques
    const typeBlock = questions[projectType];
    if (!typeBlock || typeof typeBlock !== 'object') {
        return 'none';
    }
 //   console.log(`[getNextSpec] ✅ Champs spécifiques pour ${projectType} =`, Object.keys(typeBlock));

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
            if (
                specValues[field] === '?' ||
                specValues[field] === undefined ||
                specValues[field] === null
            ) {
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

    console.warn('[getNextSpec] ⚠️ Specs terminées mais certaines non posées → incohérence');
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
    const all = Object.entries(session.specValues || {})
        .map(([key, val]) => `${key}="${val}"`)
        .join(" | ");
    console.log(`[setSpecValue] ALL SPECS: ${all || "aucune spec encore définie"}`);
    if (!session.specValues) session.specValues = {};

    const old = session.specValues[key];

    // 🚫 Ne pas écraser une vraie valeur par "?" (ex: 3 → ?)
    if (old && old !== "?" && old !== "E" && value === "?") {
        console.warn(`[UTILS] Tentative d'écrasement de "${key}"="${old}" par "?" — bloqué, caller ="${caller}"`);
        return;
    }

    // 🚫 Éviter la réécriture identique
    if (old === value) {
        //console.log(`[UTILS] spec "${key}" déjà égale à "${value}" — aucune ré-écriture, caller ="${caller}"`);
        return;
    }

    // 🔁 Traitement spécial pour propertyUsage
    if (key === "propertyUsage") {
        if (value === "?") {
            session.specValues[key] = "?";
            console.trace(`[utilsTRACK] propriété "propertyUsage" initialisée à "?" | caller ="${caller}"`);
            return;
        }

        if (value !== "1" && value !== "2" && value !== "E") {
            console.warn(`[UTILS] Valeur invalide pour propertyUsage : "${value}" → ignorée , caller ="${caller}"`);
            return; // ❌ Rejet immédiat
        }

        const usage = value === "1" ? "income"
            : value === "2" ? "personal"
                : "E";

        session.specValues[key] = usage;
   //     console.trace(`[utilsTRACK] propriété "propertyUsage" définie → "${usage}" | current state: projectType=${session.projectType}, caller ="${caller}"`);
        return;
    }

    // ✅ Mise à jour standard
    session.specValues[key] = value;

    // ✅ Ne pas faire de double log si déjà fait manuellement dans runDirector
    if (caller !== "runDirector/?→E after 2 invalid") {
        //    setAskedSpec(session, key, caller);
    }

    const specs = Object.entries(session.specValues)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');

   // console.trace(`[utilsTRACK] spec "${key}" modifiée → "${value}" | current state: projectType=${session.projectType} | specs: ${specs}`);
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
