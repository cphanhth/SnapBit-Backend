const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePic: {
    type: String,
    default: '',
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  incomingFriendRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  outgoingFriendRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  habits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
  }],
  accountCreated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);