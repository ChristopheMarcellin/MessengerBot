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
            fr: "Afin de répondre à vos questions, nous aimerions mieux vous connaître.\n\n" +
                "Vos infos sont confidentielles et servent à des fins statistiques (aucune pub de notre part ou d’un tiers).\n\n" +
                "Une FAUSSE DÉCLARATION peut entraîner la SUSPENSION de votre accès à ce service vraiment unique et exceptionnel\n\n" +
                "Voici quelques exemples de services que CasaNova peut vous rendre dans le domaine exclusif de l'immobilier au Québec: \n\n" + 
                "1-Répondre à vos questions légales\n2-Vous donner une opinion\n3-Vous alerter en temps réel des propriétés en vente que vous recherchez via un site web personnalisé \n" +
                "4-Vous informer sur nos services"+
                "Voici quelques exemples de services offerts via CasaNova: \n\n1-Réponses à vos questions légales\n\n2-Questions à vos demandes d'opinion \n\n\n" +
                "Commençons par votre prénom SVP ?",
            en: "In order to answer your questions, we would like to know you better.\n\n" +
                "Your information is confidential and used for statistical purposes only (no advertising from us or any third party).\n\n" +
                "A FALSE STATEMENT may result in the SUSPENSION of your access to this truly unique and exceptional service.\n\n" +
                "Here are some examples of services CasaNova can provide you in the exclusive field of Quebec Real Estate:\n\n" +
                "1-Answering your legal questions\n2-Giving you an opinion\n3-Alerting you in real time about properties for sale that match your search via a personalized website\n" +
                "4-Provide price estimates for an address\n5-Informing you about our services" +
                "Here are some examples of services offered through CasaNova:\n\n1-Answers to your legal questions\n\n2-Responses to your opinion requests\n\n\n" +
                "Let's start with your first name, please?"
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
        ? "Hello, I'm CasaNova, your virtual assistant powered by AI.\n\n" +
        "To better help you, which option represents you best: \n\n1 (buy)\n2 (sell) \n3 (rent out) \n4 (I have questions)"
        : "Bonjour, je suis CasaNova, votre assistant propulsé par l’IA.\n" +
        "Afin de mieux vous assister, quelle intention vous décrit le mieux : \n\n1 (acheter) \n2 (vendre) \n3 (offrir en location)\n4 (J'ai des questions)";
}

module.exports = {
    questions,
    getPromptForSpec,
    getPromptForProjectType
};
