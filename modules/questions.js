const questions = {

    B: {
        price: {
            en: `💰 Do you have a budget in mind ? 

For a rental, specify a monthly amount; for a purchase, the property amount.

Examples of valid numeric formats:

2000
2 000
2,000
1100000
1 100 000
1,100,000
`,
            fr: `💰 Avez-vous un budget en tête ? 

Pour une location préciser un montant par mois, pour un achat le montant de la propriété.

Exemples de formats numériques valides:

2000
2 000
2,000
1100000
1 100 000
1,100,000`,
        },

        bedrooms: {
            en: `🛏️ How many bedrooms minimum? 

(number only please)?`,
            fr: `🛏️ Combien de chambres au minimum ? 

(le nombre seulement SVP)`,
        },

        bathrooms: {
            en: `🛁 How many bathrooms minimum? 

(a number only please)`,
            fr: `🛁 Combien de salles de bains minimum? 

(le nombre seulement SVP)`,
        },

        garage: {
            en: `🅿️ Do you need a garage - If so, how many minimum? 

(provide a number only please, 0 for none) ?`,
            fr: `🅿️ Avez-vous besoin d’un garage - Si oui, combien au minimum ? 

(le nombre SVP, 0 pour aucun)`,
        },

        location: {
            en: `📍 Please confirm next the region, city and even the neighborhood(s) of the target property if possible!`,
            fr: `📍 Veuillez confirmer la région, ville et possiblement le(s) quartier(s) de la propriété concernée !`,
        },
    },

    S: {
        price: {
            en: `💰 Do you have an approximate selling price in mind? 

Use valid numeric formats such as:

(750000, 
750 000 or
750,000)`,
            fr: `💰 Avez-vous un prix de vente approximatif en tête ? 

Utiliser un format numérique valide, par exemple:
(750000, 
750 000 ou 
750,000)`,
        },

        bedrooms: {
            en: `🛏️ How many bedrooms do you have? 

(a number only please)`,
            fr: `🛏️ Combien de chambres avez-vous ? 

(un nombre seulement SVP)`,
        },

        bathrooms: {
            en: `🛁 How many bathrooms do you have? 

(a number only please)`,
            fr: `🛁 Combien de salles de bains avez-vous ? 

(un nombre seulement SVP)`,
        },

        garage: {
            en: `🅿️ How many garage spaces do you have? 
(a number only please)?`,
            fr: `🅿️ Combien d'espace garage avez-vous ? 

(un nombre seulement SVP)`,
        },

        location: {
            en: `📍 In which city/neighborhood your property is located ?`,
            fr: `📍 Dans quelle ville/quartier êtes vous situé ?`,
        },
    },

    R: {
        price: {
            en: `💰 What rental price target per month do you have in mind? 

Use valid numeric formats such as:

(2000, 2 000 or 2,000)`,
            fr: `💰 Quel montant par mois avez vous en tête?

Utiliser un format de réponse valide, par exemple:

(2000, 2 000 ou 2,000)`,
        },

        bedrooms: {
            en: `🛏️ How many bedrooms ? 

(a number only please)`,
            fr: `🛏️ Combien de chambres ? 

(un nombre seulement SVP)`,
        },

        bathrooms: {
            en: `🛁 How many bathrooms? 

(a number only please)`,
            fr: `🛁 Combien de salles de bains ? 

(un nombre seulement SVP)`,
        },

        parking: {
            en: `🅿️ Do you have private parking space(s)? 

(a number only please, 0 for none)?`,
            fr: `🅿️ Avez-vous des places de stationnement privées ? 

(un nombre seulement SVP, 0 pour aucun)`,
        },

        location: {
            en: `📍 In which city/neighborhood are you located?`,
            fr: `📍 Dans quelle ville/quartier êtes vous situé ?`,
        },
    },

    E: {},

    generic: {
        expectations: {
            fr: `✨ Dictez vos attentes particulières:

🏊‍ Je veux une piscine creusée (incontournable)
🔥 Je veux un foyer (souhaitable)
⚖️ Je veux vendre sans garantie légale
🎭 Je veux un service de "home staging"
...`
,

            en: `✨ State any of your expectations: 

🏊‍ Inground pool (a must) 
🔥 A Fireplace (nice to have)
⚖️ I want to sell without legal warranty
🎭 I need a home staging service
...`      
    }

,

//firstName désigne un nom complet, le nom du champ a été conservé pour préserver la mécanique du code
        firstName: {
            fr: `Quel est *votre nom* SVP ?
(Vos réponses nous aident à offrir un meilleur service) Répondez X pour préserver votre confidentialité!
(Notre politique de confidentialité au: https://christophe-marcellin.c21.ca/contact/#politique).`,

            en: `*Your name*, please?
(Your answers help us provide better support) Reply *X* for privacy!
(Our privacy policy at: https://christophe-marcellin.c21.ca/en/contact/#policy).`
        }


,

    //lastName: {
    //    fr: `👤 Nom de famille ?`,
    //    en: `👤 Your last name?`,
    //},

//    age: {
//        fr: `🎂 Quelle est votre année de naissance ?  
//(chiffres seulement ex.: 84 pour 1984, toujours *X* pour ne pas répondre)`,
//        en: `🎂 For our statistics, may I have your year of birth please? (numbers only e.g.: 84 for 1984)`,
//    },

        phone: {
        fr: `📞 À quel numéro de téléphone pouvons-nous vous joindre (format 999-999-9999) ?`,
        en: `📞 What is your phone number (format 999-999-9999)?`,
    },

    email: {
        fr: `✉️ Quelle est votre adresse courriel SVP ?`,
        en: `✉️ What is your email address please?`,
    },

    wantsContact: {
        fr: `👥 Désirez-vous qu'on fasse un suivi ? Spécifier le no. d'option :  

1️⃣ Oui  
2️⃣ Non 
3️⃣ Je désire un site Web comme https://tinyurl.com/45fskxav pour trouver une propriété selon mes spécifications que j'ai fournies`,

        en: `👥 Would you like someone from our team to contact you? Specify an option number:  

1️⃣ Yes  
2️⃣ No  
3️⃣ I would like a website like https://tinyurl.com/45fskxav to find a property based on the specifications I provided.`
    }
,

},
};

