// ============================================
// Admin Routes
// ============================================

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');
const { getUsers, updateUserRole, getSystemStats } = require('../controllers/adminController');

// All admin routes require admin role
router.use(authMiddleware, requireRole('admin'));

// GET /api/admin/users - Get all users
router.get('/users', getUsers);

// PUT /api/admin/users/:id/role - Update user role
router.put('/users/:id/role', updateUserRole);

// GET /api/admin/stats - Get system statistics
router.get('/stats', getSystemStats);

module.exports = router;
