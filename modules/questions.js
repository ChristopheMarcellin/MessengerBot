const questions = {

    B: {
        price: {
            en: `💰 Do you have a budget in mind ? 

Say: 

350 (for 350 000), 
600 (for 600 000) or 
1200 (for 1 200 000) etc.`,
            fr: `💰 Avez-vous un budget en tête ? 

Dites: 

350 (pour 350 000), 
600 (pour 600 000) ou 
1200 (pour 1 200 000) etc.`,
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
            en: `🚗 Do you need a garage - If so, how many minimum? 

(provide a number only please, 0 for none) ?`,
            fr: `🚗 Avez-vous besoin d’un garage - Si oui, combien au minimum ? 

(le nombre SVP, 0 pour aucun)`,
        },

        location: {
            en: `📍 Which region, city or neighborhood(s) would be your ideal target?`,
            fr: `📍 Quelle région, ville ou quartier(s) serait votre cible idéale ?`,
        },
    },

    S: {
        price: {
            en: `💰 Do you have an approximate selling price in mind? 

(say 350 for 350 000, 
600 for 600 000 or 
1200 for 1 200 000)`,
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
            en: `🚗 How many garage spaces do you have? 
(a number only please)?`,
            fr: `🚗 Combien d'espace garage avez-vous ? 

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

(enter 2000 for 2000/month)?`,
            fr: `💰 Quel montant avez vous en tête? 

(entrer 2000 pour 2000/mois) ?`,
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

Par exemple: 

🏊‍♂️ Je veux une piscine creusée (incontournable),  

🔥 Je veux un foyer (souhaitable),  

⚖️ Je veux vendre sans garantie légale,  

🎭 Je veux un service de "home staging"`,

            en: `✨ State your expectations: 

For example you may say: 

🏊‍♂️ Inground pool (a must),  

🔥 I'd like a Fireplace (nice to have),  

⚖️ I want to sell without legal warranty,  

🎭 I need a home staging service`
      
    }

,

    firstName: {
        fr: `Quelques informations seraient nécessaires avant de passer à vos questions, ceci nous permet:

📢 1 - De vous alerter lorsqu'une propriété rencontre vos besoins.  

🏡 2 - De vous contacter lorsqu'une propriété est hors marché ou ailleurs que sur Centris par choix ou pour confidentialité.  

🤝 3 - De vous joindre lorsque vous le demandez.  

ℹ️ 4 - D'avoir un minimum d'information lorsque vous décidez de nous contacter.  

📊 5 - De compiler des statistiques.


Vous n'êtes pas tenu de répondre aux questions, toutefois sachez que la qualité des services
de CasaNova et votre expérience dépendent de *l'exactitude de vos informations*, le choix de vos réponses est irréversible particulièrement
si nous ne pouvons vous joindre.

*Vos informations sont confidentielles* (aucune publicité ni partage à des tiers). [Consulter notre politique de confidentialité](https://christophe-marcellin.c21.ca/contact/#politique)

*Ainsi, si vous ne désirez pas répondre à l'une des questions qui suit, simplement répondre "X" (sans les guillemets).*  

Commençons par *votre prénom* SVP ?`,

        en: `Before moving on to your questions, a few details are necessary. This allows us to:

📢 1 - Alert you when a property matches your needs.  

🏡 2 - Contact you about off-market properties or listings not on Centris (by choice or for confidentiality).  

🤝 3 - Reach out when you request it.  

ℹ️ 4 - Have a minimum of information when you decide to contact us.  

📊 5 - Compile useful statistics.  


You are not required to answer these questions. However, please note that the quality of CasaNova's services and your overall experience depend on *the accuracy of your information*. Your choices are irreversible, particularly if we are unable to contact you.  

*Your information is confidential* (no advertising or sharing with third parties). [View our Privacy Policy](https://christophe-marcellin.c21.ca/en/contact/#policy)  

*If you do not wish to answer one of the following questions, simply reply with "X" (without quotes).*  

Let's start with *your first name*, please?`,
    }

,

    lastName: {
        fr: `👤 Nom de famille ?`,
        en: `👤 Your last name?`,
    },

    age: {
        fr: `🎂 Quel âge avez-vous SVP ?  
(chiffre seulement SVP)`,
        en: `🎂 What is your age please?  
(number only please)`,
    },

    phone: {
        fr: `📞 À quel numéro de téléphone pouvons-nous vous joindre (format xxx-xxx-xxxx) ?`,
        en: `📞 What is your phone number (format xxx-xxx-xxxx)?`,
    },

    email: {
        fr: `✉️ Quelle est votre adresse courriel ?`,
        en: `✉️ What is your email address?`,
    },

    wantsContact: {
        fr: `👥 Souhaitez-vous qu’un membre de notre équipe vous contacte ? Spécifier le no. d'option :  

1️⃣ Oui  
2️⃣ Non 
3️⃣ 📲 alertes seulement`,

        en: `👥 Would you like someone from our team to contact you? Specify an option number:  

1️⃣ Yes  
2️⃣ No  
3️⃣ 📲 Alerts only`,
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

function getPromptForProjectType(lang = 'fr') {
    return lang === 'en'
        ? `Hello, I’m CasaNova, your AI-powered assistant.\n\n
*I can provide you with valuable services* in the field of real estate in Quebec, such as:\n
📊 *Providing an estimate for a property in a neighborhood or for a specific address (estimates are more accurate within our area of service)*\n
🔢 *Performing a mortgage calculation*\n
🏠 *Creating a website with properties matching your criteria*\n
💬 *Giving you an informed opinion*\n
⚖️ *Answering your legal questions (Quebec)*\n
ℹ️ *Informing you about our services*\n\n
To better assist you, which option number best describes you:\n
1️⃣ (buy)
2️⃣ (sell)
3️⃣ (rent out)
4️⃣ (I have questions - Real Estate talk)`
        : `Bonjour, je suis CasaNova, votre assistant propulsé par l’IA.\n\n
*Je peux vous rendre de précieux services* dans le domaine de l'immobilier au Québec, par exemple :\n
📊 *Vous fournir un estimé pour une propriété dans un quartier ou pour une adresse spécifique (nos estimés sont plus précis pour notre territoire)*\n
🔢 *Faire un calcul hypothécaire*\n
🏠 *Créer un site web avec les propriétés qui correspondent à vos critères*\n
💬 *Vous donner une opinion éclairée*\n
⚖️ *Répondre à vos questions légales (Québec)*\n
ℹ️ *Vous informer sur nos services*\n\n
Pour bien vous assister, quel no. d'intention vous décrit le mieux :\n

1️⃣ Acheter 
2️⃣ Vendre  
3️⃣ Offrir en location  
4️⃣ J'ai des question, je veux parler d'immobilier`

}

function getPromptForPropertyUsage(lang = 'fr') {
    return lang === 'en'
        ? `🏠 What type of property are you interested in?  
Please choose the corresponding option:  

1️⃣ Single-family home  
2️⃣ Condo  
3️⃣ Apartment  
4️⃣ Multiplex`
        : `🏠 Quel est le type de propriété qui vous intéresse ?  
Veuillez choisir l'option correspondante :  

1️⃣ Unifamiliale  
2️⃣ Condo  
3️⃣ Logement  
4️⃣ Multiplex`;
}




module.exports = {
    questions,
    getPromptForSpec,
    getPromptForProjectType,
    getPromptForPropertyUsage,
};
