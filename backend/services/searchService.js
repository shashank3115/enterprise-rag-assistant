// ============================================
// Search Service
// Semantic + Hybrid search via vector store
// ============================================

const { generateEmbedding } = require('../config/gemini');
const vectorStore = require('../config/vectorStore');

// Pure semantic search
const semanticSearch = async (query, topK = 5, filter = {}) => {
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  // Search vector store
  const results = vectorStore.search(queryEmbedding, topK, filter);

  return results.map((r) => ({
    content: r.content,
    similarity: Math.round(r.similarity * 100) / 100,
    metadata: r.metadata,
    embeddingId: r.id,
  }));
};

// Hybrid search (semantic + keyword)
const hybridSearch = async (query, topK = 5, filter = {}) => {
  const queryEmbedding = await generateEmbedding(query);

  const results = vectorStore.hybridSearch(queryEmbedding, query, topK, filter);

  return results.map((r) => ({
    content: r.content,
    similarity: Math.round(r.similarity * 100) / 100,
    semanticScore: Math.round((r.semanticScore || 0) * 100) / 100,
    keywordScore: Math.round((r.keywordScore || 0) * 100) / 100,
    metadata: r.metadata,
    embeddingId: r.id,
  }));
};

module.exports = { semanticSearch, hybridSearch };
