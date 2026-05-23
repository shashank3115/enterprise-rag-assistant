// ============================================
// RBAC Middleware
// Role-Based Access Control for routes & data
// ============================================

// Role hierarchy: admin > hr/finance/engineer > intern
const ROLE_HIERARCHY = {
  admin: 5,
  hr: 3,
  finance: 3,
  engineer: 3,
  intern: 1,
};

// Department access mapping
// Defines which roles can access which departments
const DEPARTMENT_ACCESS = {
  admin: ['hr', 'finance', 'engineering', 'security', 'general'],
  hr: ['hr', 'general'],
  finance: ['finance', 'general'],
  engineer: ['engineering', 'general'],
  intern: ['general'],
};

// Middleware: Restrict route to specific roles
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access Denied. You do not have permission to access this resource.',
        requiredRoles: allowedRoles,
        yourRole: req.user.role,
      });
    }

    next();
  };
};

// Middleware: Filter documents by user's role
const filterByRole = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Admin can see everything
  if (req.user.role === 'admin') {
    req.accessibleDepartments = DEPARTMENT_ACCESS.admin;
    req.accessFilter = {};
    return next();
  }

  // Other roles: filter by accessible departments
  const departments = DEPARTMENT_ACCESS[req.user.role] || ['general'];
  req.accessibleDepartments = departments;
  req.accessFilter = {
    $or: [
      { department: { $in: departments } },
      { allowedRoles: req.user.role },
    ],
  };

  next();
};

// Check if a user can access a specific document
const canAccessDocument = (user, document) => {
  // Admin can access everything
  if (user.role === 'admin') return true;

  // Check if user's role is in the document's allowedRoles
  if (document.allowedRoles && document.allowedRoles.includes(user.role)) {
    return true;
  }

  // Check department access
  const departments = DEPARTMENT_ACCESS[user.role] || ['general'];
  return departments.includes(document.department);
};

module.exports = {
  requireRole,
  filterByRole,
  canAccessDocument,
  ROLE_HIERARCHY,
  DEPARTMENT_ACCESS,
};
