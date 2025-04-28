require('dotenv').config();

console.log("DEBUG ENV OPENAI KEY:", process.env.OPENAI_API_KEY);
console.log("DEBUG ENV PAGE ACCESS TOKEN:", process.env.PAGE_ACCESS_TOKEN);

const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = 'helloworldtoken'; // Messenger verify token
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Messenger webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Messenger webhook event reception
app.post('/webhook', async (req, res) => {
  try {
    console.log("Incoming Request:", JSON.stringify(req.body));

    const receivedMessage = req.body.entry?.[0]?.messaging?.[0]?.message?.text;
    const senderId = req.body.entry?.[0]?.messaging?.[0]?.sender?.id;

    if (receivedMessage && senderId) {
      console.log(`Received message: ${receivedMessage}`);

      // 1. Send user's message to ChatGPT
      const chatGptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o",
        messages: [{ role: "user", content: receivedMessage }]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      });

      const gptReply = chatGptResponse.data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't understand.";

      console.log(`ChatGPT Reply: ${gptReply}`);

      // 2. Send ChatGPT reply back to Messenger
      const messageData = {
        recipient: { id: senderId },
        message: { text: gptReply }
      };

      await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, messageData, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log("Sent ChatGPT reply back to Messenger!");
    } else {
      console.log("No valid message or sender ID found in incoming request.");
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error("Error handling webhook event:", error.toString());
    if (error.response && error.response.data) {
      console.error("Error details:", JSON.stringify(error.response.data));
    }
    res.status(500).send('Error handling event');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
