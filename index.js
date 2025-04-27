const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = 'helloworldtoken'; // <<< your verify token
const YOUR_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwnt88zFCVT6B4N0M7fPTQqjgEbVzXGSc-OulTgWS8F2BmZZUQq8dC14R6NuHyEGvgd/exec'; // <<< your Apps Script Web App URL

// Verification endpoint (Facebook webhook handshake)
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

// Main webhook event listener
app.post('/webhook', async (req, res) => {
  try {
    // Log the incoming request for troubleshooting
    console.log("Incoming Request Headers:", JSON.stringify(req.headers));
    console.log("Incoming Request Body:", JSON.stringify(req.body));
    
    // Prepare the outgoing payload
    const payload = JSON.stringify(req.body); // <<< IMPORTANT: Stringify before sending

    // Log outgoing payload
    console.log("Forwarding to Apps Script:");
    console.log("Outgoing Body:", payload);

    // Forward the request to Google Apps Script Web App
    await axios.post(YOUR_APPS_SCRIPT_URL, payload, {
      headers: {
        'Content-Type': 'application/json' // Explicitly tell GAS it's JSON
      }
    });
    
    // Respond immediately to Messenger to avoid timeouts
    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error("Error forwarding event:", error.toString());
    res.status(500).send('Error forwarding event');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));