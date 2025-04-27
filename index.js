const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = 'helloworldtoken'; // <<< your verify token
const YOUR_APPS_SCRIPT_URL = 
'https://script.google.com/macros/s/AKfycbwnt88zFCVT6B4N0M7fPTQqjgEbVzXGSc-OulTgWS8F2BmZZUQq8dC14R6NuHyEGvgd/exec'; // <<< Paste your Apps Script Web App URL

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

app.post('/webhook', async (req, res) => {
  try {
    await axios.post(YOUR_APPS_SCRIPT_URL, req.body);
    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    res.status(500).send('Error forwarding event');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));