const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = 'helloworldtoken'; // your verify token
const PAGE_ACCESS_TOKEN = 'EAAJKoaoqWTwBO13IbPGWADaCrLI4CtECzrrTw8AV0A7DHyskEXv1V4Yw3B3xfQuzuns1zM7qKhgbZAQ3DzLPo9KuD4ZAfZArqrcQFEsZCV8yktqNgIQAyWjJjIdLVZC2WyNmPWdRqau6OYvpZC04dGaNMKAy6zNaoL5wOZByFYYaaXyYhS59G4S6qHsxjwuZAfPbp2c0tBzSoc5DmjUZD'; // your Page token (very important)

// Messenger webhook verification (handshake)
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
      const normalizedMessage = receivedMessage.trim().toLowerCase();

      if (normalizedMessage === 'hi' || normalizedMessage === 'hello') {
        const messageData = {
          recipient: { id: senderId },
          message: { text: "Hello! 👋 How can I assist you today?" }
        };

        await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, messageData, {
          headers: { 'Content-Type': 'application/json' }
        });

        console.log("Reply sent to Messenger successfully!");
      } else {
        console.log("Received a message that is not 'hi' or 'hello'. Ignored.");
      }
    } else {
      console.log("No valid message or sender ID found in incoming request.");
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error("Error handling webhook event:", error.toString());
    if (error.response && error.response.data) {
      console.error("Error details:", error.response.data);
    }
    res.status(500).send('Error handling event');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));