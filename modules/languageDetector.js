// modules/languageDetector.js
const axios = require('axios');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function detectUserLanguage(userMessage, context = {}) {
    if (!userMessage) return "F"; // Default to French if empty

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "Given the following user message, respond only with 'F' for French or 'E' for English. If uncertain, respond 'F'. No explanations."
                    },
                    {
                        role: "user",
                        content: userMessage
                    }
                ],
                max_tokens: 1,
                temperature: 0
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                timeout: 5000 // 5 sec max to avoid blocking
            }
        );

        const reply = response.data.choices?.[0]?.message?.content?.trim().toUpperCase();
        return (reply === "F" || reply === "E") ? reply : "F";

    } catch (error) {
        console.error(`[LanguageDetector] sender=${context.senderId || "?"} ERROR: ${error.message}`);
        if (error.response?.data) {
            console.error("Error details:", JSON.stringify(error.response.data));
        }
        return "F";
    }
}

module.exports = { detectUserLanguage };
