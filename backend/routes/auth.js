const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt  = require('bcryptjs');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

// ── REGISTER ────────────────────────────────────────────────────────────────
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { name, email, password } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ success: false, message: 'An account with this email already exists' });

    // First ever user gets admin role
    const count = await User.countDocuments();
    const role  = count === 0 ? 'admin' : 'user';

    const user  = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password, role });
    const token = user.generateToken();

    res.status(201).json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

// ── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { email, password } = req.body;

    // Find user — always include password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      console.log('Login failed — no user with email:', email);
      return res.status(401).json({ success: false, message: 'No account found with this email' });
    }

    if (!user.password) {
      console.log('Login failed — user has no password stored:', email);
      return res.status(401).json({ success: false, message: 'Account has no password set. Please contact support.' });
    }

    // Support both bcrypt hashes and (legacy) plain text
    let match = false;
    if (user.password.startsWith('$2')) {
      match = await bcrypt.compare(password, user.password);
    } else {
      // Plain text — compare then upgrade
      match = user.password === password;
      if (match) {
        user.password = await bcrypt.hash(password, 12);
        await user.save();
        console.log('Upgraded plain-text password to bcrypt for:', email);
      }
    }

    if (!match) {
      console.log('Login failed — wrong password for:', email);
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    const token = user.generateToken();
    console.log('Login success:', email, '| role:', user.role);

    res.json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Login failed. Check server is running and MongoDB is connected.' });
  }
});

// ── GET ME ───────────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  const u = req.user;
  res.json({ success: true, user: { id: u._id, name: u.name, email: u.email, avatar: u.avatar, role: u.role, createdAt: u.createdAt } });
});

// ── UPDATE PROFILE ───────────────────────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, avatar, password, currentPassword } = req.body;
    const update = {};
    if (name)              update.name   = name.trim();
    if (avatar !== undefined) update.avatar = avatar;

    if (password) {
      if (!currentPassword) return res.status(400).json({ success: false, message: 'Current password is required to set a new one' });
      const userWithPw = await User.findById(req.user._id).select('+password');
      const ok = await bcrypt.compare(currentPassword, userWithPw.password);
      if (!ok) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      update.password = await bcrypt.hash(password, 12);
    }

    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true, runValidators: false }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

module.exports = router;
