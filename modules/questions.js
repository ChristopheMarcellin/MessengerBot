const questions = {

    B: {
        price: {
            en: `💰 Do you have a budget in mind ? 

For a rental, specify a monthly amount; for a purchase, the property amount.

(Valid formats: 2000, 2 000, 2,000, 200 000)


`,
            fr: `💰 Avez-vous un budget en tête ? 

Pour une location préciser un montant par mois, pour un achat le montant de la propriété.

(Formats valides: 2000, 2 000, 2,000, 200 000)

`,
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
            fr: `📍 Veuillez confirmer la région, ville et possiblement le(s) quartier(s) de la propriété visée !`,
        },
    },

    S: {
        price: {
            en: `💰 Do you have an approximate selling price in mind (0 if not)? 

        (Numeric only, examples: 625,900 or 625 900)`,

            fr: `💰 Avez-vous un prix de vente approximatif en tête (0 pour non) ? 

(Valeur numérique seulement, ex.: 625,900 ou 625 900):
`,
        },

        bedrooms: {
            en: `🛏️ How many bedrooms do you have? 

(a number only please)`,
            fr: `🛏️ Combien de chambres avez-vous ? `,
        },

        bathrooms: {
            en: `🛁 How many bathrooms do you have? 

(a number only please)`,
            fr: `🛁 Combien de salles de bains avez-vous ? `,
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
(Numeric value only, for example: 2000 or 2,000)

(2000, 2 000 or 2,000)`,
            fr: `💰 Quel montant par mois avez vous en tête?

(Valeur numérique seulement par exemple (2000 ou 2,000):`,
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
            fr: `✨ Dictez toutes attentes particulières concernant ce projet:`
,

            en: `✨ State any of your expectations regarding this project:`      
    }

,

//firstName désigne un nom complet, le nom du champ a été conservé pour préserver la mécanique du code
        firstName: {
            fr: `


            Votre nom SVP (*X* si confidentiel) ? \n
            
(Répondre facilite les suivis ! - Notre politique de confidentialité au: https://christophe-marcellin.c21.ca/contact/#politique).`,
            en: `*Your name*, please (*X* if condidential)?\n
(Answering facilitates follow-ups! - Our privacy policy at: https://christophe-marcellin.c21.ca/en/contact/#policy).`
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
        fr: `📞 No de tel. (*X* si confidentiel - format 123-456-7890) ?`,
            en: `📞 What is your phone number (*X* if confidential - format 123-456-7890)`,
    },

    email: {
        fr: `✉️ Votre adresse courriel SVP (*X* si confidentiel)`,
        en: `✉️ Your email address please? (*X* if confidential)`,
    },

    wantsContact: {
        fr: `👥 Désirez-vous qu'on fasse un suivi ? Spécifier le no. d'option :  

1️⃣ Oui  
2️⃣ Non 
3️⃣ Je désire un site Web qui présente des propriétés que je cherche. \n
(disponible seulement si les informations fournies le permettent, voir un exemple: https://tinyurl.com/45fskxav )`,

        en: `👥 Would you like someone from our team to contact you? Specify an option number:  

1️⃣ Yes  
2️⃣ No  
3️⃣ I would like a website showcasing properties I am looking for.\n
(available only when the provided information allow it, see an example: https://tinyurl.com/45fskxav )`
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
         ? `\n Which number defines best your visit?\n
1️⃣ Buying / Renting 
2️⃣ Selling  
3️⃣ Renting out  
4️⃣ Let's talk Real Estate`
         : `\n Quel numéro définit le mieux votre visite ?\n
1️⃣ Acheter / Louer
2️⃣ Vendre  
3️⃣ Offrir en location  
4️⃣ Parler immobilier`
   ;
}

// 🔹 PropertyUsage
function getPromptForPropertyUsage(lang = 'fr') {

  return     lang === 'en'
            ? `🏠 Which nbr matches best the targeted property type:\n
1️⃣ Single-family home  
2️⃣ Condo  
3️⃣ Apartment  
4️⃣ Multiplex`
            : `🏠 Quel no. correspond au type de propriété visé:\n
1️⃣ Unifamiliale  
2️⃣ Condo  
3️⃣ Logement  
4️⃣ Multiplex`
    ;
}


function getPreamble(lang = 'fr')
{
    return lang === 'fr' ? `Bonjour, je suis CasaNova l'assistant de Christophe, je peux vous aider avec un projet de transaction immobilière et répondre à plusieurs de vos questions, mais avant de débuter je dois vous poser quelques questions qui m'aideront à mieux vous servir (plus vous êtes précis, plus je saurai vous être utile). \n \n Vous pouvez en tous temps mettre fin à cette cessison en tapant -> *bye*.`

        : `Hello, I am CasaNova, Christophe’s virtual assistant. I can help you with a real estate transaction project and answer many of your questions. Before we begin, however, I need to ask you a few questions that will help me serve you better (the more precise you are, the more helpful I can be).\n \n You may end this session at any moment by typing -> *bye*`
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
