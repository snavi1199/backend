require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 5000;

const allowedOrigins = [
  'https://speech-rho.vercel.app',
  'http://localhost:3000'
];

// ✅ Preflight + CORS handler for all requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

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
          'HTTP-Referer': 'https://speech-rho.vercel.app',
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
