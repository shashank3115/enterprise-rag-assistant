// ============================================
// Chunk Model
// Individual chunks of processed documents
// ============================================

const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  chunkIndex: {
    type: Number,
    required: true,
  },
  embeddingId: {
    type: String,
    required: true,
  },
  metadata: {
    source: String,
    department: String,
    roleAccess: [String],
    confidence: { type: Number, default: 1.0 },
    documentTitle: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for text search
chunkSchema.index({ content: 'text' });

module.exports = mongoose.model('Chunk', chunkSchema);
