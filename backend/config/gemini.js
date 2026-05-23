// ============================================
// Gemini API Configuration
// ============================================

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Chat/generation model
const getGenerativeModel = () => {
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

// Embedding model
const getEmbeddingModel = () => {
  return genAI.getGenerativeModel({ model: 'text-embedding-004' });
};

// Generate text response
const generateResponse = async (prompt, systemInstruction = '') => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: systemInstruction || undefined,
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

// Generate embedding for a single text
const generateEmbedding = async (text) => {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text);
  return result.embedding.values;
};

// Generate embeddings for multiple texts (batch)
const generateEmbeddings = async (texts) => {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const results = [];
  // Process in batches of 10 to avoid rate limits
  for (let i = 0; i < texts.length; i += 10) {
    const batch = texts.slice(i, i + 10);
    const batchResults = await Promise.all(
      batch.map(async (text) => {
        const result = await model.embedContent(text);
        return result.embedding.values;
      })
    );
    results.push(...batchResults);
  }
  return results;
};

module.exports = {
  genAI,
  getGenerativeModel,
  getEmbeddingModel,
  generateResponse,
  generateEmbedding,
  generateEmbeddings,
};
