// ============================================
// Logger Middleware
// ============================================

const Log = require('../models/Log');

// Log user actions to database
const logAction = async (userId, action, details = {}) => {
  try {
    await Log.create({
      userId,
      action,
      query: details.query || null,
      results: details.results || null,
      department: details.department || null,
      status: details.status || 'success',
    });
  } catch (err) {
    console.error('Failed to log action:', err.message);
  }
};

module.exports = { logAction };
