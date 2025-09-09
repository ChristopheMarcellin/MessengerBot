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
            en: `📍 Please confirm next the region, city and even the neighborhood(s) of the target property if possible!`,
            fr: `📍 Veuillez confirmer la région, ville et possiblement le(s) quartier(s) de la propriété concernée !`,
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


*Vous n'êtes pas tenu de répondre aux questions*, toutefois sachez que *la qualité de votre expérience et la disponibilité des services
de CasaNova est liée à l'exactitude de vos informations et la pertinence de vos propos*. Le choix de vos réponses ou de vos propos sont notés et parfois irréversibles, particulièrement
si nous n'avons aucun moyen pour vous joindre.  Ceci constitue les *"termes d'utilisation"*.

*Vos informations sont confidentielles* (aucune publicité ni partage à des tiers). [Consulter notre politique de confidentialité](https://christophe-marcellin.c21.ca/contact/#politique)

*Ainsi, si vous ne désirez pas répondre à l'une des questions qui suit, simplement répondre "X" (sans les guillemets) en tenant compte de ce qui précède.*  

Commençons par *votre prénom* SVP ?`,

        en: `Before moving on to your questions, a few details are necessary. This allows us to:

📢 1 - Alert you when a property matches your needs.  

🏡 2 - Contact you about off-market properties or listings not on Centris (by choice or for confidentiality).  

🤝 3 - Reach out when you request it.  

ℹ️ 4 - Have a minimum of information when you decide to contact us.  

📊 5 - Compile useful statistics.  


You are not required to answer the questions, however please note that the quality of your experience and the availability of CasaNova’s services depend on the accuracy of your information and the relevance of your responses. The choice of your answers or comments is recorded and may sometimes be irreversible, particularly if we have no way to contact you. This constitutes the “terms of use”.

Your information is confidential (no advertising or sharing with third parties). Consult our privacy policy https://christophe-marcellin.c21.ca/en/contact/#policy

Therefore, if you do not wish to answer one of the following questions, simply reply with "X" (without quotes), taking into account the above.`,
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
3️⃣ Les alertes Web seulement SVP`,

        en: `👥 Would you like someone from our team to contact you? Specify an option number:  

1️⃣ Yes  
2️⃣ No  
3️⃣ Web Alerts only please`,
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


const PREAMBLE = {
    fr: `Bonjour, je suis CasaNova, votre assistant en immobilier propulsé par l’IA.\n\n
Ma nature interactive vous permet de me poser des questions et à moi de vous en poser.\n\n
Ainsi je vous invite à prendre connaissance de ce qui suit avant de débuter notre échange :\n\n
📜 1 - Les "Termes d’utilisation" de ce service\n
🔒 2 - Notre "Politique de confidentialité"\n
🛎️ 3 - Aperçu de mes services\n\n

*La qualité de votre expérience et la disponibilité de mes services est liée à l'exactitude de vos informations et à la pertinence de vos propos*. En aucun cas vous n'êtes tenu de répondre aux questions qui vous sont posées, toutefois sachez que le choix de vos réponses ou de vos propos sont enregistrés et ont une nature permanente, notamment si je n’ai aucun moyen de vous contacter.\n\n
Ainsi, si vous choisissez de ne pas répondre à l'une de mes questions lors de notre échange, simplement répondre par "X" (sans les guillemets) en tenant compte de ce qui précède.\n
Un refus de répondre peut être justifié et n’entraîne pas automatiquement une baisse de la qualité de mon service. Par exemple, ne pas fournir votre adresse peut limiter mes services, mais ne pas divulguer votre âge serait sans grande conséquence.\n\n
🔒 2 - Notre "Politique de confidentialité"\n
*Vos informations sont confidentielles* (aucune publicité ni partage à des tiers).\n
[Consulter l’entièreté de notre politique de confidentialité](https://christophe-marcellin.c21.ca/contact/#politique)\n\n
🛎️ 3 - Aperçu de mes services\n
*Je peux vous rendre de précieux services dans le domaine de l'immobilier au Québec, par exemple :*\n
📊 *Vous fournir un estimé pour une propriété dans un quartier ou pour une adresse spécifique (nos estimés sont plus précis pour notre territoire)*\n
🔢 *Faire un calcul hypothécaire*\n
📢 *Créer des alertes qui correspondent à vos critères de recherche*\n
💬 *Vous donner une opinion éclairée*\n
⚖️ *Répondre à vos questions légales (Québec)*\n
ℹ️ *Vous informer sur nos services*\n\n`,
    en: `Hello, I’m CasaNova, your AI-powered real estate assistant.\n\n
My interactive nature allows you to ask me questions, and for me to ask you some in return.\n\n
Before we begin, please take note of the following:\n\n
📜 1 - The "Terms of Use" of this service\n
🔒 2 - Our "Privacy Policy"\n
🛎️ 3 - Overview of my services\n\n
*The quality of your experience and the availability of my services depend on the accuracy of your information and the relevance of your responses.* You are under no obligation to answer the questions I ask. However, please note that your answers or comments are recorded and may be permanent, especially if I have no way to contact you.\n\n
Therefore, if you choose not to answer one of my questions during our exchange, simply reply with "X" (without quotes) while keeping the above in mind.\n
Refusing to answer may be justified and does not automatically reduce the quality of my service. For example, not providing your address may limit what I can do, but not disclosing your age will have little consequence.\n\n
🔒 2 - Our "Privacy Policy"\n
*Your information is confidential* (no advertising or sharing with third parties).\n
[View our full privacy policy](https://christophe-marcellin.c21.ca/en/contact/#policy)\n\n
🛎️ 3 - Overview of my services\n
*I can provide you with valuable services in the field of real estate in Québec, for example:*\n
📊 *Provide an estimate for a property in a neighborhood or at a specific address (our estimates are more accurate within our main territory)*\n
🔢 *Perform a mortgage calculation*\n
📢 *Create alerts that match your search criteria*\n
💬 *Offer you an informed opinion*\n
⚖️ *Answer your legal questions (Québec)*\n
ℹ️ *Inform you about our services*\n\n`
};

// 🔹 ProjectType
function getPromptForProjectType(lang = 'fr', session) {
    const preamble = !session.termsShown ? PREAMBLE[lang] + "\n" : "";
    session.termsShown = true;
    return preamble + (
        lang === 'en'
            ? `To better assist you, which option number best describes you:\n
1️⃣ Buying  
2️⃣ Selling  
3️⃣ Renting out  
4️⃣ I have questions – Real Estate talk`
            : `Pour bien vous assister, quel no. d'intention vous décrit le mieux :\n
1️⃣ Acheter  
2️⃣ Vendre  
3️⃣ Offrir en location  
4️⃣ J'ai des questions, je veux parler d'immobilier`
    );
}

// 🔹 PropertyUsage
function getPromptForPropertyUsage(lang = 'fr', session) {
    const preamble = !session.termsShown ? PREAMBLE[lang] + "\n" : "";
    session.termsShown = true;
    return preamble + (
        lang === 'en'
            ? `🏠 To be precise, please enter the option number that corresponds to the type of property you have in mind:\n
1️⃣ Single-family home  
2️⃣ Condo  
3️⃣ Apartment  
4️⃣ Multiplex`
            : `🏠 Veuillez me préciser le type de propriété qui vous intéresse, en m'indiquant le numéro correspondant :\n
1️⃣ Unifamiliale  
2️⃣ Condo  
3️⃣ Logement  
4️⃣ Multiplex`
    );
}

module.exports = {
    getPromptForProjectType,
    getPromptForPropertyUsage
};




module.exports = {
    questions,
    getPromptForSpec,
    getPromptForProjectType,
    getPromptForPropertyUsage,
};
