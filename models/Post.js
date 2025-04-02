// backend/models/Post.js
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  habit: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  imageUrl: { type: String, required: true },
  description: { type: String, default: '', trim: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Post', PostSchema);
