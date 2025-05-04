const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
    console.log('[SAFE MODE] Messenger request ignored.');
    res.status(200).send('SAFE MODE');
});

app.get('/', (req, res) => {
    res.send('Safe mode is active.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[SAFE MODE] Server running on port ${PORT}`);
});