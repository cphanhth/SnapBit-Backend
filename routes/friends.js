// backend/routes/friends.js
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

// Get a user's friend list and friend requests
router.get('/:userId', authenticate, async (req, res) => {
  try {
    console.log('Fetching friends for user:', req.params.userId);
    
    const user = await User.findById(req.params.userId)
      .populate('friends', 'username profilePic')
      .populate('incomingFriendRequests', 'username profilePic')
      .populate('outgoingFriendRequests', 'username profilePic');
    
    if (!user) {
      console.log('User not found:', req.params.userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Found user with:', {
      friends: user.friends.length,
      incomingRequests: user.incomingFriendRequests.length,
      outgoingRequests: user.outgoingFriendRequests.length
    });

    res.json({ 
      friends: user.friends,
      incomingFriendRequests: user.incomingFriendRequests,
      outgoingFriendRequests: user.outgoingFriendRequests
    });
  } catch (err) {
    console.error('Error fetching friends:', err);
    res.status(500).json({ error: err.message });
  }
});

// Send a friend request
router.post('/request', authenticate, async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user.id;
    
    console.log('Processing friend request:', {
      senderId,
      recipientId
    });
    
    const sender = await User.findById(senderId);
    const recipient = await User.findById(recipientId);
    
    if (!sender || !recipient) {
      console.log('User not found:', { sender: !!sender, recipient: !!recipient });
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already friends
    if (sender.friends.includes(recipientId)) {
      console.log('Users are already friends');
      return res.status(400).json({ error: 'Already friends' });
    }

    // Check if request already exists
    if (sender.outgoingFriendRequests.includes(recipientId) || 
        recipient.incomingFriendRequests.includes(senderId)) {
      console.log('Friend request already exists');
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Add to respective request lists
    sender.outgoingFriendRequests.push(recipientId);
    recipient.incomingFriendRequests.push(senderId);
    
    await sender.save();
    await recipient.save();

    console.log('Friend request sent successfully');
    res.json({ message: 'Friend request sent successfully' });
  } catch (err) {
    console.error('Error sending friend request:', err);
    res.status(500).json({ error: err.message });
  }
});

// Accept a friend request
router.post('/accept', authenticate, async (req, res) => {
  try {
    const { senderId } = req.body;
    const recipientId = req.user.id;
    
    const sender = await User.findById(senderId);
    const recipient = await User.findById(recipientId);
    
    if (!sender || !recipient) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify the request exists
    if (!recipient.incomingFriendRequests.includes(senderId) || 
        !sender.outgoingFriendRequests.includes(recipientId)) {
      return res.status(400).json({ error: 'No friend request found' });
    }

    // Remove from request lists
    recipient.incomingFriendRequests = recipient.incomingFriendRequests.filter(id => id.toString() !== senderId);
    sender.outgoingFriendRequests = sender.outgoingFriendRequests.filter(id => id.toString() !== recipientId);

    // Add to friends lists
    recipient.friends.push(senderId);
    sender.friends.push(recipientId);

    await recipient.save();
    await sender.save();

    res.json({ message: 'Friend request accepted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject a friend request
router.post('/reject', authenticate, async (req, res) => {
  try {
    const { senderId } = req.body;
    const recipientId = req.user.id;
    
    const sender = await User.findById(senderId);
    const recipient = await User.findById(recipientId);
    
    if (!sender || !recipient) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from request lists
    recipient.incomingFriendRequests = recipient.incomingFriendRequests.filter(id => id.toString() !== senderId);
    sender.outgoingFriendRequests = sender.outgoingFriendRequests.filter(id => id.toString() !== recipientId);

    await recipient.save();
    await sender.save();

    res.json({ message: 'Friend request rejected successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove a friend
router.post('/remove', authenticate, async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);
    
    if (!user || !friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from both users' friend lists
    user.friends = user.friends.filter(id => id.toString() !== friendId);
    friend.friends = friend.friends.filter(id => id.toString() !== userId);

    await user.save();
    await friend.save();

    res.json({ message: 'Friend removed successfully' });
  } catch (err) {
    console.error('Error removing friend:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
