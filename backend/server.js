const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');
const crypto = require('crypto');
const querystring = require('querystring');
const WebSocket = require('ws');
require('dotenv').config();

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES;
const SHOPIFY_REDIRECT_URI = process.env.SHOPIFY_REDIRECT_URI;

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'frontend'))); // Servir archivos estáticos desde 'frontend'

// WebSocket setup
const wss = new WebSocket.Server({ noServer: true });
wss.on('connection', (ws, req) => {
    const params = new URLSearchParams(req.url.substring(1));
    const branchName = params.get('branch_name');
    const userEmail = params.get('user_email');
    ws.branchName = branchName;
    ws.userEmail = userEmail;
    ws.send(JSON.stringify({ message: 'Connected to WebSocket server' }));
});

// Rutas del servidor
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Shopify OAuth callback
app.get('/shopify', (req, res) => {
    const shop = req.query.shop;
    if (!shop) {
        return res.status(400).send('Missing shop parameter.');
    }
    const state = crypto.randomBytes(16).toString('hex');
    const redirectUri = `${SHOPIFY_REDIRECT_URI}/callback`;
    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SHOPIFY_SCOPES}&state=${state}&redirect_uri=${redirectUri}`;
    res.cookie('state', state);
    res.redirect(installUrl);
});

app.get('/shopify/callback', async (req, res) => {
    const { shop, hmac, code, state } = req.query;
    const stateCookie = req.cookies.state;
    if (state !== stateCookie) {
        return res.status(403).send('Request origin cannot be verified');
    }
    const map = Object.assign({}, req.query);
    delete map['signature'];
    delete map['hmac'];
    const message = querystring.stringify(map);
    const generatedHash = crypto
        .createHmac('sha256', SHOPIFY_API_SECRET)
        .update(message)
        .digest('hex');
    if (generatedHash !== hmac) {
        return res.status(400).send('HMAC validation failed');
    }
    const accessTokenRequestUrl = `https://${shop}/admin/oauth/access_token`;
    const accessTokenPayload = {
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
    };
    try {
        const response = await axios.post(accessTokenRequestUrl, accessTokenPayload);
        const accessToken = response.data.access_token;
        res.status(200).send('Access token: ' + accessToken);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Endpoint for receiving Shopify POS webhooks
app.post('/webhook', (req, res) => {
    const { location_id, user_id, line_items, total_price } = req.body;
    if (!location_id || !user_id) {
        return res.status(400).send('Missing location_id or user_id.');
    }
    // Store the order data
    orderData[`${location_id}_${user_id}`] = { line_items, total_price };
    // Broadcast the update to all connected WebSocket clients
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN &&
            client.branchName === location_id &&
            client.userEmail === user_id) {
            client.send(JSON.stringify({ line_items, total_price }));
        }
    });
    console.log(`Received webhook: ${JSON.stringify(req.body)}`);
    res.status(200).send('Webhook received');
});

// Endpoint to fetch order data for a specific user and location
app.get('/order/:location_id/:user_id', (req, res) => {
    const { location_id, user_id } = req.params;
    const key = `${location_id}_${user_id}`;
    if (!orderData[key]) {
        return res.status(404).send('No order data found');
    }
    res.status(200).json(orderData[key]);
});

// Inicialización del servidor
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
    const pathname = request.url.split('?')[0];
    if (pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});
