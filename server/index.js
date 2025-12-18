const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[Server] Received request from: ${req.ip}`);
    console.log('[Server] Headers forwarding from Kong:', {
        auth: req.headers['authorization'] ? 'Present' : 'Missing',
        dpop: req.headers['dpop'] ? 'Present' : 'Missing'
    });
    next();
});

app.get('/api', (req, res) => {
    res.json({
        message: "CHÚC MỪNG! Bạn đã vượt qua Zero Trust Gateway.",
        secret_data: "Số dư tài khoản: 10 tỷ USD",
        timestamp: new Date().toISOString()
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`[Backend] Server listening on port ${port}`);
});