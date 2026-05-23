// ============================================
// Auth Controller
// ============================================

const User = require('../models/User');
const { generateToken } = require('../auth/jwtUtils');
const { logAction } = require('../middleware/logger');

// Register a new user
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'intern',
      department: department || 'general',
    });

    // Generate token
    const token = generateToken(user._id);

    await logAction(user._id, 'register');

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate token
    const token = generateToken(user._id);

    await logAction(user._id, 'login');

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// Get current user profile
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, getMe };
