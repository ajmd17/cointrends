const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  emailAddress: {
    type: String,
    required: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  lastLoginDate: Date,
  alertOptions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const User = mongoose.model('User', userSchema);

module.exports = { User, userSchema };