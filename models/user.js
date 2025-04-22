// models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['owner', 'tenant', 'admin'], required: true }
});

module.exports = mongoose.model('User', userSchema);
