// ============================================
// Document Controller
// ============================================

const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const { processDocument } = require('../services/documentService');
const { canAccessDocument } = require('../middleware/rbacMiddleware');
const { getFileType } = require('../utils/helpers');
const { logAction } = require('../middleware/logger');
const vectorStore = require('../config/vectorStore');

// Upload and process a document
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { department, allowedRoles, title } = req.body;
    const fileType = getFileType(req.file.originalname);

    if (!fileType) {
      return res.status(400).json({ error: 'Unsupported file type.' });
    }

    // Parse allowedRoles (comes as comma-separated string from form data)
    const roles = allowedRoles
      ? allowedRoles.split(',').map((r) => r.trim())
      : ['admin'];

    // Create document record
    const doc = await Document.create({
      title: title || req.file.originalname,
      type: fileType,
      department: department || 'general',
      allowedRoles: roles,
      uploadedBy: req.user._id,
      source: 'upload',
      fileUrl: `/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      status: 'processing',
    });

    // Process document asynchronously
    processDocument(req.file.path, fileType, doc._id, {
      title: doc.title,
      department: doc.department,
      allowedRoles: doc.allowedRoles,
    }).catch((err) => console.error('Background processing error:', err.message));

    await logAction(req.user._id, 'upload', { department: doc.department });

    res.status(201).json({
      message: 'Document uploaded and processing started.',
      document: doc,
    });
  } catch (err) {
    next(err);
  }
};

// Get all accessible documents
const getDocuments = async (req, res, next) => {
  try {
    const filter = req.accessFilter || {};
    const docs = await Document.find(filter)
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ documents: docs, total: docs.length });
  } catch (err) {
    next(err);
  }
};

// Get single document by ID
const getDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('uploadedBy', 'name email role');

    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    if (!canAccessDocument(req.user, doc)) {
      return res.status(403).json({ error: 'Access Denied. You do not have permission to view this document.' });
    }

    // Get chunks for this document
    const chunks = await Chunk.find({ documentId: doc._id }).sort({ chunkIndex: 1 });

    res.json({ document: doc, chunks });
  } catch (err) {
    next(err);
  }
};

// Delete document (admin only)
const deleteDocument = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete documents.' });
    }

    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    // Remove from vector store
    vectorStore.deleteByDocumentId(doc._id.toString());

    // Remove chunks from MongoDB
    await Chunk.deleteMany({ documentId: doc._id });

    // Remove document
    await Document.findByIdAndDelete(doc._id);

    await logAction(req.user._id, 'delete', { department: doc.department });

    res.json({ message: 'Document deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadDocument, getDocuments, getDocument, deleteDocument };
