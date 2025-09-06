const questions = {

 B: {

        price: {

            en: `Do you have a budget in mind ? 

                Say: 

                350 (for 350 000), 
                600 (for 600 000) or 
                1200 (for 1 200 000) etc.`,
                            fr: `Avez-vous un budget en tête ? 

                Dites: 

                350 (pour 350 000), 
                600 (pour 600 000) ou 
                1200 (pour 1 200 000) etc.`,
             },

            bedrooms: {
                en: `How many bedrooms minimum? 

                (number only please)?`,
                fr: `Combien de chambres au minimum ? 

                (le nombre seulement SVP)`,
            },
            bathrooms: {
                en: `How many bathrooms minimum? 

                (a number only please)`,
                fr: `Combien de salles de bains minimum? 

            (le nombre seulement SVP)`,
            },
            garage: {
                en: `Do you need a garage - If so, how many minimum? 

                (provide a number only please, 0 for none) ?`,
                fr: `Avez-vous besoin d’un garage - Si oui, combien au minimum ? 

                (le nombre SVP, 0 pour aucun)`,
            },
            location: {
                en: `Which region, city or neighborhood(s) would be your ideal target?`,
                fr: `Quelle région, ville ou quartier(s) serait votre cible idéale ?`,
            },
        },
    S: {
       
        price: {
            en: `Do you have an approximate selling price in mind? 

            (say 350 for 350 000, 
            600 for 600 000 or 
            1200 for 1 200 000)`,

            fr: `Avez-vous un prix de vente approximatif en tête ? 

            (dites 350 pour 350 000, 
            600 pour 600 000 ou 
            1200 pour 1 200 000)`,
                    },
        bedrooms: {

            en: `How many bedrooms do you have? 

            (a number only please)`,

            fr: `Combien de chambres avez-vous ? 

            (un nombre seulement SVP)`,
        },

        bathrooms: {

            en: `How many bathrooms do you have? 

            (a number only please)`,

            fr: `Combien de salles de bains avez-vous ? 

            (un nombre seulement SVP)`,
        },

        garage: {

            en: `How many garage spaces do you have? 
                (a number only please)?`,

            fr: `Combien d'espace garage avez-vous ? 

                ( un nombre seulement SVP)`,
            },
            location: {
                en: `In which city/neighborhood your property is located ?`,
                fr: `Dans quelle ville/quartier êtes vous situé ?`,
            },
    },

    R: {

        price: {
            en: `What rental price target do you have in mind? 

    (enter 2000 for 2000/month)?`,
                fr: `Quel montant avez vous en tête? 

    (entrer 2000 pour 2000/mois) ?`,
            },
            bedrooms: {
                en: `How many bedrooms ? 

    (a number only please)`,
                fr: `Combien de chambres ? 

    (un nombre seulement SVP)`,
            },
            bathrooms: {
                en: `How many bathrooms? 

    (a number only please)`,
                fr: `Combien de salles de bains ?

    (un nombre seulement SVP)`,
            },
            parking: {
                en: `Do you have private parking space(s)? 

    (a number only please, 0 for none)?`,
                fr: `Avez-vous des places de stationnement privées ? 

    (un nombre seulement SVP, 0 pour aucun)`,
            },
            location: {
                en: `In which city/neighborhood are you located?`,
                fr: `Dans quelle ville/quartier êtes vous situé ?`,
            },
        },

 E: {},

 generic: {

     expectations: {
            fr: `Dictez vos attentes: 

    Par exemple: 

    -Je veux une piscine creusée (incontournable), 

    -Je veux un foyer (souhaitable), 

    -Je veux vendre sans garantie légale, etc.`,
                en: `Dicate your expectations: 

    For example you may say: 

    -Inground pool (a must), 
    -I'd like a Fireplace(nice to have). 
    -I need a home staging service`,
            },

    firstName: {
                fr: `Avant de répondre à vos questions, nous aimerions mieux vous connaître.

    *Vos informations sont confidentielles*, utilisées uniquement pour mieux vous servir et à des fins statistiques *(aucune publicité ni partage à des tiers)*. [Consulter notre politique de confidentialité](https://christophe-marcellin.c21.ca/contact/#politique)

    Pour garantir un service de qualité et contribuer à son amélioration, *l'exactitude de vos informations* vous assure un accès complet aux services de CasaNova lors de votre prochaine conversation et nous permet de vous joindre si nécessaire.

    Commençons par *votre prénom* SVP ?`,

                en: `Before addressing your questions, we would like to know you better.

    *Your information is confidential* and used only to better assist you and for statistical purposes *(no advertising or sharing with third parties)*. [View our Privacy Policy](https://christophe-marcellin.c21.ca/en/contact/#policy)

    To ensure quality service and contribute to its improvement, *the accuracy of your information* guarantees you full access to CasaNova's services during your next conversation and allows us to contact you if necessary.

    Let's start with *your first name*, please?`,
            },

            lastName: {
                fr: `Nom de famille ?`,
                en: `Your last name?`,
            },

            age: {
                fr: `Quel âge avez-vous SVP ?
    (chiffre seulement SVP)`,
                en: `What is your age please?
    (number only please)`,
            },

            phone: {
                fr: `À quel numéro de téléphone pouvons nous vous joindre ?`,
                en: `What is your phone number?`,
            },
            email: {
                fr: `Quelle est votre adresse courriel ?`,
                en: `What is your email address?`,
            },



            wantsContact: {
                fr: `Souhaitez-vous qu’un membre de notre équipe vous contacte, choisir la bonne option: 

                1 (oui)
                2 (non),`,
                            en: `Would you like someone from our team to contact you, pick your option: 

                1 for yes 

                2 for no`,
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
        ? `Hello, I’m CasaNova, your AI-powered assistant.\n\n
*I can provide you with valuable services* in the field of real estate in Quebec, such as:\n
📊 *Providing an estimate for a property in a neighborhood or for a specific address (estimates are more accurate within our area of service)*\n
🔢 *Performing a mortgage calculation*\n
🏠 *Creating a website with properties matching your criteria*\n
💬 *Giving you an informed opinion*\n
⚖️ *Answering your legal questions (Quebec)*\n
ℹ️ *Informing you about our services*\n\n
To better assist you, which option best describes you:\n
1 (buy)
2 (sell)
3 (rent out)
4 (I have questions)`
        : `Bonjour, je suis CasaNova, votre assistant propulsé par l’IA.\n\n
*Je peux vous rendre de précieux services* dans le domaine de l'immobilier au Québec, par exemple :\n
📊 *Vous fournir un estimé pour une propriété dans un quartier ou pour une adresse spécifique (nos estimés sont plus précis pour notre territoire)*\n
🔢 *Faire un calcul hypothécaire*\n
🏠 *Créer un site web avec les propriétés qui correspondent à vos critères*\n
💬 *Vous donner une opinion éclairée*\n
⚖️ *Répondre à vos questions légales (Québec)*\n
ℹ️ *Vous informer sur nos services*\n\n
Pour bien vous assister, quelle intention vous décrit le mieux :\n
1 (acheter)
2 (vendre)
3 (offrir en location)
4 (J'ai des questions)`;
}

function getPromptForPropertyUsage(lang = 'fr') {
    return lang === 'en'
        ? `Is the taget for income or a multi-unit dwelling??  

Pick your option:  
1 (yes)  
2 (no)`
        : `S'agit-il d'une propriété à revenus ou s'agit il d'un multi-logements ?  

Choisir la bonne option :  
1 (oui)  
2 (non)`;
}


module.exports = {
    questions,
    getPromptForSpec,
    getPromptForProjectType,
    getPromptForPropertyUsage,
};
