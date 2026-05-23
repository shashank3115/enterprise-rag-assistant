// ============================================
// RAG Service - Full Pipeline Orchestration
// Query → Intent → RBAC → Retrieve → Generate → Cite
// ============================================

const { routeQuery } = require('./queryRouter');
const { hybridSearch } = require('./searchService');
const { generateResponse } = require('../config/gemini');
const { RAG_SYSTEM_PROMPT, buildRAGPrompt } = require('../utils/promptTemplates');
const { sanitizeInput, parseConfidence, parseSources } = require('../utils/helpers');
const { DEPARTMENT_ACCESS } = require('../middleware/rbacMiddleware');

// Main RAG pipeline
const processQuery = async (query, user) => {
  const startTime = Date.now();

  // 1. Sanitize input
  const cleanQuery = sanitizeInput(query);
  if (!cleanQuery) {
    return {
      answer: 'Please provide a valid query.',
      sources: [],
      confidence: 0,
      department: 'general',
      processingTime: 0,
    };
  }

  // 2. Detect intent / route to department
  const { department, method: routingMethod } = await routeQuery(cleanQuery);

  // 3. RBAC - Check if user has access to this department
  const userDepartments = DEPARTMENT_ACCESS[user.role] || ['general'];
  const hasAccess = user.role === 'admin' || userDepartments.includes(department) || department === 'general';

  if (!hasAccess) {
    return {
      answer: `Access Denied. Your role (${user.role}) does not have permission to access ${department} department data. Please contact your administrator for access.`,
      sources: [],
      confidence: 100,
      department,
      denied: true,
      processingTime: Date.now() - startTime,
    };
  }

  // 4. Retrieve relevant chunks with RBAC filtering
  const filter = {
    allowedRoles: [user.role, 'admin'],
  };

  // If department detected, add department filter (but also include general)
  if (department !== 'general') {
    filter.department = department;
  }

  const retrievedChunks = await hybridSearch(cleanQuery, 5, filter);

  // 5. Check if we found any relevant context
  if (retrievedChunks.length === 0) {
    return {
      answer: "I don't have any relevant documents to answer this question. Please ensure the relevant data has been uploaded to the system.",
      sources: [],
      confidence: 0,
      department,
      processingTime: Date.now() - startTime,
    };
  }

  // 6. Build prompt with context
  const prompt = buildRAGPrompt(cleanQuery, retrievedChunks, user.role);

  // 7. Generate response via LLM
  const llmResponse = await generateResponse(prompt, RAG_SYSTEM_PROMPT);

  // 8. Parse confidence and sources from response
  const confidence = parseConfidence(llmResponse);
  const parsedSources = parseSources(llmResponse);

  // 9. Build source objects with chunk previews
  const sources = retrievedChunks
    .filter((chunk) => chunk.similarity > 0.3) // Only include relevant chunks
    .map((chunk) => ({
      title: chunk.metadata?.documentTitle || chunk.metadata?.source || 'Unknown Document',
      department: chunk.metadata?.department || 'general',
      similarity: chunk.similarity,
      chunkPreview: chunk.content.slice(0, 200) + (chunk.content.length > 200 ? '...' : ''),
    }));

  // 10. Clean up the answer (remove the Sources/Confidence suffix since we parse them separately)
  let cleanAnswer = llmResponse
    .replace(/Sources?:\s*[\s\S]*$/i, '')
    .trim();

  return {
    answer: cleanAnswer,
    sources,
    confidence,
    department,
    routingMethod,
    totalChunksSearched: retrievedChunks.length,
    processingTime: Date.now() - startTime,
  };
};

module.exports = { processQuery };
