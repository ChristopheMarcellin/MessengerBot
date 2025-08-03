const questions = {
    B: {
        price: {
            en: "Do you have a budget in mind ? \n\Say: \n\n350 (for 350 000), \n600 (for 600 000) or \n1200 (for 1 200 000) etc.",
            fr: "Avez-vous un budget en tête ? \n\Dites: \n\n350 (pour 350 000), \n600 (pour 600 000) ou \n1200 (pour 1 200 000) etc.",
        },
        bedrooms: {
            en: "How many bedrooms minimum? \n\n(number only please)?",
            fr: "Combien de chambres au minimum ? \n\n(le nombre seulement SVP)",
        },
        bathrooms: {
            en: "How many bathrooms minimum? \n\n(a number only please)",
            fr: "Combien de salles de bains minimum? \n\n(le nombre seulement SVP)",
        },
        garage: {
            en: "Do you need a garage - If so, how many minimum? \n\n(provide a number only please, 0 for none) ?",
            fr: "Avez-vous besoin d’un garage - Si oui, combien au minimum ? \n\n(le nombre SVP, 0 pour aucun)",
        },
        location: {
            en: "Which region, city or neighborhood(s) would be your ideal target?",
            fr: "Quelle région, ville ou quartier(s) serait votre cible idéale ?",
        },
    },
    S: {
        price: {
            en: "Do you have an approximate selling price in mind? \n\n(say 350 for 350 000, \n600 for 600 000 or \n1200 for 1 200 000)",
            fr: "Avez-vous un prix de vente approximatif en tête ? \n\n(dites 350 pour 350 000, \n600 pour 600 000 ou \n1200 pour 1 200 000",
        },
        bedrooms: {
            en: "How many bedrooms do you have? \n\n(a number only please)",
            fr: "Combien de chambres avez-vous ? \n\n(un nombre seulement SVP)",
        },
        bathrooms: {
            en: "How many bathrooms do you have? \n\n(a number only please)",
            fr: "Combien de salles de bains avez-vous ? \n\n(un nombre seulement SVP)",
        },
        garage: {
            en: "How many garage spaces do you have? \n\n(a number only please)?",
            fr: "Combien d'espace garage avez-vous ? \n\n( un nombre seulement SVP)",
        },
        location: {
            en: "In which city/neighborhood your property is located ?",
            fr: "Dans quelle ville/quartier êtes vous situé ?",
        },
    },
    R: {
        price: {
            en: "What rental price target do you have in mind? \n\n(enter 2000 for 2000/month)?",
            fr: "Quel montant avez vous en tête? \n\n(entrer 2000 pour 2000/mois) ?",
        },
        bedrooms: {
            en: "How many bedrooms ? \n\n(a number only please)",
            fr: "Combien de chambres ? \n\n(un nombre seulement SVP)",
        },
        bathrooms: {
            en: "How many bathrooms? \n\n(a number only please)",
            fr: "Combien de salles de bains ?\n\n(un nombre seulement SVP)",
        },
        parking: {
            en: "Do you have private parking space(s)? \n\n(a number only please, 0 for none)?",
            fr: "Avez-vous des places de stationnement privées ? \n(un nombre seulement SVP, 0 pour aucun)",
        },
        location: {
            en: "In which city/neighborhood are you located?",
            fr: "Dans quelle ville/quartier êtes vous situé ?",
        },
    },
    E: {},

    generic: {
        expectations: {
            fr: "Dictez vos attentes: \n\nPar exemple: \n\n-Je veux une piscine creusée (incontournable), \n\n-Je veux un foyer (souhaitable), \n\n-Je veux vendre sans garantie légale, etc.",
            en: "Dicate your expectations: \n\nFor example you may say: \n\n-Inground pool (a must), \n-I'd like a Fireplace(nice to have). \n-I need a home staging service", 
        },

        firstName: {
            fr:
                "Afin de répondre à vos questions, nous aimerions mieux vous connaître.\n\n" +
                "*Vos informations sont confidentielles* et utilisées uniquement pour mieux vous aider et à des fins statistiques *(aucune publicité ni partage à des tiers)*. " +
                "[Consulter notre politique de confidentialité](https://christophe-marcellin.c21.ca/)\n\n" +
                "Pour garantir un service de qualité et contribuer à son amélioration, *l'exactitude de vos informations* vous assure un accès complet aux services de CasaNova lors de votre prochaine conversation et nous permet de vous joindre si nécessaire.\n\n" +
                "*CasaNova peut vous rendre d'énormes services* dans le domaine de l'immobilier au Québec, par exemple :\n\n" +
                "✅ *Répondre à vos questions légales*\n" +
                "💬 *Vous donner une opinion éclairée*\n" +
                "🏠 *Créer un site web avec les propriétés qui correspondent à vos critères*\n" +
                "ℹ️ *Vous informer sur nos services*\n\n\n" +
                "Commençons par *votre prénom* SVP ?",

            en:
                "In order to answer your questions, we would like to know you better.\n\n" +
                "*Your information is confidential* and used only to better assist you and for statistical purposes *(no advertising or sharing with third parties)*. " +
                "[View our Privacy Policy](https://christophe-marcellin.c21.ca/)\n\n" +
                "To ensure quality service and contribute to its improvement, *the accuracy of your information* guarantees you full access to CasaNova's services during your next conversation and allows us to contact you if necessary.\n\n" +
                "*CasaNova can provide you with tremendous services* in the field of real estate in Quebec, for example:\n\n" +
                "✅ *Answering your legal questions*\n" +
                "💬 *Giving you an informed opinion*\n" +
                "🏠 *Creating a website with properties matching your criteria*\n" +
                "ℹ️ *Informing you about our services*\n\n\n" +
                "Let's start with *your first name*, please?"

        },

        lastName: {
            fr: "Nom de famille ?",
            en: "Your last name?",
        },

        age: {
            fr: "Quel âge avez-vous SVP ?\n(chiffre seulement SVP)",
            en: "What is your age please? \nnumber only please)",
        },

        phone: {
            fr: "À quel numéro de téléphone pouvons nous vous joindre ?",
            en: "What is your phone number?",
        },
        email: {
            fr: "Quelle est votre adresse courriel ?",
            en: "What is your email address?",
        },

        wantsContact: {
            fr: "Souhaitez-vous qu’un membre de notre équipe vous contacte, choisir la bonne option: \n\n1 (oui)\n2 (non),",
            en: "Would you like someone from our team to contact you, pick your option: \n\n1 for yes \n\n2 (for no)",
        },

        propertyUsage: {
            fr: "S'agit-il d'une propriété à revenus ayant plus d'un logement ? \nChoisir la bonne option: \n\n1 (oui)\n2 (non)",
            en: "Is this an income property with more than one apartment?  \nPick your option: \n\n1 (yes) \n2 (no)",
        },
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
        ? "Hello, I'm CasaNova, your virtual assistant powered by AI.\n\n" +
        "To better help you, which option represents you best: \n\n1 (buy)\n2 (sell) \n3 (rent out) \n4 (I have questions)"
        : "Bonjour, je suis CasaNova, votre assistant propulsé par l’IA.\n\n" +
        "Afin de mieux vous assister, quelle intention vous décrit le mieux : \n\n1 (acheter) \n2 (vendre) \n3 (offrir en location)\n4 (J'ai des questions)";
}

module.exports = {
    questions,
    getPromptForSpec,
    getPromptForProjectType
};
