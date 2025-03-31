// backend/routes/habits.js
const express = require('express');
const router = express.Router();
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

// Create habit
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, time, color, owner } = req.body;
    const newHabit = new Habit({ name, time, color, owner });
    await newHabit.save();
    res.status(201).json(newHabit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get habits for a user
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const habits = await Habit.find({ owner: req.params.userId });
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update habit streak
router.put('/:habitId/complete', authenticate, async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.habitId);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    habit.streak += 1;
    await habit.save();
    res.json(habit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update habit time
router.put('/:habitId', authenticate, async (req, res) => {
  try {
    const { reminderTime } = req.body;
    const habit = await Habit.findById(req.params.habitId);
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    habit.reminderTime = reminderTime;
    await habit.save();
    
    res.status(200).json(habit);
  } catch (err) {
    console.error('Error updating habit time:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a habit
router.delete('/:habitId', authenticate, async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.habitId);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Verify ownership
    if (habit.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this habit' });
    }

    await habit.deleteOne();
    res.json({ message: 'Habit deleted successfully' });
  } catch (err) {
    console.error('Error deleting habit:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
