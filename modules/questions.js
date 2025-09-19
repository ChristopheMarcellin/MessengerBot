const questions = {

    B: {
        price: {
            en: `💰 Do you have a budget in mind ? 

You may say: 

350 (for $350 000), 
600 (for $600 000) or 
1200 (for $1 200 000) etc.`,
            fr: `💰 Avez-vous un budget en tête ? 

Vous pouvez dire: 

350 (pour $350 000), 
600 (pour $600 000) ou 
1200 (pour $1 200 000) etc.`,
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
You may say:

(350 for $350 000, 
600 for $600 000 or 
1200 for $1 200 000)`,
            fr: `💰 Avez-vous un prix de vente approximatif en tête ? 

(dites 350 pour 350 000, 
600 pour 600 000 ou 
1200 pour 1 200 000)`,
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
            en: `💰 What rental price target do you have in mind? 
You may say:
(2000 for 2000/month)?`,
            fr: `💰 Quel montant avez vous en tête? 
Vous pouvez dire:
(2000 pour 2000/mois) ?`,
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
            fr: `✨ Dictez vos attentes: 

Par exemple si vous achetez: 

🏊‍♂️ Je veux une piscine creusée (incontournable)

🔥 Je veux un foyer (souhaitable)

Si vous vendez:

⚖️ Je veux vendre sans garantie légale

🎭 Je veux un service de "home staging"

Etc.`,

            en: `✨ State your expectations: 

For example if your buying you may say: 

🏊‍♂️ Inground pool (a must) 

🔥  A Fireplace (nice to have)

If you're selling:

⚖️ I want to sell without legal warranty

🎭 I need a home staging service

Etc.`      
    }

,

        firstName: {
            fr: `Je suis prêt à échanger avec vous, toutefois j'aimerais recueillir certaines de vos coordonnées, ceci nous permet:

📢 1 - De vous offrir une page Web qui vous alerte lorsqu'une propriété rencontre vos besoins.  

🏡 2 - De vous contacter lorsqu'une propriété est hors marché ou ailleurs que sur Centris® par choix ou pour confidentialité.  

🤝 3 - De vous joindre lorsque vous le demandez.  

ℹ️ 4 - D'avoir un minimum d'information lorsque vous décidez de nous contacter.  

📊 5 - De compiler des statistiques.


Petit rappel: 
1 - *Vous n'êtes pas tenu de répondre aux questions*
2 - *Vos informations sont confidentielles* (aucune publicité ni partage à des tiers). [Consulter notre politique de confidentialité](https://christophe-marcellin.c21.ca/contact/#politique)

*Simplement répondre "X" (sans les guillemets) pour ne pas répondre plutôt que de donner une fausse information.*  

Commençons la prise de vos coordonnées par *votre prénom* SVP ?`,

            en: `I am ready to chat with you, however I would like to collect some of your contact information, this allows us to::

📢 1 - To provide you with a web page that alerts you when a property meets your requirements.  

🏡 2 - Contact you about off-market properties or listings not shown on Centris (by choice or for confidentiality).  

🤝 3 - Reach you when you request it.  

ℹ️ 4 - Have a minimum of information when you decide to contact us.  

📊 5 - Compile statistics.  


Reminder:
1 - *You are not required to answer these questions*
2 - *Your information is confidential* (no advertising or sharing with third parties). [View our privacy policy](https://christophe-marcellin.c21.ca/en/contact/#policy)

*Simply reply with "X" (without quotes) to skip a question rather than providing false information.*  

Let’s start with your contact details — may I have your *first name* please?`,
        }


,

    lastName: {
        fr: `👤 Nom de famille ?`,
        en: `👤 Your last name?`,
    },

    age: {
        fr: `🎂 Pour nos statistiques, votre année de naissance SVP ?  
(chiffres seulement ex.: 84 pour 1984)`,
        en: `🎂 For our statistics, may I have your year of birth please? (numbers only e.g.: 84 for 1984)`,
    },

    phone: {
        fr: `📞 À quel numéro de téléphone pouvons-nous vous joindre (format xxx-xxx-xxxx) ?`,
        en: `📞 What is your phone number (format xxx-xxx-xxxx)?`,
    },

    email: {
        fr: `✉️ Quelle est votre adresse courriel SVP ?`,
        en: `✉️ What is your email address please?`,
    },

    wantsContact: {
        fr: `👥 Souhaitez-vous qu’un membre de notre équipe vous contacte ? Spécifier le no. d'option :  

1️⃣ Oui  
2️⃣ Non 
3️⃣ Des alertes Web (acheteurs seulement)`,

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
         ? `To better assist you, from 1 to 4, which intention best describes your goal here?\n
1️⃣ Buying  
2️⃣ Selling  
3️⃣ Renting out  
4️⃣ Let's talk Real Estate`
            : `Pour bien vous assister, de 1 à 4, quelle intention décrit le mieux votre objectif ici:\n
1️⃣ Acheter  
2️⃣ Vendre  
3️⃣ Offrir en location  
4️⃣ J'aimerais parler d'immobilier`
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
            : `🏠 Veuillez me préciser le type de propriété concerné, en m'indiquant le numéro correspondant :\n
1️⃣ Unifamiliale  
2️⃣ Condo  
3️⃣ Logement  
4️⃣ Multiplex`
    ;
}


function getPreamble(lang = 'fr')
{
  return  lang === 'fr' ? `Bonjour, je suis CasaNova, votre IA de l'immobilier.
Ma nature interactive permet aux usagers de me poser des questions et moi de répondre et ou d'en poser.
Avant de poursuivre, il serait utile de prendre connaissance de ce qui suit:\n\n
📜 1 - *Termes d’utilisation*\n
Pour ignorer mes questions, on peut répondre par "X" (sans guillemets)
Ne pas répondre à une question est encouragé plutôt que de fournir une fausse information. 
*Toutefois, la qualité de cette expérience et mon niveau de service sont directement liés à l'exactitude des réponses fournies et à la pertinence des propos.*
Répondre aux questions est optionnel mais les réponses enregistrées revêtent un caractère permanent, surtout si on ne peut joindre l'usager.
Évidemment, ne pas répondre peut être justifié et n'entraîne pas automatiquement une baisse de service.\n\n
🔒 2 - "Politique de confidentialité"\n
*Vos informations sont confidentielles* (aucune publicité ni partage à des tiers). [Consulter notre politique de confidentialité](https://christophe-marcellin.c21.ca/contact/#politique)\n

🛎️ 3 - Aperçu des services de CasaNova:\n
*Je peux rendre de précieux services dans le domaine de l'immobilier au Québec, par exemple :*\n
📊 *Estimer la valeur d'une propriété dans un quartier ou pour une adresse spécifique avec un niveau de confiance (nos estimés sont plus précis pour notre territoire)*\n
📢 *Publier un site Web personnalisé qui alerte d'une propriété trouvée selon vos critères: https://tinyurl.com/yvyu75p7*\n
🔢 *Faire un calcul hypothécaire*\n
💬 *Donner une opinion éclairée en immobilier*\n
⚖️ *Répondre aux questions légales en immobilier (Québec)*\n
ℹ️ *Détailler nos services*\n\n`
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
