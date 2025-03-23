// backend/routes/friends.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Example middleware to check JWT can be added here (omitted for brevity)

// Get a user’s friend list
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('friends', 'username profilePic');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ friends: user.friends });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a friend request (auto-accept for simplicity)
router.post('/request', async (req, res) => {
  try {
    const { senderId, recipientId } = req.body;
    const sender = await User.findById(senderId);
    const recipient = await User.findById(recipientId);
    if (!sender || !recipient) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Check if already friends
    if (sender.friends.includes(recipientId)) {
      return res.status(400).json({ error: 'Already friends' });
    }
    // Add each other to friends lists
    sender.friends.push(recipientId);
    recipient.friends.push(senderId);
    await sender.save();
    await recipient.save();
    res.json({ message: 'Friend request accepted automatically', friends: recipient.friends });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
