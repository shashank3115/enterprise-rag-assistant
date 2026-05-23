// ============================================
// Helpers
// ============================================

// Determine file type from extension
const getFileType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const typeMap = {
    pdf: 'pdf',
    csv: 'csv',
    json: 'json',
    txt: 'txt',
    text: 'txt',
  };
  return typeMap[ext] || null;
};

// Sanitize user input (prevent prompt injection)
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  // Remove potential prompt injection patterns
  return input
    .replace(/```/g, '')
    .replace(/system:/gi, '')
    .replace(/ignore previous/gi, '')
    .replace(/forget all/gi, '')
    .trim()
    .slice(0, 2000); // Limit query length
};

// Parse confidence from LLM response
const parseConfidence = (response) => {
  const match = response.match(/Confidence:\s*(\d+)%/i);
  return match ? parseInt(match[1]) : 75; // Default 75% if not found
};

// Parse sources from LLM response
const parseSources = (response) => {
  const sourcesMatch = response.match(/Sources?:\s*([\s\S]*?)(?=Confidence:|$)/i);
  if (!sourcesMatch) return [];

  return sourcesMatch[1]
    .split('\n')
    .map((s) => s.replace(/^[-*•]\s*/, '').trim())
    .filter((s) => s.length > 0);
};

module.exports = { getFileType, sanitizeInput, parseConfidence, parseSources };
