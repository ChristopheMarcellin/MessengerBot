// modules/languageDetector.js

const axios = require('axios');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // already in your .env

async function detectUserLanguage(userMessage) {
  if (!userMessage) return "F"; // Default to French if empty message

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o",  // You can adjust model if needed
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
      max_tokens: 1,  // Limit to 1 token to avoid unnecessary text
      temperature: 0  // No creativity, deterministic answer
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });

    const reply = response.data.choices?.[0]?.message?.content?.trim().toUpperCase();

    if (reply === "F" || reply === "E") {
      return reply;
    } else {
      return "F"; // Default if unexpected response
    }

  } catch (error) {
    console.error("Language Detection Error:", error.toString());
    if (error.response && error.response.data) {
      console.error("Error details:", JSON.stringify(error.response.data));
    }
    return "F"; // Fail-safe: assume French if API fails
  }
}

module.exports = {
  detectUserLanguage
};
