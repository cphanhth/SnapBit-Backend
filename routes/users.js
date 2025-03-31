const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get user profile
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { username, profilePic } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Only allow users to update their own profile
    if (user._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }

    if (username) user.username = username;
    if (profilePic) user.profilePic = profilePic;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 