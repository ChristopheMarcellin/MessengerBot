// index.js (enhanced with specification engine, question limit, and debug logger)
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = 'helloworldtoken';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const userSessions = {};

function resetIncompleteSpecs(session) {
    for (const key in session.specValues) {
        if (key !== "projectType") {
            session.specValues[key] = "?";
            session.askedSpecs[key] = false;
        }
    }
}
function allSpecsCollected(session) {
    const requiredFields = Object.keys(SPEC_QUESTIONS).filter(k => k !== "projectType");
    return requiredFields.every(key => session.specValues[key] && session.specValues[key] !== "?");
}

const SPEC_QUESTIONS = {
    Pkg: {
        prompt: {
            en: "Do you have private parking available?",
            fr: "Avez-vous un stationnement privé disponible?"
        },
        decodePrompt: {
            en: "Respond with YES or NO based on whether the message confirms the availability of private parking.",
            fr: "Répondez par OUI ou NON selon que le message confirme la disponibilité d'un stationnement privé."
        },
        validValues: ["YES", "NO", "OUI", "NON"]
    },
    Bdr: {
        prompt: {
            en: "What is your ideal number of bedrooms?",
            fr: "Quel est votre nombre idéal de chambres?"
        },
        decodePrompt: {
            en: "Extract the number of bedrooms from the following sentence. Respond with only the number.",
            fr: "Extrayez le nombre de chambres à partir de la phrase suivante. Répondez uniquement avec le nombre."
        },
        validValues: []
    },
    Bth: {
        prompt: {
            en: "What is your ideal number of bathrooms?",
            fr: "Quel est votre nombre idéal de salles de bain?"
        },
        decodePrompt: {
            en: "Extract the number of bathrooms from the following sentence. Respond with only the number.",
            fr: "Extrayez le nombre de salles de bain à partir de la phrase suivante. Répondez uniquement avec le nombre."
        },
        validValues: []
    },
    Grg: {
        prompt: {
            en: "What is your ideal number of garages?",
            fr: "Quel est votre nombre idéal de garages?"
        },
        decodePrompt: {
            en: "Extract the number of garages from the following sentence. Respond with only the number.",
            fr: "Extrayez le nombre de garages à partir de la phrase suivante. Répondez uniquement avec le nombre."
        },
        validValues: []
    },
    price: {
        prompt: {
            en: "What is your budget?",
            fr: "Quel est votre budget?"
        },
        decodePrompt: {
            en: "Extract the budget amount from the following sentence. Respond with only the number.",
            fr: "Extrayez le montant du budget à partir de la phrase suivante. Répondez uniquement avec le nombre."
        },
        validValues: []
    },
    area: {
        prompt: {
            en: "Which area are you looking in?",
            fr: "Dans quel secteur cherchez-vous?"
        },
        decodePrompt: {
            en: "Extract the name of a city, neighborhood, or area from the following sentence. Respond with only the area name.",
            fr: "Extrayez le nom d'une ville, d'un quartier ou d'une zone à partir de la phrase suivante. Répondez uniquement avec le nom du secteur."
        },
        validValues: []
    },
    projectType: {
        prompt: {
            en: "May I ask what type of project you have in mind? Buying, selling, renting or something else?",
            fr: "Puis-je vous demander quel type de projet vous avez en tête ? Achat, vente, location ou autre ?"
        },
        decodePrompt: {
            en: "Classify the following answer as B (buy), S (sell), R (rent), or E (else). Return only one uppercase letter.",
            fr: "Classez la réponse suivante comme B (achat), S (vente), R (location) ou E (autre). Retournez une seule lettre majuscule."
        },
        validValues: ["B", "S", "R", "E"]
    }
};
//part 3
// Unified response sender
async function sendMessage(senderId, text) {
    await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
        recipient: { id: senderId },
        message: { text }
    }, {
        headers: { 'Content-Type': 'application/json' }
    });
}

// Debug logger
function logSession(senderId) {
    const s = userSessions[senderId];
    console.log("[STEP 3] Detected Language:", s.language);
    console.log("[STEP 4] Detected Project Type:", s.specValues.projectType);
    console.log("[STEP 5] Question Count:", s.questionCount, "/", s.maxQuestions);
}

