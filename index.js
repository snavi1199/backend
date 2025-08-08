require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    'https://speech-rho.vercel.app',
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS policy: Origin not allowed'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        if (allowedOrigins.includes(req.headers.origin)) {
            res.header('Access-Control-Allow-Origin', req.headers.origin);
        }
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.sendStatus(200);
    }
    next();
});

app.use(bodyParser.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.get('/api/chat', (req, res) => {
    res.json({ message: 'Welcome to the OpenRouter Chat API!' });
});

// ✅ Streaming Chat Endpoint
app.post('/api/chat', async (req, res) => {
    const { prompt, role, apiKey } = req.body;

    if (!prompt?.trim()) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }
    if (!apiKey?.trim()) {
        return res.status(400).json({ error: 'API key is required.' });
    }

    const roleContext = role?.trim()
        ? `You are a helpful AI assistant acting as a ${role.trim()}.`
        : 'You are a helpful AI assistant.';

    try {
        const streamRes = await axios({
            method: 'post',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            headers: {
                Authorization: `Bearer ${apiKey.trim() || OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://speech-rho.vercel.app',
                'X-Title': 'SpeechToTextApp',
            },
            data: {
                model: 'openai/gpt-3.5-turbo',
                stream: true,
                messages: [
                    { role: 'system', content: roleContext },
                    { role: 'user', content: prompt },
                ],
            },
            responseType: 'stream',
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        streamRes.data.on('data', (chunk) => {
            const payloads = chunk.toString().split('\n\n');
            for (const payload of payloads) {
                if (payload.includes('[DONE]')) {
                    res.write(`data: [DONE]\n\n`);
                    res.end();
                    return;
                }
                if (payload.startsWith('data:')) {
                    try {
                        const data = JSON.parse(payload.replace(/^data:\s*/, ''));
                        const text = data.choices?.[0]?.delta?.content;
                        if (text) {
                            res.write(`data: ${text}\n\n`);
                        }
                    } catch (err) {
                        // Ignore parsing errors
                    }
                }
            }
        });

        streamRes.data.on('end', () => {
            res.write(`data: [DONE]\n\n`);
            res.end();
        });

        streamRes.data.on('error', (err) => {
            console.error('Stream error:', err.message);
            res.end();
        });

    } catch (error) {
        console.error('[OpenRouter Error]', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to fetch AI response',
            details: error.response?.data || error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
