const mongoose = require('mongoose');
const Message = require('../models/conversation/message');
const User = require('../models/user'); // Adjust path to your User model
const Tenant = require('../models/tenant'); // Adjust path to your Tenant model

// Create new message
// Create new message
exports.createMessage = async (req, res) => {
  try {
    const { sender, recipients, subject, body } = req.body;
    console.log("Incoming message payload:", { sender, recipients, subject, body });

    if (!sender || typeof sender !== "string") {
      return res.status(400).json({ error: "Invalid or missing sender email" });
    }
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: "At least one recipient ID is required" });
    }
    if (!recipients.every(id => mongoose.isValidObjectId(id))) {
      return res.status(400).json({ error: "One or more recipient IDs are invalid" });
    }
    if (!subject || !body) {
      return res.status(400).json({ error: "Subject and body are required" });
    }

    // ✅ Try to find sender first in User, then Tenant
    let senderDoc = await User.findOne({ email: sender });
    if (!senderDoc) {
      senderDoc = await Tenant.findOne({ email: sender });
    }
    if (!senderDoc) {
      return res.status(400).json({ error: "Sender email does not exist in User or Tenant collection" });
    }

    const invalidRecipients = [];
    for (const id of recipients) {
      const tenantExists = await Tenant.findById(id);
      if (!tenantExists) invalidRecipients.push(id);
    }
    if (invalidRecipients.length > 0) {
      return res.status(400).json({ error: `Invalid recipient IDs: ${invalidRecipients.join(", ")}` });
    }

    const message = await Message.create({
      sender: senderDoc._id, // ✅ store sender's ObjectId
      recipients,
      subject,
      body
    });

    res.status(201).json(message);
  } catch (err) {
    console.error("Error in createMessage:", err);
    res.status(500).json({ error: err.message });
  }
};



// Get all messages for a user (sent or received)
exports.getMessagesForUser = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { recipients: userId },
      ],
    }).populate('sender recipients responses.responder');
    res.json(messages);
  } catch (err) {
    console.error("Error in getMessagesForUser:", err);
    res.status(500).json({ error: err.message });
  }
};

// Respond to a message
exports.respondToMessage = async (req, res) => {
  const { responder, message } = req.body;
  const { id } = req.params;
  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }
    if (!mongoose.isValidObjectId(responder)) {
      return res.status(400).json({ error: "Invalid responder ID" });
    }
    if (!message) {
      return res.status(400).json({ error: "Response message is required" });
    }
    const updated = await Message.findByIdAndUpdate(
      id,
      {
        $push: { responses: { responder, message } },
        $set: { status: 'responded' },
      },
      { new: true }
    ).populate('sender recipients responses.responder');
    if (!updated) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json(updated);
  } catch (err) {
    console.error("Error in respondToMessage:", err);
    res.status(500).json({ error: err.message });
  }
};

// Close a message
exports.closeMessage = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }
    const updated = await Message.findByIdAndUpdate(
      id,
      { $set: { status: 'closed' } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json(updated);
  } catch (err) {
    console.error("Error in closeMessage:", err);
    res.status(500).json({ error: err.message });
  }
};