require('dotenv').config();
const {
    getNextUnansweredSpec,
    shouldAskNextSpec,
    updateSpecFromInput,
    buildSpecSummary,
    resetInvalidSpecs,
    getPromptForSpec,
} = require('./modules/specEngine');

const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = 'helloworldtoken';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const userSessions = {};

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

function resetIncompleteSpecs(session) {
    for (const key in session.specValues) {
        if (key !== "projectType") {
            session.specValues[key] = "?";
            session.askedSpecs[key] = false;
        }
    }
}

function allSpecsCollected(session) {
    return !shouldAskNextSpec(session.specValues, SPEC_QUESTIONS);
}

async function tryToClassifyProjectType(session, userMessage) {
    const classificationPrompt = `${SPEC_QUESTIONS.projectType.decodePrompt[session.language]}\n\n"${userMessage}"`;
    const classifyRes = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o",
        messages: [{ role: "user", content: classificationPrompt }],
        max_tokens: 10,
        temperature: 0
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
    });

    const raw = classifyRes.data.choices?.[0]?.message?.content?.trim().toUpperCase();
    if (["B", "S", "R"].includes(raw)) {
        updateSpecFromInput("projectType", raw, session.specValues);
    } else {
        updateSpecFromInput("projectType", "E", session.specValues);
    }
    session.askedSpecs.projectType = true;
    delete session.awaitingProjectType;
}

async function sendMessage(senderId, text) {
    await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
        recipient: { id: senderId },
        message: { text }
    }, {
        headers: { 'Content-Type': 'application/json' }
    });
}

