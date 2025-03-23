// backend/routes/posts.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// Create a new post (photo check-in)
router.post('/', async (req, res) => {
  try {
    const { user, habit, imageUrl } = req.body;
    const newPost = new Post({ user, habit, imageUrl });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch posts for home feed (e.g., from friends)
router.get('/', async (req, res) => {
  try {
    // You can extend this to filter posts based on friends or communities
    const posts = await Post.find().populate('user').populate('habit').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
