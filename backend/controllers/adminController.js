// ============================================
// Admin Controller
// ============================================

const User = require('../models/User');
const Document = require('../models/Document');
const Log = require('../models/Log');
const Conversation = require('../models/Conversation');
const vectorStore = require('../config/vectorStore');

// Get all users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

// Update user role
const updateUserRole = async (req, res, next) => {
  try {
    const { role, department } = req.body;
    const validRoles = ['admin', 'hr', 'finance', 'engineer', 'intern'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, department: department || 'general' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ message: 'User role updated.', user });
  } catch (err) {
    next(err);
  }
};

// Get system statistics
const getSystemStats = async (req, res, next) => {
  try {
    const [userCount, docCount, logCount, conversationCount] = await Promise.all([
      User.countDocuments(),
      Document.countDocuments(),
      Log.countDocuments(),
      Conversation.countDocuments(),
    ]);

    // Query stats from logs
    const recentQueries = await Log.find({ action: 'query' })
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('userId', 'name role');

    // Department distribution
    const deptDistribution = await Document.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]);

    res.json({
      stats: {
        users: userCount,
        documents: docCount,
        queries: logCount,
        conversations: conversationCount,
        vectorCount: vectorStore.count,
      },
      recentQueries,
      departmentDistribution: deptDistribution,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, updateUserRole, getSystemStats };
