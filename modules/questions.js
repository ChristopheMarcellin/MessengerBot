const questions = {
  B: {
    price: {
      en: "What is your budget?",
      fr: "Quel est votre budget ?",
    },
    bedrooms: {
      en: "How many bedrooms are you looking for?",
      fr: "Combien de chambres souhaitez-vous ?",
    },
    bathrooms: {
      en: "How many bathrooms do you need?",
      fr: "Combien de salles de bains souhaitez-vous ?",
    },
    garage: {
      en: "Do you need a garage? If so, how many?",
      fr: "Avez-vous besoin d’un garage ? Si oui, combien ?",
    },
    location: {
      en: "In which city or neighborhood?",
      fr: "Dans quelle ville ou quel quartier ?",
    },
  },
  S: {
    price: {
      en: "Do you have a selling price in mind, what is it?",
      fr: "Avez-vous un prix de vente en tête, quel est-il?",
    },
    bedrooms: {
      en: "How many bedrooms do you have?",
      fr: "Combien de chambre à coucher avez-vous ?",
    },
    bathrooms: {
      en: "How many bathrooms do you have?",
      fr: "Combien de salles de bains avez-vous ?",
    },
    garage: {
      en: "How many garage spots do you have?",
      fr: "Combien d'espace garage avez-vous ?",
    },
    location: {
      en: "In which city or neighborhood are you located?",
      fr: "Dans quelle ville ou quel quartier êtes vous situé ?",
    },
  },
  R: {
    price: {
      en: "What rental price target do you have in mind (monthly)?",
      fr: "Quel prix de location (mensuel) avez-vous en tête ?",
    },
    bedrooms: {
      en: "How many bedrooms do you have?",
      fr: "Combien de chambre à coucher avez-vous ?",
    },
    bathrooms: {
      en: "How many bathrooms do you have?",
      fr: "Combien de salles de bains avez-vous ?",
    },
    parking: {
      en: "Do you have private parking space, how many?",
      fr: "Avez-vous des places de stationnement privées, combien ?",
    },
    location: {
      en: "In which city or neighborhood are you located?",
      fr: "Dans quelle ville ou quel quartier êtes vous situé ?",
    },
  },
  E: {},
};

function getPromptForSpec(field, lang = 'fr', projectType = 'B') {
  return questions[projectType]?.[field]?.[lang] || `Veuillez fournir une valeur pour ${field}`;
}

function getPromptForProjectType(lang = 'fr') {
  return lang === 'en'
    ? "What is the purpose of your project: 1-buy, 2-sell, 3-rent, 4-other? Please answer with a number only."
    : "Avez-vous un projet immobilier en tête : 1-acheter, 2-vendre, 3-louer, 4-autre raison ?\n(Svp, répondre seulement par un chiffre.)";
}

module.exports = {
  getPromptForSpec,
  getPromptForProjectType
};
