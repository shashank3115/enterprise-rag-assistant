// ============================================
// Query Controller
// ============================================

const { processQuery } = require('../services/ragService');
const Conversation = require('../models/Conversation');
const { logAction } = require('../middleware/logger');

// Submit a query through RAG pipeline
const submitQuery = async (req, res, next) => {
  try {
    const { query, conversationId } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required.' });
    }

    // Process through RAG pipeline
    const result = await processQuery(query, req.user);

    // Save to conversation history
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: req.user._id,
      });
    }

    if (!conversation) {
      conversation = new Conversation({
        userId: req.user._id,
        title: query.slice(0, 50) + (query.length > 50 ? '...' : ''),
        messages: [],
      });
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: query,
    });

    // Add assistant response
    conversation.messages.push({
      role: 'assistant',
      content: result.answer,
      sources: result.sources,
      confidence: result.confidence,
    });

    await conversation.save();

    // Log the query
    await logAction(req.user._id, 'query', {
      query,
      department: result.department,
      status: result.denied ? 'denied' : 'success',
    });

    res.json({
      answer: result.answer,
      sources: result.sources,
      confidence: result.confidence,
      department: result.department,
      processingTime: result.processingTime,
      conversationId: conversation._id,
    });
  } catch (err) {
    next(err);
  }
};

// Get user's conversation history
const getHistory = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ userId: req.user._id })
      .select('title messages createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50);

    // Return conversations with message count
    const history = conversations.map((c) => ({
      _id: c._id,
      title: c.title,
      messageCount: c.messages.length,
      lastMessage: c.messages[c.messages.length - 1]?.content?.slice(0, 100),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.json({ conversations: history });
  } catch (err) {
    next(err);
  }
};

// Get a specific conversation
const getConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    res.json({ conversation });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitQuery, getHistory, getConversation };
