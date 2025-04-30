// modules/specEngine.js

const specQuestions = {
  projectType: "Quel est le type de projet ? (Achat, Vente, Location, Évaluation)",
  budget: "Quel est votre budget ?",
  rooms: "Combien de chambres souhaitez-vous ?",
  garage: "Avez-vous besoin d’un garage ? Si oui, combien ?",
};

const getNextUnansweredSpec = (session) => {
  return Object.keys(specQuestions).find((key) => !session[key]);
};

const shouldAskNextSpec = (session) => {
  return !!getNextUnansweredSpec(session);
};

const updateSpecFromInput = (field, decodedValue, session) => {
  session[field] = decodedValue || "?";
};

const buildSpecSummary = (session) => {
  return `Voici ce que j’ai compris :
- Type de projet : ${session.projectType || "?"}
- Budget : ${session.budget || "?"}
- Chambres : ${session.rooms || "?"}
- Garage : ${session.garage || "?"}
Est-ce que tout est correct ?`;
};

const resetInvalidSpecs = (session) => {
  for (let key of Object.keys(specQuestions)) {
    if (session[key] === "?") {
      delete session[key];
    }
  }
};

module.exports = {
  specQuestions,
  getNextUnansweredSpec,
  shouldAskNextSpec,
  updateSpecFromInput,
  buildSpecSummary,
  resetInvalidSpecs,
};
