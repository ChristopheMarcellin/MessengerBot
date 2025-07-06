const questions = {
    B: {
        price: {
            en: "Do you have a budget in mind (for example answer 350 for 350 000, 600 for 600 000 or 1000 for 1 000 000)?",
            fr: "Avez-vous un budget en tête (par exemple, dites 350 pour 350 000, 600 pour 600 000 ou 1000 pour 1 000 000) ?",
        },
        bedrooms: {
            en: "How many bedrooms minimum would you be looking for (provide a number only please)?",
            fr: "Combien de chambres au minimum souhaiteriez-vous (fournir un nombre seulement SVP) ?",
        },
        bathrooms: {
            en: "How many bathrooms minimum would you need (provide a number only please)?",
            fr: "Combien de salles de bains souhaitez-vous (fournir un nombre seulement SVP) ?",
        },
        garage: {
            en: "Do you need a garage - If so, how many minimum, if not enter 0 (provide a number only please) ?",
            fr: "Avez-vous besoin d’un garage - Si oui, combien au minimum, si non indiquer 0 (fournir un nombre SVP) ?",
        },
        location: {
            en: "Which city or neighborhood(s) would be your ideal target?",
            fr: "Dans quelle ville, quartier(s) serait votre cible idéale ?",
        },
    },
    S: {
        price: {
            en: "Do you have an approximate selling price in mind, what is it (for example answer 350 for 350 000, 600 for 600 000 or 1000 for 1 000 000)?",
            fr: "Avez-vous un prix de vente approximatif en tête, quel est-il (par exemple, dites 350 pour 350 000, 600 pour 600 000 ou 1000 pour 1 000 000? ",
        },
        bedrooms: {
            en: "How many bedrooms minimum would you be looking for (provide a number only please)?",
            fr: "Combien de chambres au minimum souhaiteriez-vous (fournir un nombre seulement SVP) ?",
        },
        bathrooms: {
            en: "How many bathrooms minimum would you need (provide a number only please)?",
            fr: "Combien de salles de bains souhaitez-vous (fournir un nombre seulement SVP) ?",
        },
        garage: {
            en: "How many garage spaces do you have (provide a number only please)?",
            fr: "Combien d'espace garage avez-vous (fournir un nombre seulement SVP)) ?",
        },
        location: {
            en: "In which city/neighborhood your property is located ?",
            fr: "Dans quelle ville/quartier êtes vous situé ?",
        },
    },
    R: {
        price: {
            en: "What rental price target do you have in mind (monthly value, for example: for 2 thousands say 2000)?",
            fr: "Quel prix de location (mensuel) avez-vous en tête (Entrer une valeur numérique SVP, pour 2 milles dites 2000) ?",
        },
        bedrooms: {
            en: "How many bedrooms (provide a number only please)?",
            fr: "Combien de chambres au minimum souhaiteriez-vous (fournir un nombre seulement SVP) ?",
        },
        bathrooms: {
            en: "How many bathrooms (provide a number only please)?",
            fr: "Combien de salles de bains souhaitez-vous (fournir un nombre seulement SVP) ?",
        },
        parking: {
            en: "Do you have private parking space available, how many space(s) (provide a number only please)?",
            fr: "Avez-vous des places de stationnement privées, fournir un nombre seulement SVP) ?",
        },
        location: {
            en: "In which city/neighborhood are you located?",
            fr: "Dans quelle ville/quartier êtes vous situé ?",
        },
    },
    E: {},

    generic: {
        expectations: {
            fr: "Laisser connaître vos attentes :-). Vous pouvez préciser par exemple: piscine creusée (incontournable), foyer (souhaitable)? ",
            en: "Let us know about any other expectations you may have :-),  for example you may say: inground pool (must), fireplace(nice to have).",
        },
        wantsContact: {
            fr: "Souhaitez-vous qu’un membre de notre équipe vous contacte ? (1-oui, 2-non)",
            en: "Would you like someone from our team to contact you? (1-yes, 2-no)",
        },
        firstName: {
            fr: "Nous offrons grâcieusement aux chercheurs de propriétés un site web qui présente les propriétés qui rencontrent vos exigences \n\n" +
                "Votre information est totalement confidentielle et ne sera utilisée que s'il est nécessaire de vous joindre"+
                "Afin de vous contacter au besoin ou simplement pour nos dossiers libre à vous de nous fournir les informations qui suivent. \n \n" ,

            en: "For our records, What is your first name please ?",
        },
        lastName: {
            fr: "Nom de famille ?",
            en: "Your last name?",
        },
        phone: {
            fr: "À quel numéro de téléphone pouvons nous vous joindre ?",
            en: "What is your phone number?",
        },
        email: {
            fr: "Quelle est votre adresse courriel ?",
            en: "What is your email address?",
        },
        propertyUsage: {
            fr: "S'agit-il d'une propriété à revenus ayant plus d'un logement ? (1-oui, 2-non)",
            en: "Is this an income property with more than one apartment? (1-yes, 2-no)",
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
        ? "Hello, thank you for contacting us, before going any further, help us understand the context of your inquiry. Are you planning to: 1-buy, 2-sell, 3-rent, 4-other? Please provide the option number."
        : "Bonjour, merci de nous contacter, afin de bien vous aider permettez-nous de comrprendre le contexte de votre démarche. Prévoyez-vous: 1-acheter, 2-vendre, 3-offrir en location, 4-autre raison ?\n(SVP, répondre avec le chiffre correspondant.)";
}

module.exports = {
    questions,
    getPromptForSpec,
    getPromptForProjectType
};
