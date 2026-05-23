// ============================================
// Document Model
// Tracks uploaded files and their metadata
// ============================================

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['pdf', 'csv', 'json', 'txt'],
    required: true,
  },
  department: {
    type: String,
    enum: ['hr', 'finance', 'engineering', 'security', 'general'],
    required: true,
  },
  // Which roles can access this document
  allowedRoles: [{
    type: String,
    enum: ['admin', 'hr', 'finance', 'engineer', 'intern'],
  }],
  // Reference to chunks in vector store
  embeddingReference: {
    type: String,
    default: null,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  source: {
    type: String,
    default: 'upload',
  },
  fileUrl: {
    type: String,
    default: null,
  },
  originalName: {
    type: String,
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  chunkCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['processing', 'ready', 'error'],
    default: 'processing',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for text search on title
documentSchema.index({ title: 'text' });

module.exports = mongoose.model('Document', documentSchema);
