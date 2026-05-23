// ============================================
// Log Model - Tracks user actions & queries
// ============================================

const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    enum: ['query', 'upload', 'login', 'register', 'delete', 'admin_action'],
    required: true,
  },
  query: String,
  results: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  department: String,
  status: {
    type: String,
    enum: ['success', 'denied', 'error'],
    default: 'success',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Log', logSchema);
