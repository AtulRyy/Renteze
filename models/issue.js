const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema({
  title: String,
  description: String,
  priority: String,
  status: {
    type: String,
    enum: ["open", "in progress", "resolved"],
    default: "open",
  },
  property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" }, // Add tenant field
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Issue", issueSchema);
