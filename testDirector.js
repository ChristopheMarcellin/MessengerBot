const { runDirector } = require('./modules/director');
const { getSpecFieldsForProjectType } = require('./modules/specEngine');
console.log('[DEBUG] Champs attendus :', getSpecFieldsForProjectType('B'));

// 🧪 === DÉFINIS ICI MANUELLEMENT TES VARIABLES DE SESSION ===
const session = {
  projectType: 'R',
  specValues: {
    price: '1000',
    bedrooms: '1',
    bathrooms: '1',
    parking: '1',
    location: 'montreal'
  },
  askedSpecs: {
    price: true,
    bedrooms: true,
    bathrooms: true,
    parking: true,
    location: true
  },
  currentSpec: null,
  summarySent: false,
};

// Le message est requis par l'interface du directeur mais ici on peut le laisser vide
const message = '';

const context = {
  senderId: 'SIMULATED_USER_001',
  session,
  message,
};

// 🚀 Lance le test
(async () => {
  console.log('=== TEST DIRECTEUR AVEC SESSION MANUELLE ===');
  await runDirector(context);
})();
