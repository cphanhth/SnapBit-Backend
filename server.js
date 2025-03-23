// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import route modules
const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const postRoutes = require('./routes/posts');
const postRoutes = require('./routes/friends');
const postRoutes = require('./routes/communities');

const app = express();
app.use(express.json());
app.use(cors());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/communities', communitiesRoutes);

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
