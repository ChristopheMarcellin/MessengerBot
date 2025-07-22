const questions = {
    B: {
        price: {
            en: "Do you have a budget in mind ? Please say: \n\n350 for 350 000, \n600 for 600 000 or \n1200 for 1 200 000",
            fr: "Avez-vous un budget en tête ? SVP dites: \n\n350 pour 350 000, \n600 pour 600 000 ou \n1200 pour 1 200 000)",
        },
        bedrooms: {
            en: "How many bedrooms minimum? \n(provide a number only please)?",
            fr: "Combien de chambres au minimum ? \n(fournir un nombre seulement SVP)",
        },
        bathrooms: {
            en: "How many bathrooms minimum? \n(provide a number only please)",
            fr: "Combien de salles de bains minimum? \n(fournir un nombre seulement SVP)",
        },
        garage: {
            en: "Do you need a garage - If so, how many minimum? \n(provide a number only please, 0 for none) ?",
            fr: "Avez-vous besoin d’un garage - Si oui, combien au minimum ? \n(fournir un nombre SVP, 0 pour aucun)",
        },
        location: {
            en: "Which region, city or neighborhood(s) would be your ideal target?",
            fr: "Quelle région, ville ou quartier(s) serait votre cible idéale ?",
        },
    },
    S: {
        price: {
            en: "Do you have an approximate selling price in mind? \n(say 350 for 350 000, \n600 for 600 000 or \n1200 for 1 200 000)",
            fr: "Avez-vous un prix de vente approximatif en tête ? \n(dites 350 pour 350 000, \n600 pour 600 000 ou \n1200 pour 1 200 000",
        },
        bedrooms: {
            en: "How many bedrooms do you have? \n(provide a number only please)",
            fr: "Combien de chambres avez-vous ? \n(fournir un nombre seulement SVP)",
        },
        bathrooms: {
            en: "How many bathrooms do you have? \n(provide a number only please)",
            fr: "Combien de salles de bains avez-vous ? \n(fournir un nombre seulement SVP)",
        },
        garage: {
            en: "How many garage spaces do you have? \n(provide a number only please)?",
            fr: "Combien d'espace garage avez-vous ? \n(fournir un nombre seulement SVP)",
        },
        location: {
            en: "In which city/neighborhood your property is located ?",
            fr: "Dans quelle ville/quartier êtes vous situé ?",
        },
    },
    R: {
        price: {
            en: "What rental price target do you have in mind? \n(enter 2000 for 2000/month)?",
            fr: "Quel montant avez vous en tête? \n(entrer 2000 pour 2000/mois) ?",
        },
        bedrooms: {
            en: "How many bedrooms ? \n(provide a number only please)",
            fr: "Combien de chambres ? \n(fournir un nombre seulement SVP)",
        },
        bathrooms: {
            en: "How many bathrooms? \n(provide a number only please)",
            fr: "Combien de salles de bains ?\n(fournir un nombre seulement SVP)",
        },
        parking: {
            en: "Do you have private parking space(s)? \n(provide a number only please)?",
            fr: "Avez-vous des places de stationnement privées ? \n(fournir un nombre seulement SVP)",
        },
        location: {
            en: "In which city/neighborhood are you located?",
            fr: "Dans quelle ville/quartier êtes vous situé ?",
        },
    },
    E: {},

    generic: {
        expectations: {
            fr: "Laissez connaître vos attentes. Précisez ce que vous voulez selon votre situation: \n\nPar exemple: \n\n-Je veux piscine creusée (incontournable), \n-J'aimerais un foyer (souhaitable), \n-Je veux vendre sans garantie légale, etc.",
            en: "Let us know about any expectations you may have according to your situation: \n\nFor example you may say: \n\n-Inground pool (must), \n-Fireplace(nice to have). \n-I need home staging", 
        },

        firstName: {
            fr: "Nous aimerions répondre à vos question mais avant de débuter nous aimerions quelques informations qui nous servent à des fins de statistiques ou de suivi. " +
                "Vos infos demeurent confidentielles (aucune pub de notre part ou d’un tiers).\n\n" +
                "Si vous êtes à la recherche, nous vous fournirons un lien vers un site web personnalisé affichant des propriétés selon vos critères.\n\n" +
                "Libre à vous de donner les bonnes informations et libre à nous de répondre à vos questions.\n\n" +
                "Commençons par votre prénom SVP ?",
            en: "We now wish to answer your questions, before we begin, we kindly ask for a few details used strictly for follow-up or statistical purposes. " +
                "Your information will remain confidential (no advertising from us or any third party).\n\n" +
                "If you are searching, we will provide you with a link to a customized website displaying properties according to your criteria.\n\n" +
                "Let's start with your first name please?"
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
            fr: "Souhaitez-vous qu’un membre de notre équipe vous contacte, choisir la bonne option: \n\n1 pour oui\n2 pour non",
            en: "Would you like someone from our team to contact you, pick your option: \n\n1 for yes \n\n2 for no)",
        },

        propertyUsage: {
            fr: "S'agit-il d'une propriété à revenus ayant plus d'un logement ? Choisir la bonne option: \n1 = propriété à revenus\n2 = personnel",
            en: "Is this an income property with more than one apartment? Pick your option: \n\n1 for yes \n2 for no)",
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
        ? "Hello, I'm CasaNova, your virtual assistant powered by artificial intelligence.\n\n" +
        "You may ask questions about our services or anything related to real estate in Quebec.\n" +
        "You may also ask about real estate approximate prices for neighborhoods or addesses in the greater Montreal.\n" +
        "My responses are for informational purposes only and may contain errors.\n\n" +
        "They should never replace the advice of a qualified professional.\n\n" +
        "Now to help me assist you better, which option best describes your intent: \n\n1 = buy \n2 = sell \n3 = rent out \n4 = other"
        : "Bonjour, je suis CasaNova, un assistant virtuel propulsé par l’intelligence artificielle.\n" +
        "Vous pouvez me poser des questions sur nos services ou tout ce qui concerne le domaine de l'immobilier au Québec.\n" +
        "Vous pouvez aussi me questionner sur les prix approximatifs de l'immobilier pour un quartier ou adresse donnée du grand Montréal.\n" +
        "Mes réponses sont fournies à titre informatif seulement et peuvent contenir des erreurs.\n" +
        "Elles ne remplacent en aucun cas les conseils d’un professionnel qualifié.\n\n" +
        "Afin de mieux vous assister, quelle option numérique vous décrit le mieux : \n\n1 = acheter \n2 = vendre \n3 = offrir en location \n4 = autre raison";
}

module.exports = {
    questions,
    getPromptForSpec,
    getPromptForProjectType
};
