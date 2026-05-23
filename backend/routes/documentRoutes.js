// ============================================
// Document Routes
// ============================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const { filterByRole } = require('../middleware/rbacMiddleware');
const {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
} = require('../controllers/documentController');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.csv', '.json', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, CSV, JSON, and TXT files are allowed.'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// POST /api/documents/upload - Upload and process a document
router.post('/upload', authMiddleware, upload.single('file'), uploadDocument);

// GET /api/documents - Get all accessible documents
router.get('/', authMiddleware, filterByRole, getDocuments);

// GET /api/documents/:id - Get document by ID
router.get('/:id', authMiddleware, getDocument);

// DELETE /api/documents/:id - Delete document (admin only)
router.delete('/:id', authMiddleware, deleteDocument);

module.exports = router;
