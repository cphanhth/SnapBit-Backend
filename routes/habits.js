// backend/routes/habits.js
const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');

// Middleware to check JWT would go here

// Create habit
router.post('/', async (req, res) => {
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
router.get('/:userId', async (req, res) => {
  try {
    const habits = await Habit.find({ owner: req.params.userId });
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update and delete routes can be added similarly

module.exports = router;
