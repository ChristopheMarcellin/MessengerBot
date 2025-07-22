const detectLanguageFromText = (text) => {
    if (typeof text !== "string") return 'fr';

    const lower = text.toLowerCase();

    const isFrench = /[àâçéèêëîïôûùüÿœæ]/i.test(text) ||
        /\b(le|la|est|une|bonjour|je|j’|ça|tu|vous|avec|maison|acheter|vendre|salut|allo|propriété)\b/i.test(lower);

    const isEnglish = /\b(the|hello|hi|i|want|house|buy|sell|rent|please|property|how|do|you)\b/i.test(lower);

    if (isFrench) return 'fr';
    if (isEnglish) return 'en';

    return 'fr';
};

function detectLanguageFromText1(text) {
    if (typeof text !== "string") return 'fr'; // sécurité minimale

    const isFrench = /[àâçéèêëîïôûùüÿœæ]/i.test(text) ||
        /\b(le|la|est|une|bonjour|je|j’|ça|tu|vous|avec|maison|acheter|vendre|salut|allo|propriété)\b/i.test(text);

    return isFrench ? 'fr' : 'en';
}



console.log(detectLanguageFromText("hello how do you do my friend ?"));
console.log(detectLanguageFromText1("hello how do you do my friend ?"));