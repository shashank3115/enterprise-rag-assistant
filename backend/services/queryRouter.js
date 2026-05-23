// ============================================
// Query Router - Intent Classification
// Routes queries to appropriate departments
// ============================================

const { generateResponse } = require('../config/gemini');
const { INTENT_CLASSIFICATION_PROMPT } = require('../utils/promptTemplates');

// Keyword-based fast classification (fallback)
const DEPARTMENT_KEYWORDS = {
  hr: ['leave', 'vacation', 'employee', 'hiring', 'onboarding', 'benefits', 'salary', 'hr', 'policy', 'holidays', 'pto', 'attendance', 'human resources', 'resignation', 'termination', 'performance review'],
  finance: ['budget', 'revenue', 'expense', 'financial', 'quarterly', 'profit', 'loss', 'invoice', 'payment', 'accounting', 'fiscal', 'earnings', 'cost', 'finance', 'tax'],
  security: ['security', 'breach', 'audit', 'incident', 'vulnerability', 'firewall', 'access log', 'compliance', 'gdpr', 'soc2', 'penetration', 'threat', 'malware', 'phishing'],
  engineering: ['code', 'deploy', 'api', 'server', 'database', 'architecture', 'infrastructure', 'technical', 'engineering', 'software', 'system', 'devops', 'kubernetes', 'microservice'],
};

// Fast keyword-based classification
const classifyByKeywords = (query) => {
  const lowerQuery = query.toLowerCase();
  const scores = {};

  for (const [dept, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
    scores[dept] = keywords.filter((kw) => lowerQuery.includes(kw)).length;
  }

  const maxDept = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return maxDept[1] > 0 ? maxDept[0] : 'general';
};

// LLM-based classification (more accurate, slower)
const classifyByLLM = async (query) => {
  try {
    const response = await generateResponse(INTENT_CLASSIFICATION_PROMPT + query);
    const department = response.trim().toLowerCase();
    const validDepts = ['hr', 'finance', 'security', 'engineering', 'general'];
    return validDepts.includes(department) ? department : 'general';
  } catch (err) {
    console.warn('LLM classification failed, using keyword fallback:', err.message);
    return classifyByKeywords(query);
  }
};

// Main routing function - uses keyword first, falls back to LLM
const routeQuery = async (query) => {
  // Try fast keyword classification first
  const keywordResult = classifyByKeywords(query);

  // If keyword classification is confident, use it
  if (keywordResult !== 'general') {
    return { department: keywordResult, method: 'keyword' };
  }

  // Otherwise, use LLM for more nuanced classification
  const llmResult = await classifyByLLM(query);
  return { department: llmResult, method: 'llm' };
};

module.exports = { routeQuery, classifyByKeywords, classifyByLLM };
