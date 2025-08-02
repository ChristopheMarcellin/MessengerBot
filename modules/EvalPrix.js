const xlsx = require("xlsx");
const path = require("path");
const readline = require("readline");

// === CONFIGURATION ===
const filePath = path.join(__dirname, "statsPrixMaster.xlsx"); 
const sheetName = "Prix"; // onglet

// === CHARGER LE FICHIER EXCEL ===
function loadData() {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error(`Onglet '${sheetName}' introuvable.`);
    const json = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    // Nettoyage et structuration
    const data = json.map(row => ({
        PC: parseFloat((row["$PC"] || "").toString().replace(/[^\d.,]/g, "").replace(",", ".")),
        CP6: (row["Code Postal"] || "").toString().toUpperCase().replace(/[^A-Z0-9]/g, ""),
        CP4: (row["CP4"] || "").toString().toUpperCase(),
        CP3: (row["CP3"] || "").toString().toUpperCase()
    })).filter(r => !isNaN(r.PC));
    console.log(`Données chargées : ${data.length} lignes valides.`);
    return data;
}

// === NORMALISER LE CODE POSTAL ===
function normalizePostalCode(cp) {
    if (!cp) return { cp6: null, cp4: null, cp3: null };
    const clean = cp.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return {
        cp6: clean.slice(0, 6),
        cp4: clean.slice(0, 4),
        cp3: clean.slice(0, 3)
    };
}

// === CALCULS ===
function medianeClassique(values) {
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}
function medianeHaute(values) {
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    const mediane = values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
    const upper = values.filter(v => v >= mediane);
    return upper.reduce((a, b) => a + b, 0) / upper.length;
}
function moyenne(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
}
function getValues(data, cp, gran) {
    const val = gran === "CP6" ? cp.cp6 : gran === "CP4" ? cp.cp4 : cp.cp3;
    return data.filter(r => r[gran] === val).map(r => r.PC);
}

// === EVALUATION ===
function evalPrix(codePostal) {
    const data = loadData();
    const cp = normalizePostalCode(codePostal);
    console.log(`Code postal saisi: ${codePostal} (normalisé: ${cp.cp6})`);

    const steps = [
        { gran: "CP6", min: 11, fn: medianeClassique, label: "mediane-classique-CP6" },
        { gran: "CP6", min: 5, fn: medianeHaute, label: "mediane-haute-CP6" },
        { gran: "CP4", min: 5, fn: medianeHaute, label: "mediane-haute-CP4" },
        { gran: "CP6", min: 3, fn: moyenne, label: "moyenne-CP6" },
        { gran: "CP4", min: 3, fn: moyenne, label: "moyenne-CP4" },
        { gran: "CP3", min: 5, fn: medianeHaute, label: "mediane-haute-CP3" },
        { gran: "CP3", min: 1, fn: moyenne, label: "moyenne-CP3" }
    ];

    for (const step of steps) {
        const values = getValues(data, cp, step.gran);
        console.log(`[DEBUG] ${step.label}: ${values.length} valeurs`);
        if (values.length >= step.min) {
            const val = step.fn(values);
            console.log(`[INFO] Utilisé: ${step.label} (${values.length} valeurs) → ${val.toFixed(2)} $/pc`);
            return { valeur: +val.toFixed(2), type: step.label, nbValeurs: values.length };
        }
    }

    console.log("[INFO] Aucune donnée suffisante trouvée.");
    return { valeur: 0, type: "aucune donnée", nbValeurs: 0 };
}

// === MODE INTERACTIF ===
if (require.main === module) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question("Entrez un code postal: ", (cp) => {
        console.log("Résultat :", evalPrix(cp));
        rl.close();
    });
}

module.exports = evalPrix;
