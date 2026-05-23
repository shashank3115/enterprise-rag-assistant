// ============================================
// Query Routes
// ============================================

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { submitQuery, getHistory, getConversation } = require('../controllers/queryController');

// POST /api/query - Submit a RAG query
router.post('/', authMiddleware, submitQuery);

// GET /api/query/history - Get user's query history
router.get('/history', authMiddleware, getHistory);

// GET /api/query/conversation/:id - Get a specific conversation
router.get('/conversation/:id', authMiddleware, getConversation);

module.exports = router;
