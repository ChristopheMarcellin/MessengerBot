const xlsx = require("xlsx");
const path = require("path");
const readline = require("readline");

// === CONFIGURATION ===

const filePath = path.join(__dirname, "statsPrixMaster.xlsx");
const sheetName = "Prix";

// === NORMALISER TEXTE GÉNÉRAL ===
function normalizeText(value) {
    if (!value) return "";

    return value
        .toString()
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

// === NORMALISER NOM DE RUE ===
function normalizeStreetName(value) {
    if (!value || value === "?") return "";

    return value
        .toString()
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")          // accents
        .replace(/\bSAINTE\b/g, "STE")
        .replace(/\bSAINT\b/g, "ST")
        .replace(/\bSAINTE-/g, "STE ")
        .replace(/\bSAINT-/g, "ST ")
        .replace(/\./g, " ")                      // Av. -> Av
        .replace(/['’]/g, " ")                    // apostrophes
        .replace(/-/g, " ")                       // traits d'union
        .replace(/\b(RUE|AV|AVENUE|BOUL|BOULEVARD|CH|CHEMIN|ALLEE|COTE|PLACE)\b/g, "")
        .replace(/\b(DE|DES|DU|D|L|LA|LE|LES)\b/g, "")
        .replace(/\b(O|OUEST)\b/g, "OUEST")
        .replace(/\b(E|EST)\b/g, "EST")
        .replace(/[^A-Z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// === CHARGER LE FICHIER EXCEL ===
function loadData() {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        throw new Error(`Onglet '${sheetName}' introuvable.`);
    }

    const json = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    return json.map(row => ({
        SearchCode: normalizeText(row["SearchCode"]),

        Rue: normalizeStreetName(row["rue"]),

        PrixMoyen: parseFloat(
            (row["PrixMoyen"] || "")
                .toString()
                .replace(/[^\d.,]/g, "")
                .replace(",", ".")
        )
    }))
        .filter(r =>
            r.SearchCode &&
            !isNaN(r.PrixMoyen)
        );
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
    knownSpecs = "S:M-P:1-V:0-B:1",
    rue
) {
    const data = loadData();

    const postalPrefix = normalizePostalCode(codePostal);

    console.log(`[DEBUG evalPrix] Code postal: ${codePostal}`);
    console.log(`[DEBUG evalPrix] Préfixe postal: ${postalPrefix}`);

    if (!postalPrefix) {
        console.log("[DEBUG evalPrix] Code postal invalide.");
        return {
            valeur: 0,
            type: "aucune donnée",
            nbValeurs: 0,
            precision: 0
        };
    }

    const cleanSpecs = (knownSpecs || "")
        .toString()
        .trim()
        .toUpperCase()
        .replace(/\?/g, "0");

    const searchCode = `${postalPrefix}-${cleanSpecs}`;
    const cleanRue = normalizeStreetName(rue);

    console.log(`[DEBUG evalPrix] Specs reçues: ${knownSpecs}`);
    console.log(`[DEBUG evalPrix] Specs normalisées: ${cleanSpecs}`);
    console.log(`[DEBUG evalPrix] Rue reçue: ${rue}`);
    console.log(`[DEBUG evalPrix] Rue normalisée: ${cleanRue}`);
    console.log(`[DEBUG evalPrix] SearchCode recherché: ${searchCode}`);

    // 1) Match plus précis : SearchCode + rue normalisée
    if (cleanRue) {
        const rueMatches = data.filter(r =>
            r.SearchCode === searchCode &&
            r.Rue === cleanRue
        );

        if (rueMatches.length > 0) {
            const prix = rueMatches[0].PrixMoyen;

            console.log(`[evalPrix] Match rue + searchcode trouvé (${rueMatches.length}) → ${prix} $/pc`);

            return {
                valeur: +prix.toFixed(2),
                type: "searchcode-rue",
                nbValeurs: rueMatches.length,
                precision: 3
            };
        }

        console.log(`[evalPrix] Aucun match rue + searchcode pour ${searchCode} / ${cleanRue}`);
    }

    // 2) Fallback : SearchCode seulement
    const matches = data.filter(r => r.SearchCode === searchCode);

    if (matches.length > 0) {
        const prix = matches[0].PrixMoyen;

        console.log(`[evalPrix] Match searchcode trouvé (${matches.length}) → ${prix} $/pc`);

        return {
            valeur: +prix.toFixed(2),
            type: "searchcode-exact",
            nbValeurs: matches.length,
            precision: 2
        };
    }

    console.log(`[DEBUG evalPrix] Aucune donnée pour ${searchCode}`);

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