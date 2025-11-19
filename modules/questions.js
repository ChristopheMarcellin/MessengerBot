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
//changes
//firstName désigne un nom complet, le nom du champ a été conservé pour préserver la mécanique du code
        firstName: {
            fr: `Quel est *votre nom* SVP ?
La qualité/disponibilité de mes services et suivis dépendent de la justesse de vos réponses. Répondre *X* est préférable à une information fausse et non réversible !
(Voir notre politique de confidentialité au: https://christophe-marcellin.c21.ca/contact/#politique).`,

            en: `What is *your name*, please?
The quality/availability of my services and follow-ups depends on the accuracy of your answers. Replying with *X* is better than giving false and irreversible information!
(See our privacy policy at: https://christophe-marcellin.c21.ca/en/contact/#policy).`
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
//changes
    wantsContact: {
        fr: `👥 Désirez-vous qu'on fasse un suivi ? Spécifier le no. d'option :  

1️⃣ Oui  
2️⃣ Non 
3️⃣ Je désire un site Web pour trouver une propriété selon mes spécifications (Exemple: https://tinyurl.com/yvyu75p7)`,

        en: `👥 Would you like someone from our team to contact you? Specify an option number:  

1️⃣ Yes  
2️⃣ No  
3️⃣ Web Alerts (for buyers only)`,
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
         ? `Before we discuss and to better assist you, from 1 to 4, which intention best describes your goal here?\n
1️⃣ Buying / Renting 
2️⃣ Selling  
3️⃣ Renting out  
4️⃣ Let's talk Real Estate`
            : `Avant d'échanger et pour bien vous assister, de 1 à 4, quel est votre but ici:\n
1️⃣ Acheter / Louer
2️⃣ Vendre  
3️⃣ Offrir en location  
4️⃣ Parler immobilier`
   ;
}

// 🔹 PropertyUsage
function getPromptForPropertyUsage(lang = 'fr') {

  return     lang === 'en'
            ? `🏠 To be precise, please enter the option number that corresponds to the type of property you are refering to:\n
1️⃣ Single-family home  
2️⃣ Condo  
3️⃣ Apartment  
4️⃣ Multiplex`
            : `🏠 Veuillez me préciser le type de propriété visé, en m'indiquant le numéro correspondant :\n
1️⃣ Unifamiliale  
2️⃣ Condo  
3️⃣ Logement  
4️⃣ Multiplex`
    ;
}

//changes
function getPreamble(lang = 'fr')
{
    return lang === 'fr' ? `Bonjour, je suis CasaNova, votre IA de l'immobilier pour le Québec.`

      : `Hello, I’m CasaNova, your AI real estate assistant.  
My interactive nature allows users to ask me questions, and for me to reply and or ask questions in return.  
Before we continue, please take note of the following:\n\n

📜 1 - *Terms of Use*\n
To skip any of my questions, you may reply with "X" (without quotes).  
Not answering a question is preferable to providing false information.  
*However, the quality of this experience and the level of service I can provide are directly linked to the accuracy of your answers and the relevance of your comments.*  
Answering is optional, but your responses are recorded and may be permanent, especially if we have no way to contact you.  
Of course, choosing not to answer may be justified and does not automatically reduce the level of service.\n\n

🔒 2 - *Privacy Policy*\n
*Your information is confidential* (no advertising or sharing with third parties). [View our privacy policy](https://christophe-marcellin.c21.ca/en/contact/#policy)\n\n

🛎️ 3 - Overview of CasaNova’s Services:\n
*I can provide valuable services in the field of real estate in Québec, for example:*\n
📊 *Estimate the value of a property in a neighborhood or for a specific address with a confidence level (our estimates are more accurate within our territory)*\n
📢 *Publish a personalized website that alerts you when a property matching your criteria is found: https://tinyurl.com/yvyu75p7*\n
🔢 *Perform a mortgage calculation*\n
💬 *Provide an informed real estate opinion*\n
⚖️ *Answer legal real estate questions (Québec)*\n
ℹ️ *Detail our services*\n\n
`
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
