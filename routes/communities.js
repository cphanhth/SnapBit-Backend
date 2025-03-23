// backend/routes/communities.js
const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const User = require('../models/User');
const Habit = require('../models/Habit');

// Create a new community
router.post('/', async (req, res) => {
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
router.get('/', async (req, res) => {
  try {
    const search = req.query.search || '';
    const communities = await Community.find({ name: { $regex: search, $options: 'i' } });
    res.json(communities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join a community
router.post('/:communityId/join', async (req, res) => {
  try {
    const { userId } = req.body;
    const community = await Community.findById(req.params.communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    // Check if user is already a member
    if (community.members.includes(userId)) {
      return res.status(400).json({ error: 'User already a member' });
    }
    community.members.push(userId);
    await community.save();

    // Auto-add the community habit to the user's habits if it doesn't exist
    const user = await User.findById(userId);
    const existingHabit = await Habit.findOne({ owner: userId, name: community.habitName });
    if (!existingHabit) {
      const colors = ['#e74c3c', '#8e44ad', '#3498db', '#27ae60', '#f1c40f'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const newHabit = new Habit({ name: community.habitName, time: 'TBD', color: randomColor, owner: userId });
      await newHabit.save();
      user.habits.push(newHabit._id);
      await user.save();
    }
    res.json({ message: 'Joined community successfully', community });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leave a community
router.post('/:communityId/leave', async (req, res) => {
  try {
    const { userId } = req.body;
    const community = await Community.findById(req.params.communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    community.members = community.members.filter(memberId => memberId.toString() !== userId);
    await community.save();
    res.json({ message: 'Left community successfully', community });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a community (only the creator can delete)
router.delete('/:communityId', async (req, res) => {
  try {
    const { userId } = req.body; // The creator's user ID
    const community = await Community.findById(req.params.communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (community.creator.toString() !== userId) {
      return res.status(403).json({ error: 'Only the creator can delete the community' });
    }
    await community.remove();
    res.json({ message: 'Community deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
