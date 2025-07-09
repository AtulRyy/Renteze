// models/recycleBin.js
const mongoose = require("mongoose");

const recycleBinSchema = new mongoose.Schema({
  itemType: { type: String, required: true }, // 'property', 'unit', etc.
  data: { type: Object, required: true },
  deletedBy: { type: String, required: true },
  deletedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("RecycleBin", recycleBinSchema);
// This schema defines the structure of the Recycle Bin collection
// It includes the type of item deleted, the data of the item, who deleted it,