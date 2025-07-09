// models/history.js
const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  action: { type: String, required: true }, // e.g., 'delete_property'
  type: { type: String, required: true }, // e.g., 'property' or 'unit'
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  title: String,
  description: String,
  date: { type: Date, default: Date.now },
  amount: String, // optional, if used for payments
  status: { type: String, default: 'deleted' } // for filter in frontend
});

module.exports = mongoose.model('History', historySchema);
