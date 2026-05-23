// ============================================
// In-Memory Vector Store
// Simple cosine similarity search for MVP
// Can be replaced with ChromaDB/Pinecone later
// ============================================

class InMemoryVectorStore {
  constructor() {
    // Store vectors as: { id, embedding, metadata, content }
    this.vectors = [];
    console.log('📦 In-memory vector store initialized');
  }

  // Add a single vector
  add(id, embedding, content, metadata = {}) {
    this.vectors.push({ id, embedding, content, metadata });
  }

  // Add multiple vectors at once
  addBatch(items) {
    // items: [{ id, embedding, content, metadata }]
    this.vectors.push(...items);
  }

  // Delete vectors by document ID
  deleteByDocumentId(documentId) {
    this.vectors = this.vectors.filter(
      (v) => v.metadata.documentId !== documentId
    );
  }

  // Cosine similarity between two vectors
  static cosineSimilarity(a, b) {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  // Search for similar vectors
  // Returns top-k results with similarity scores
  search(queryEmbedding, topK = 5, filter = {}) {
    let candidates = this.vectors;

    // Apply metadata filters
    if (filter.department) {
      candidates = candidates.filter(
        (v) => v.metadata.department === filter.department || v.metadata.department === 'general'
      );
    }
    if (filter.allowedRoles && filter.allowedRoles.length > 0) {
      candidates = candidates.filter((v) => {
        // If no roleAccess defined, allow all
        if (!v.metadata.roleAccess || v.metadata.roleAccess.length === 0) return true;
        // Check if any of the user's roles are allowed
        return v.metadata.roleAccess.some((role) => filter.allowedRoles.includes(role));
      });
    }

    // Calculate similarities
    const scored = candidates.map((v) => ({
      ...v,
      similarity: InMemoryVectorStore.cosineSimilarity(queryEmbedding, v.embedding),
    }));

    // Sort by similarity descending and return top-k
    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
  }

  // Hybrid search: combine semantic with keyword matching
  hybridSearch(queryEmbedding, queryText, topK = 5, filter = {}) {
    let candidates = this.vectors;

    // Apply metadata filters (same as semantic search)
    if (filter.department) {
      candidates = candidates.filter(
        (v) => v.metadata.department === filter.department || v.metadata.department === 'general'
      );
    }
    if (filter.allowedRoles && filter.allowedRoles.length > 0) {
      candidates = candidates.filter((v) => {
        if (!v.metadata.roleAccess || v.metadata.roleAccess.length === 0) return true;
        return v.metadata.roleAccess.some((role) => filter.allowedRoles.includes(role));
      });
    }

    const queryTerms = queryText.toLowerCase().split(/\s+/);

    const scored = candidates.map((v) => {
      // Semantic similarity (weight: 0.7)
      const semanticScore = InMemoryVectorStore.cosineSimilarity(queryEmbedding, v.embedding);

      // Keyword match score (weight: 0.3)
      const contentLower = v.content.toLowerCase();
      const matchedTerms = queryTerms.filter((term) => contentLower.includes(term));
      const keywordScore = queryTerms.length > 0 ? matchedTerms.length / queryTerms.length : 0;

      const combinedScore = 0.7 * semanticScore + 0.3 * keywordScore;

      return { ...v, similarity: combinedScore, semanticScore, keywordScore };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
  }

  // Get total count of vectors
  get count() {
    return this.vectors.length;
  }

  // Clear all vectors
  clear() {
    this.vectors = [];
  }
}

// Singleton instance
const vectorStore = new InMemoryVectorStore();

module.exports = vectorStore;
