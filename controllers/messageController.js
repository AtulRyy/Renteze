const Message = require('../models/conversation/message');
const mongoose=require('mongoose')

// Create new message
exports.createMessage = async (req, res) => {
  try {
    const { sender, recipients, subject, body } = req.body;
    const message = await Message.create({ sender, recipients, subject, body });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all messages for a user (sent or received)
exports.getMessagesForUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { recipients: userId }
      ]
    }).populate('sender recipients responses.responder');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Respond to a message
exports.respondToMessage = async (req, res) => {
  const { responder, message } = req.body;
  try {
    const updated = await Message.findByIdAndUpdate(
      req.params.id,
      {
        $push: { responses: { responder, message } },
        $set: { status: 'responded' }
      },
      { new: true }
    ).populate('sender recipients responses.responder');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Close a message
exports.closeMessage = async (req, res) => {
  try {
    const updated = await Message.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'closed' } },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
