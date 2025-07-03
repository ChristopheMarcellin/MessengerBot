const questions = {
  B: {
    price: {
      en: "What kind of budget are you looking at in thousands (please provide a numeric answer, for example 500 for 500 000 or 1000 for 1 000 000)?",
      fr: "Quel serait votre budget en milliers (svp fournir une réponse numérique, par exemple 500 pour 500 000 ou 1000 pour 1 000 000) ?",
    },
    bedrooms: {
      en: "How many bedrooms minimum would you be looking for (numeric answer please)?",
      fr: "Combien de chambres au minimum souhaiteriez-vous (réponse numérique SVP) ?",
    },
    bathrooms: {
        en: "How many bathrooms minimum would you need (numeric answer please)?",
        fr: "Combien de salles de bains souhaitez-vous (réponse numérique SVP) ?",
    },
    garage: {
        en: "Do you need a garage - If so, how many minimum, if not enter 0 (numeric answer please) ?",
        fr: "Avez-vous besoin d’un garage - Si oui, combien au minimum, si non indiquer 0 (réponse numérique SVP) ?",
    },
    location: {
      en: "Which city or which neighborhood(s) would be your idea target?",
      fr: "Dans quelle ville ou quel(s) quartier(s) serait votre cible idéale ?",
    },
  },
  S: {
    price: {
          en: "Do you have a selling price in mind, what is it (numeric answer please)?",
      fr: "Avez-vous un prix de vente en tête, quel est-il?",
    },
    bedrooms: {
        en: "How many bedrooms do you have (numeric answer please)?",
        fr: "Combien de chambre à coucher avez-vous (réponse numérique SVP) ?",
    },
    bathrooms: {
        en: "How many bathrooms do you have (numeric answer please)?",
        fr: "Combien de salles de bains avez-vous (réponse numérique SVP) ?",
    },
    garage: {
        en: "How many garage spaces do you have (numeric answer please)?",
        fr: "Combien d'espace garage avez-vous (réponse numérique SVP) ?",
    },
    location: {
        en: "In which city / neighborhood are you located (numeric answer please)?",
        fr: "Dans quelle ville / quartier êtes vous situé (valeur numérique SVP) ?",
    },
  },
  R: {
    price: {
      en: "What rental price target do you have in mind (monthly value, for example: for 2 thousands say 2000)?",
      fr: "Quel prix de location (mensuel) avez-vous en tête (Entrer une valeur numérique SVP, pour 2 milles dites 2000) ?",
    },
    bedrooms: {
        en: "How many bedrooms do you have (numeric answer please)?",
      fr: "Combien de chambre à coucher avez-vous (valeur numérique SVP)?",
    },
    bathrooms: {
        en: "How many bathrooms do you have (numeric answer please)?",
        fr: "Combien de salles de bains avez-vous  (valeur numérique SVP) ?",
    },
    parking: {
        en: "Do you have private parking space available, how many space(s) (numeric answer please)?",
        fr: "Avez-vous des places de stationnement privées, combien (valeur numérique SVP) ?",
    },
    location: {
      en: "In which city/neighborhood are you located?",
      fr: "Dans quelle ville/quartier êtes vous situé ?",
    },
  },
    E: {},

    generic: {

        expectations: {
            fr: "Laisser savoir si vous avez d'autres attentes :-) en précisant ce qui est un souhait ou un incontournable, par exemple: piscine creusée (incontournable), foyer (souhaitable)? ",
            en: "If you have other specifications, list them next and mention if is a nice to have or a must, for example: inground pool (must), fireplace(nth).",
        },

        wantsContact: {
            fr: "Souhaitez-vous qu’un membre de notre équipe vous contacte ? (1-oui, 2-non)",
            en: "Would you like someone from our team to contact you? (1-yes, 2-no)",
        },


        firstName: {
            fr: "Pour nos dossiers, quel est votre prénom SVP ?",
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
    ? "Hello, thank you for contacting us, before going further, let us know if you have a real estate project in mind. We will provide you free of charge with a website that showcases properties that meet your criteria if you are on the market to buy. What are you planning: 1-buy, 2-sell, 3-rent, 4-other? Please provide the matching number only."
    : "Bonjour, merci de nous contacter, avant de poursuivre, laissez nous savoir si vous avez un projet immobilier en tête. Nous vous fournirons grâcieusement un site de propriétés à vendre selon vos critères de recherche si vous envisagiez d'acquérir.  Quel est votre plan : 1-acheter, 2-vendre, 3-offrir en location, 4-autre raison ?\n(SVP, répondre avec le chiffre correspondant.)";
}

module.exports = {
    questions,
  getPromptForSpec,
  getPromptForProjectType
};