app.post('/webhook', async (req, res) => {
    try {
        const messagingEvent = req.body.entry?.[0]?.messaging?.[0];
        if (!messagingEvent || messagingEvent.message?.is_echo || messagingEvent.delivery || messagingEvent.read) {
            return res.status(200).send('EVENT_RECEIVED');
        }

        const senderId = messagingEvent.sender?.id;
        const receivedMessage = messagingEvent.message?.text?.trim();
        if (!receivedMessage || !senderId) return res.status(200).send('EVENT_RECEIVED');

        // Handle end session (set skip flag)
        if (receivedMessage.toLowerCase().includes("end session")) {
            if (userSessions[senderId]?.skipNextMessage) {
                // Already marked, prevent repeat
                return res.status(200).send('EVENT_RECEIVED');
            }

            userSessions[senderId] = {
                skipNextMessage: true,
                language: "en",
                specValues: {},
                askedSpecs: {}
            };
            console.log(`[RESET] Session ended for sender: ${senderId}`);
            return res.status(200).send('EVENT_RECEIVED');
        }
        // Skip next message silently
        if (userSessions[senderId]?.skipNextMessage) {
            delete userSessions[senderId];
            return res.status(200).send('EVENT_RECEIVED');
        }

        if (!userSessions[senderId]) {
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

            let language = "en", project = "?";
            try {
                const parsed = JSON.parse(detectionText);
                language = parsed.language || "en";
                project = parsed.project;
                if (!["B", "S", "R"].includes(project)) project = "?";
            } catch { }

            userSessions[senderId] = {
                language,
                ProjectDate: new Date().toISOString(),
                questionCount: 1,
                maxQuestions: 40,
                askedSpecs: {},
                specValues: {
                    projectType: project
                }
            };
        }

        const session = userSessions[senderId];

        if (session.awaitingProjectType && !session.askedSpecs.projectType) {
            await tryToClassifyProjectType(session, receivedMessage);
            return res.status(200).send('EVENT_RECEIVED');
        }

        if (!session.askedSpecs.projectType && session.specValues.projectType === "?") {
            const gptReply = await axios.post('https://api.openai.com/v1/chat/completions', {
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

            const content = gptReply.data.choices?.[0]?.message?.content?.trim();
            await sendMessage(senderId, content || (session.language === "fr"
                ? "Désolé, je n'ai pas compris votre demande."
                : "Sorry, I didn't understand your request."));

            const politePrompt = session.language === "fr"
                ? "Puis-je vous demander quel type de projet vous avez en tête ? Achat, vente, location ou autre ?"
                : "May I ask what type of project you have in mind? Buying, selling, renting, or something else?";
            await sendMessage(senderId, politePrompt);
            session.awaitingProjectType = true;
            return res.status(200).send('EVENT_RECEIVED');
        }

        // [continues with spec handling, contact, fallback, etc...]
        // I’ve truncated here to focus on the session reset fix — let me know if you want the full tail again
    } catch (error) {
        console.error("[ERROR]", error.toString());
        res.status(500).send('Server Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[INIT] Server running on port ${PORT}`));
app.post('/webhook', async (req, res) => {
    try {
        const messagingEvent = req.body.entry?.[0]?.messaging?.[0];
        if (!messagingEvent || messagingEvent.message?.is_echo || messagingEvent.delivery || messagingEvent.read) {
            return res.status(200).send('EVENT_RECEIVED');
        }

        const senderId = messagingEvent.sender?.id;
        const receivedMessage = messagingEvent.message?.text?.trim();
        if (!receivedMessage || !senderId) return res.status(200).send('EVENT_RECEIVED');

        // Handle end session (set skip flag)
        if (receivedMessage.toLowerCase().includes("end session")) {
            userSessions[senderId] = {
                skipNextMessage: true,
                language: "en",
                specValues: {},
                askedSpecs: {}
            };
            console.log(`[RESET] Session ended for sender: ${senderId}`);
            return res.status(200).send('EVENT_RECEIVED');
        }

        // Skip next message silently
        if (userSessions[senderId]?.skipNextMessage) {
            delete userSessions[senderId];
            return res.status(200).send('EVENT_RECEIVED');
        }

        // Initialize session
        if (!userSessions[senderId]) {
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

            let language = "en", project = "?";
            try {
                const parsed = JSON.parse(detectionText);
                language = parsed.language || "en";
                project = parsed.project;
                if (!["B", "S", "R"].includes(project)) project = "?";
            } catch { }

            userSessions[senderId] = {
                language,
                ProjectDate: new Date().toISOString(),
                questionCount: 1,
                maxQuestions: 40,
                askedSpecs: {},
                specValues: {
                    projectType: project
                }
            };
        }

        const session = userSessions[senderId];

        if (session.awaitingProjectType && !session.askedSpecs.projectType) {
            await tryToClassifyProjectType(session, receivedMessage);
            return res.status(200).send('EVENT_RECEIVED');
        }

        if (!session.askedSpecs.projectType && session.specValues.projectType === "?") {
            const gptReply = await axios.post('https://api.openai.com/v1/chat/completions', {
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

            const content = gptReply.data.choices?.[0]?.message?.content?.trim();
            await sendMessage(senderId, content || (session.language === "fr"
                ? "Désolé, je n'ai pas compris votre demande."
                : "Sorry, I didn't understand your request."));

            const politePrompt = session.language === "fr"
                ? "Puis-je vous demander quel type de projet vous avez en tête ? Achat, vente, location ou autre ?"
                : "May I ask what type of project you have in mind? Buying, selling, renting, or something else?";
            await sendMessage(senderId, politePrompt);
            session.awaitingProjectType = true;
            return res.status(200).send('EVENT_RECEIVED');
        }

        if (session.questionCount >= session.maxQuestions) {
            const msg = session.language === "fr"
                ? "Limite atteinte temporairement."
                : "Limit exceeded temporarily.";
            await sendMessage(senderId, msg);
            return res.status(200).send('EVENT_RECEIVED');
        }

        const nextSpec = getNextUnansweredSpec(session.specValues, SPEC_QUESTIONS);
        const isForRent = session.specValues.projectType === "R";

        if (nextSpec && (nextSpec !== "Pkg" || !isForRent)) {
            const decodePrompt = `${SPEC_QUESTIONS[nextSpec].decodePrompt[session.language]}\n\n"${receivedMessage}"`;
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
            const isValid = SPEC_QUESTIONS[nextSpec].validValues.length === 0 || SPEC_QUESTIONS[nextSpec].validValues.includes(raw);
            updateSpecFromInput(nextSpec, isValid ? raw : "?", session.specValues);
            session.askedSpecs[nextSpec] = true;

            if (!isValid) {
                const retry = session.language === "fr"
                    ? "Désolé, je n'ai pas compris. Pouvez-vous clarifier ?"
                    : "Sorry, I didn’t understand. Could you clarify?";
                await sendMessage(senderId, retry);
            } else {
                const next = getNextUnansweredSpec(session.specValues, SPEC_QUESTIONS);
                if (next && (next !== "Pkg" || !isForRent)) {
                    const prompt = getPromptForSpec(next, session.language, SPEC_QUESTIONS);
                    session.askedSpecs[next] = true;
                    await sendMessage(senderId, prompt);
                }
            }
            return res.status(200).send('EVENT_RECEIVED');
        }

        if (!session.completedSpecs && allSpecsCollected(session)) {
            session.completedSpecs = true;
            const summary = buildSpecSummary(session.specValues);
            await sendMessage(senderId, summary);
            return res.status(200).send('EVENT_RECEIVED');
        }

        if (session.completedSpecs && receivedMessage.toLowerCase().includes("no")) {
            resetIncompleteSpecs(session);
            session.completedSpecs = false;
            await sendMessage(senderId, session.language === "fr"
                ? "Merci de nous l'avoir signalé. Reprenons les informations manquantes."
                : "Thanks for letting us know. Let's go over the missing details again.");
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

        if (session.signoffStep) {
            const val = receivedMessage.trim();
            if (!session.contactInfo) session.contactInfo = {};

            if (session.signoffStep === "firstName") {
                session.contactInfo.firstName = val;
                session.signoffStep = "lastName";
                await sendMessage(senderId, session.language === "fr" ? "Quel est votre nom de famille ?" : "What is your last name?");
            } else if (session.signoffStep === "lastName") {
                session.contactInfo.lastName = val;
                session.signoffStep = "phone";
                await sendMessage(senderId, session.language === "fr" ? "Quel est votre numéro de téléphone ?" : "What is your phone number?");
            } else if (session.signoffStep === "phone") {
                const phone = val.replace(/\s+/g, '');
                const isValid = /^\+?\d{7,15}$/.test(phone);
                if (!isValid) {
                    const retry = session.language === "fr"
                        ? "Le numéro de téléphone semble invalide. Pouvez-vous réessayer en chiffres seulement ?"
                        : "That phone number seems invalid. Please try again using digits only.";
                    await sendMessage(senderId, retry);
                    return res.status(200).send('EVENT_RECEIVED');
                }
                session.contactInfo.phone = phone;
                session.signoffStep = "email";
                await sendMessage(senderId, session.language === "fr" ? "Quel est votre courriel ?" : "What is your email?");
            } else if (session.signoffStep === "email") {
                const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
                if (!isValid) {
                    const retry = session.language === "fr"
                        ? "L'adresse courriel semble invalide. Pouvez-vous réessayer ?"
                        : "That email address seems invalid. Could you try again?";
                    await sendMessage(senderId, retry);
                    return res.status(200).send('EVENT_RECEIVED');
                }
                session.contactInfo.email = val;
                session.signoffStep = "message";
                await sendMessage(senderId, session.language === "fr" ? "Souhaitez-vous ajouter un message ?" : "Would you like to add a message?");
            } else if (session.signoffStep === "message") {
                session.contactInfo.message = val;
                delete session.signoffStep;
                await sendMessage(senderId, session.language === "fr"
                    ? "Merci ! Nous vous contacterons dans les prochaines 24 heures. Vous pouvez continuer à poser vos questions si vous le souhaitez."
                    : "Thank you! We'll contact you within 24 hours. You may continue asking questions if you like.");
            }
            return res.status(200).send('EVENT_RECEIVED');
        }

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[INIT] Server running on port ${PORT}`));
