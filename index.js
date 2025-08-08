require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 5000;

// ✅ Allow both production & local frontend
const allowedOrigins = [
  'https://speech-rho.vercel.app', // production frontend
  'http://localhost:3000'          // local frontend
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Handle preflight requests
app.options('*', cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.get('/api/chat', (req, res) => {
  res.json({ message: 'Welcome to the OpenRouter Chat API!' });
});

app.post('/api/chat', async (req, res) => {
  const { prompt, role, apiKey } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  if (!apiKey || !apiKey.trim()) {
    return res.status(400).json({ error: 'API key is required.' });
  }

  const roleContext = role?.trim()
    ? `You are a helpful AI assistant acting as a ${role.trim()}.`
    : 'You are a helpful AI assistant.';

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: roleContext },
          { role: 'user', content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey.trim() || OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'SpeechToTextApp',
        },
        timeout: 10000,
      }
    );

    const aiMessage = response.data.choices[0].message.content;
    res.json({ response: aiMessage });
  } catch (error) {
    console.error('[OpenRouter Error]', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch AI response' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
