// backend/models/Habit.js
const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  time: { type: String, required: true },
  color: { type: String }, // Remove the default white color
  streak: { type: Number, default: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Habit', HabitSchema);
