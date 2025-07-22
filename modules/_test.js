const questions = {
    B: { price: {}, bedrooms: {}, bathrooms: {}, garage: {}, location: {} },
    S: { price: {}, bedrooms: {}, bathrooms: {}, garage: {}, location: {} },
    R: { price: {}, bedrooms: {}, bathrooms: {}, parking: {}, location: {} }
};

function getNextSpec(projectType, specValues = {}, askedSpecs = {}) {
    const puValue = specValues.propertyUsage;

    if (projectType === 'E' || puValue === 'E') return null;
    if (projectType === '?') return 'projectType';
    if (askedSpecs.propertyUsage === '?' || puValue === '?') return 'propertyUsage';

    const specBlock = questions[projectType] || {};
    const skipIfIncome = ['bedrooms', 'bathrooms', 'garage', 'parking'];

    for (const field of Object.keys(specBlock)) {
        if (puValue === 'income' && skipIfIncome.includes(field)) continue;
        const value = specValues[field];
        if (value === '?' || askedSpecs[field] !== true) {
            return field;
        }
    }

    return 'summary';
}

const tests = [
    // Déjà présents
    { label: "1. B + income → price", input: { projectType: 'B', specValues: { propertyUsage: 'income', price: '?', location: '?', bedrooms: '?' }, askedSpecs: {} }, expected: 'price' },
    { label: "2. B + income → location", input: { projectType: 'B', specValues: { propertyUsage: 'income', price: 500, location: '?', bedrooms: '?' }, askedSpecs: {} }, expected: 'location' },
    { label: "3. B + income → summary", input: { projectType: 'B', specValues: { propertyUsage: 'income', price: 500, location: 'MTL', bedrooms: '?' }, askedSpecs: { price: true, location: true } }, expected: 'summary' },
    { label: "4. B + residential → price", input: { projectType: 'B', specValues: { propertyUsage: 'residential', price: '?', bedrooms: '?', location: '?' }, askedSpecs: {} }, expected: 'price' },
    { label: "5. B + residential → bedrooms", input: { projectType: 'B', specValues: { propertyUsage: 'residential', price: 400, bedrooms: '?', location: '?' }, askedSpecs: { price: true } }, expected: 'bedrooms' },
    { label: "6. R + income → price", input: { projectType: 'R', specValues: { propertyUsage: 'income', price: '?', bedrooms: '?', parking: '?', location: '?' }, askedSpecs: {} }, expected: 'price' },
    { label: "7. R + income → summary", input: { projectType: 'R', specValues: { propertyUsage: 'income', price: 1000, location: 'MTL' }, askedSpecs: { price: true, location: true } }, expected: 'summary' },

    // Cas supplémentaires
    { label: "8. S + income → price", input: { projectType: 'S', specValues: { propertyUsage: 'income', price: '?', location: '?', bedrooms: '?' }, askedSpecs: {} }, expected: 'price' },
    { label: "9. S + income → location", input: { projectType: 'S', specValues: { propertyUsage: 'income', price: 900000, location: '?', bedrooms: '?' }, askedSpecs: { price: true } }, expected: 'location' },
    { label: "10. S + income → summary", input: { projectType: 'S', specValues: { propertyUsage: 'income', price: 900000, location: 'LAVAL' }, askedSpecs: { price: true, location: true } }, expected: 'summary' },
    { label: "11. S + residential → price", input: { projectType: 'S', specValues: { propertyUsage: 'residential', price: '?', bedrooms: '?', location: '?' }, askedSpecs: {} }, expected: 'price' },
    { label: "12. projectType = ? AND propertyUsage = ?", input: { projectType: '?', specValues: { propertyUsage: '?' }, askedSpecs: { propertyUsage: '?' } }, expected: 'projectType' },
    { label: "13. projectType = B, propertyUsage = ?", input: { projectType: 'B', specValues: { propertyUsage: '?' }, askedSpecs: { propertyUsage: '?' } }, expected: 'propertyUsage' },
    { label: "14. B + residential → toutes specs = E", input: { projectType: 'B', specValues: { propertyUsage: 'residential', price: 'E', bedrooms: 'E', bathrooms: 'E', garage: 'E', location: 'E' }, askedSpecs: { price: true, bedrooms: true, bathrooms: true, garage: true, location: true } }, expected: 'summary' },
    { label: "15. specValue = ?, asked = true → doit reposer", input: { projectType: 'B', specValues: { propertyUsage: 'residential', price: 400, bedrooms: '?', location: '?' }, askedSpecs: { price: true, bedrooms: true } }, expected: 'bedrooms' },
{ label: "16. projectType = undefined → comportement inattendu", input: { projectType: undefined, specValues: {}, askedSpecs: {} }, expected: 'projectType' }

];

for (const { label, input, expected } of tests) {
    const result = getNextSpec(input.projectType, input.specValues, input.askedSpecs);
    const pass = result === expected;
    console.log(`${pass ? '✅' : '❌'} ${label} → ${result}`);
}
