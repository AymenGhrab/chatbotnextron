const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.use(cors());
app.use(bodyParser.json());

app.post('/chat', async (req, res) => {
  const { message, allProducts = [] } = req.body;

  if (!message || message.trim() === '') {
    return res.json({
      response: "👋 Hello! I'm Nextron AI Agent. I can help you explore products in our store. Ask me anything!"
    });
  }

  // Compose product data with price and formatting
  const productListText = allProducts
    .filter(p => p.name && p.description)
    .map(p => `🎁 ${p.name}\n💰 Price: $${p.price}\n📝 ${p.description}`)
    .join('\n\n');

  const systemPrompt = `
You are Nextron's smart and friendly AI assistant for electronics shopping.

Only recommend products from the following list:
${productListText}

If the user asks about a product, search by name or category. NEVER invent items.
Format replies clearly using:

🎁 Product Name  
💰 Price: $...  
📝 Description: ...

Always speak conversationally. If unsure, ask a follow-up question.
`.trim();

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        }
      }
    );

    const aiText = response.data.choices?.[0]?.message?.content?.trim() || "🤖 I'm not sure how to help yet.";
    res.json({ response: aiText });

  } catch (error) {
    console.error('🔥 Groq Chat Error:', error.response?.data || error.message);
    res.status(500).json({ response: "❌ Error with Groq API." });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 Groq AI Chatbot running at http://0.0.0.0:${PORT}`);
});
