// backend/models/Community.js
const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  // The habit name associated with this community (e.g., "Morning Run")
  habitName: { 
    type: String, 
    required: true 
  },
  // Reference to the User model who created the community
  creator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Array of user IDs who have joined this community
  members: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Community', CommunitySchema);