// Check and handle specification
async function handleSpecification(senderId, specName, userMessage) {
    const session = userSessions[senderId];
    const spec = SPEC_QUESTIONS[specName];

    // Step 1: Check if we already have the value
    if (session.specValues[specName] !== undefined) {
        return; // Do nothing, just wait for next user input
    }

    // Step 2: If we already asked but no value yet, try to interpret the reply
    if (session.askedSpecs[specName]) {
        const decodePrompt = `${spec.decodePrompt[session.language]}\n\n"${userMessage}"`;
        const decodeRes = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [{ role: "user", content: decodePrompt }],
            max_tokens: 10,
            temperature: 0
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });

        const raw = decodeRes.data.choices?.[0]?.message?.content?.trim().toUpperCase();
        const isValid = spec.validValues.length === 0 || spec.validValues.includes(raw);
        session.specValues[specName] = isValid ? raw : "?";

        if (isValid) return;

        const retry = session.language === "fr"
            ? "Désolé, je n'ai pas compris. Pouvez-vous clarifier ?"
            : "Sorry, I didn’t understand. Could you clarify?";
        return await sendMessage(senderId, retry);
    }

    // Step 3: Ask the question (first time)
    session.askedSpecs[specName] = true;
    return await sendMessage(senderId, spec.prompt[session.language]);
}
//part 4
// Main webhook handler
app.post('/webhook', async (req, res) => {
    try {
        const messagingEvent = req.body.entry?.[0]?.messaging?.[0];
        if (!messagingEvent || messagingEvent.message?.is_echo || messagingEvent.delivery || messagingEvent.read) {
            return res.status(200).send('EVENT_RECEIVED');
        }

        const senderId = messagingEvent.sender?.id;
        const receivedMessage = messagingEvent.message?.text;

        if (!receivedMessage || !senderId) return res.status(200).send('EVENT_RECEIVED');

        // END SESSION command logic
        if (receivedMessage.toLowerCase().includes("end session")) {
            delete userSessions[senderId];
            console.log(`[RESET] Session ended for sender: ${senderId}`);
            return res.status(200).send('EVENT_RECEIVED');
        }

        console.log("[STEP 1] Sender ID:", senderId);
        console.log("[STEP 2] Received Message:", receivedMessage);

        // Create session if it doesn't exist
        if (!userSessions[senderId]) {
            // Detect language and project type initially
            const detectionPrompt = `Detect the user's language and intent. Return JSON with "language": "en/fr" and "project": "B/S/R/E".\n\n"${receivedMessage}"`;
            const detectionResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-4o",
                messages: [{ role: "user", content: detectionPrompt }],
                max_tokens: 100,
                temperature: 0.3
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                }
            });

            let detectionText = detectionResponse.data.choices?.[0]?.message?.content || "{}";
            detectionText = detectionText.replace(/```json|```/g, "").trim();

            let language = "en", project = "E";
            try {
                const parsed = JSON.parse(detectionText);
                language = parsed.language || "en";
                project = parsed.project || "E";
            } catch { }

            userSessions[senderId] = {
                language,
                ProjectDate: new Date().toISOString(),
                questionCount: 0,
                maxQuestions: 40,
                askedSpecs: {},
                specValues: {}
            };

            if (["B", "S", "R"].includes(project)) {
                userSessions[senderId].specValues.projectType = project;
                userSessions[senderId].askedSpecs.projectType = true;
            }
        }

        const session = userSessions[senderId];
        logSession(senderId);
        //part 5
        // If projectType has never been asked, ask it once regardless of GPT count
        if (!session.askedSpecs.projectType) {
            await handleSpecification(senderId, "projectType", receivedMessage);
            return res.status(200).send('EVENT_RECEIVED');
        }

        // Question limit check
        if (session.questionCount >= session.maxQuestions) {
            const limitMsg = session.language === "fr"
                ? "Limite atteinte temporairement."
                : "Limit exceeded temporarily.";
            await sendMessage(senderId, limitMsg);
            return res.status(200).send('EVENT_RECEIVED');
        }

        // Ask specification questions in order
        const order = ["area", "price", "Bdr", "Bth", "Grg", "Pkg"];
        for (const specKey of order) {
            const isForRent = session.specValues.projectType === "R";
            const shouldAskPkg = specKey === "Pkg" && !isForRent;
            if (specKey === "Pkg" && !isForRent) continue;

            if (!session.askedSpecs[specKey]) {
                await handleSpecification(senderId, specKey, receivedMessage);
                return res.status(200).send('EVENT_RECEIVED');
            }
        }

        // If all specs collected, summarize
        if (!session.completedSpecs && allSpecsCollected(session)) {
            session.completedSpecs = true;
            const summaryLines = Object.entries(session.specValues).map(([k, v]) => `${k}: ${v}`);
            const summary = summaryLines.join("\n");
            const prompt = session.language === "fr"
                ? `Voici ce que j'ai compris :\n${summary}\nY a-t-il des erreurs ou des informations manquantes ?`
                : `Here’s what I’ve gathered so far:\n${summary}\nIs anything incorrect or missing?`;
            await sendMessage(senderId, prompt);
            return res.status(200).send('EVENT_RECEIVED');
        }

        // After summary, handle yes/no
        if (session.completedSpecs && receivedMessage.toLowerCase().includes("no")) {
            resetIncompleteSpecs(session);
            await sendMessage(senderId, session.language === "fr"
                ? "Merci de nous l'avoir signalé. Reprenons les informations manquantes."
                : "Thanks for letting us know. Let's go over the missing details again.");
            session.completedSpecs = false;
            return res.status(200).send('EVENT_RECEIVED');
        }

        if (session.completedSpecs && receivedMessage.toLowerCase().includes("yes")) {
            session.wantsContact = "Y";
            session.signoffStep = "firstName";
            await sendMessage(senderId, session.language === "fr"
                ? "Merci. Pouvez-vous me donner votre prénom ?"
                : "Thank you. Can you please tell me your first name?");
            return res.status(200).send('EVENT_RECEIVED');
        }

        // Handle contact info flow
        if (session.signoffStep) {
            const step = session.signoffStep;
            const value = receivedMessage.trim();
            if (!session.contactInfo) session.contactInfo = {};
            if (step === "firstName") {
                session.contactInfo.firstName = value;
                session.signoffStep = "lastName";
                await sendMessage(senderId, session.language === "fr" ? "Quel est votre nom de famille ?" : "What is your last name?");
            } else if (step === "lastName") {
                session.contactInfo.lastName = value;
                session.signoffStep = "phone";
                await sendMessage(senderId, session.language === "fr" ? "Quel est votre numéro de téléphone ?" : "What is your phone number?");
            } else if (step === "phone") {
                session.contactInfo.phone = value;
                session.signoffStep = "email";
                await sendMessage(senderId, session.language === "fr" ? "Quel est votre courriel ?" : "What is your email?");
            } else if (step === "email") {
                session.contactInfo.email = value;
                session.signoffStep = "message";
                await sendMessage(senderId, session.language === "fr" ? "Souhaitez-vous ajouter un message ?" : "Would you like to add a message?");
            } else if (step === "message") {
                session.contactInfo.message = value;
                delete session.signoffStep;
                await sendMessage(senderId, session.language === "fr"
                    ? "Merci ! Nous vous contacterons dans les prochaines 24 heures. Vous pouvez continuer à poser vos questions si vous le souhaitez."
                    : "Thank you! We'll contact you within 24 hours. You may continue asking questions if you like.");
            }
            return res.status(200).send('EVENT_RECEIVED');
        }
        //part 6
        // Fallback: ChatGPT response if no other handlers triggered
        session.questionCount++;
        const chatGptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [{ role: "user", content: receivedMessage }],
            max_tokens: 400,
            temperature: 0.5
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });

        let gptReply = chatGptResponse.data.choices?.[0]?.message?.content?.trim();

        if (!gptReply) {
            gptReply = session.language === "fr"
                ? "Désolé, je n'ai pas compris votre demande."
                : "Sorry, I didn't understand your request.";
        }

        await sendMessage(senderId, gptReply);
        res.status(200).send('EVENT_RECEIVED');

    } catch (error) {
        console.error("[ERROR]", error.toString());
        res.status(500).send('Server Error');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[INIT] Server running on port ${PORT}`));
