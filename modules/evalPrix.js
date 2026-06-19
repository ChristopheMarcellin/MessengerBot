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

    if (!sheet) {
        throw new Error(`Onglet '${sheetName}' introuvable.`);
    }

    const json = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    const data = json.map(row => ({
        SearchCode: (row["SearchCode"] || "")
            .toString()
            .trim()
            .toUpperCase(),

        PrixComparables: parseFloat(
            (row["PrixComparables"] || "")
                .toString()
                .replace(/[^\d.,]/g, "")
                .replace(",", ".")
        )
    }))
        .filter(r =>
            r.SearchCode &&
            !isNaN(r.PrixComparables)
        );

    return data;
}

// === NORMALISER LE CODE POSTAL ===
function normalizePostalCode(cp) {
    if (!cp) return null;

    return cp
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 3);
}


// === EVALUATION ===
function evalPrix(
    codePostal,
    knownSpecs = "S:M-P:1-V:0-B:1"
) {
    const data = loadData();

    const postalPrefix = normalizePostalCode(codePostal);

    console.log(`[evalPrix] Code postal: ${codePostal}`);
    console.log(`[evalPrix] Préfixe postal: ${postalPrefix}`);

    if (!postalPrefix) {
        console.log("[evalPrix] Code postal invalide.");
        return {
            valeur: 0,
            type: "aucune donnée",
            nbValeurs: 0,
            precision: 0
        };
    }

    const searchCode = `${postalPrefix}-${knownSpecs}`;

    console.log(`[evalPrix] SearchCode recherché: ${searchCode}`);

    const matches = data.filter(r => r.SearchCode === searchCode);

    if (matches.length > 0) {
        const prix = matches[0].PrixComparables;

        console.log(`[evalPrix] Match trouvé (${matches.length}) → ${prix} $/pc`);

        return {
            valeur: +prix.toFixed(2),
            type: "searchcode-exact",
            nbValeurs: matches.length,
            precision: 3
        };
    }

    console.log(`[evalPrix] Aucune donnée pour ${searchCode}`);

    return {
        valeur: 0,
        type: "aucune donnée",
        nbValeurs: 0,
        precision: 0
    };
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
