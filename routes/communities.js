// backend/routes/communities.js
const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const User = require('../models/User');
const Habit = require('../models/Habit');
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

// Create a new community
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, creator, habitName } = req.body;
    const newCommunity = new Community({
      name,
      description,
      habitName, // the habit associated with this community
      creator,
      members: [creator],
    });
    await newCommunity.save();
    res.status(201).json(newCommunity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get communities (optional search by name)
router.get('/', authenticate, async (req, res) => {
  try {
    const search = req.query.search || '';
    const communities = await Community.find({ name: { $regex: search, $options: 'i' } })
      .populate('members', '_id username')
      .populate('creator', '_id username');
    
    // Clean up the communities data by filtering out null members
    const cleanedCommunities = communities.map(community => {
      const cleanCommunity = community.toObject();
      cleanCommunity.members = cleanCommunity.members.filter(member => member !== null);
      return cleanCommunity;
    });
    
    console.log('Fetched communities:', cleanedCommunities.map(c => ({
      id: c._id,
      name: c.name,
      members: c.members.map(m => m._id.toString()),
      creator: c.creator?._id.toString()
    })));
    
    res.json(cleanedCommunities);
  } catch (err) {
    console.error('Error fetching communities:', err);
    res.status(500).json({ error: err.message });
  }
});

// Join a community
router.post('/:communityId/join', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // First verify the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Then find the community
    const community = await Community.findById(req.params.communityId);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }
    
    // Clean up members array by filtering out null values
    community.members = community.members.filter(member => member !== null);
    
    // Check if user is already a member
    const isMember = community.members.some(memberId => memberId.toString() === userId.toString());
    if (isMember) {
      return res.status(400).json({ error: 'User already a member' });
    }

    // Add user to community members
    community.members.push(userId);
    await community.save();

    // Add habit if it doesn't exist
    const existingHabit = await Habit.findOne({ owner: userId, name: community.habitName });
    if (!existingHabit) {
      const colors = ['#e74c3c', '#8e44ad', '#3498db', '#27ae60', '#f1c40f'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const newHabit = new Habit({ 
        name: community.habitName, 
        time: 'TBD', 
        color: randomColor, 
        owner: userId 
      });
      await newHabit.save();
      
      // Initialize user.habits if it doesn't exist
      if (!user.habits) {
        user.habits = [];
      }
      user.habits.push(newHabit._id);
      await user.save();
    }

    // Return the updated community
    const updatedCommunity = await Community.findById(community._id)
      .populate('members', '_id username')
      .populate('creator', '_id username');
    
    // Clean up the response
    const cleanCommunity = updatedCommunity.toObject();
    cleanCommunity.members = cleanCommunity.members.filter(member => member !== null);
    
    res.json({ message: 'Joined community successfully', community: cleanCommunity });
  } catch (err) {
    console.error('Error joining community:', err);
    res.status(500).json({ error: err.message });
  }
});

// Leave a community
router.post('/:communityId/leave', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const community = await Community.findById(req.params.communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    
    // Clean up members array and remove the user
    community.members = community.members.filter(memberId => memberId?.toString() !== userId.toString());
    await community.save();

    // Return the updated community with populated data
    const updatedCommunity = await Community.findById(community._id)
      .populate('members', '_id username')
      .populate('creator', '_id username');
    
    // Clean up the response
    const cleanCommunity = updatedCommunity.toObject();
    cleanCommunity.members = cleanCommunity.members.filter(member => member !== null);
    
    res.json({ message: 'Left community successfully', community: cleanCommunity });
  } catch (err) {
    console.error('Error leaving community:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a community (only the creator can delete)
router.delete('/:communityId', authenticate, async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Verify ownership
    if (community.creator.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this community' });
    }

    await community.deleteOne();
    res.json({ message: 'Community deleted successfully' });
  } catch (err) {
    console.error('Error deleting community:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
