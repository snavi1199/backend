require('dotenv').config(); // load environment variables
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 5000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.post('/api/chat', async (req, res) => {
  const userPrompt = req.body.prompt;

  if (!userPrompt || !userPrompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: userPrompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'SpeechToTextApp',
        },
        timeout: 10000, // Add timeout to avoid hanging
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