function getPromptForSpec(field, lang = 'fr', projectType = 'B') {
    return (
        questions[projectType]?.[field]?.[lang] ||
        questions.generic?.[field]?.[lang] ||
        `Veuillez fournir une valeur pour ${field}`
    );
}



// 🔹 ProjectType
function getPromptForProjectType(lang = 'fr') {

     return  lang === 'en'
         ? `To better assist you, which number best describes your goal here?\n
1️⃣ Buying / Renting 
2️⃣ Selling  
3️⃣ Renting out  
4️⃣ Let's talk Real Estate`
            : `Pour bien vous assister, votre but correspond à quel numéro:\n
1️⃣ Acheter / Louer
2️⃣ Vendre  
3️⃣ Offrir en location  
4️⃣ Parler immobilier`
   ;
}

// 🔹 PropertyUsage
function getPromptForPropertyUsage(lang = 'fr') {

  return     lang === 'en'
            ? `🏠 To be precise, which nbr corresponds to the type of property you are refering to:\n
1️⃣ Single-family home  
2️⃣ Condo  
3️⃣ Apartment  
4️⃣ Multiplex`
            : `🏠 Veuillez indiquer le no. correspondant à la propriété ciblée:\n
1️⃣ Unifamiliale  
2️⃣ Condo  
3️⃣ Logement  
4️⃣ Multiplex`
    ;
}


function getPreamble(lang = 'fr')
{
    return lang === 'fr' ? `Bonjour, je suis CasaNova, une IA qui offre plus de donnée que ChatGpt en immobilier pour le secteur sud de Montréal (détails du secteur sur www.christophemarcellin.com).`

      : `Hello, I’m CasaNova, your real estate AI offering more knowledge than ChatGpt for the south of Montreal (target area at www.christophemarcellin.com`
};


module.exports = {
    getPromptForProjectType,
    getPromptForPropertyUsage
};




module.exports = {
    questions,
    getPromptForSpec,
    getPromptForProjectType,
    getPromptForPropertyUsage,
    getPreamble
};
