const mongoose = require("mongoose");
const Message = require("../models/conversation/message");
const User = require("../models/user");
const Tenant = require("../models/tenant");
const Owner = require("../models/owner"); // ✅ Import Owner model

// ✅ Create new message

// ✅ Create new message with correct recipient ID in notification
// ✅ Create new message with correct recipient ID in notification
exports.createMessage = async (req, res) => {
  try {
    const { senderEmail, recipientEmail, subject, body } = req.body;
    console.log("Incoming payload:", { senderEmail, recipientEmail, subject, body });

    if (!senderEmail || typeof senderEmail !== "string") {
      return res.status(400).json({ error: "Invalid or missing sender email" });
    }
    if (!recipientEmail || typeof recipientEmail !== "string") {
      return res.status(400).json({ error: "Invalid or missing recipient email" });
    }
    if (!subject || !body) {
      return res.status(400).json({ error: "Subject and body are required" });
    }

    const Owner = require("../models/user");
    const Tenant = require("../models/tenant");
    const Message = require("../models/conversation/message");
    const Notification = require("../models/notification");

    // ✅ Find sender in Owner or Tenant
    let senderDoc = await Owner.findOne({ email: senderEmail });
    if (!senderDoc) senderDoc = await Tenant.findOne({ email: senderEmail });
    if (!senderDoc) {
      return res.status(400).json({ error: "Sender email does not exist" });
    }

    // ✅ Find recipient in Owner or Tenant
    let recipientDoc = await Owner.findOne({ email: recipientEmail });
    if (!recipientDoc) recipientDoc = await Tenant.findOne({ email: recipientEmail });
    if (!recipientDoc) {
      return res.status(400).json({ error: "Recipient email does not exist" });
    }

    // ✅ Create message with recipient ID
    const message = await Message.create({
      sender: senderDoc._id,
      recipients: [recipientDoc._id],
      subject,
      body,
    });

    // ✅ Create notification with sender + recipient ID (required)
    const notification = await Notification.create({
      sender: senderDoc._id,                  // ✅ IMPORTANT: required field
      recipients: [recipientDoc._id],
      title: `New message: ${subject}`,
      body                                   // optional but good to include for context
    });

    console.log(`✅ Notification created for user ${recipientDoc._id}`);
    res.status(201).json(message);
  } catch (err) {
    console.error("❌ Error in createMessage:", err);
    res.status(500).json({ error: err.message });
  }
};




// ✅ Get all messages for a user (sent or received)
exports.getMessagesForUser = async (req, res) => {
  try {
    const identifier = req.query.email;
    if (!identifier || typeof identifier !== "string") {
      return res.status(400).json({ error: "Missing or invalid email query parameter" });
    }
    console.log("Searching user by identifier:", identifier);

    const User = require("../models/user");
    const Tenant = require("../models/tenant");

    const userDoc = await User.findOne({ email: new RegExp(`^${identifier}$`, "i") });
    console.log("User collection lookup result:", userDoc);

    const tenantDoc = await Tenant.findOne({ email: new RegExp(`^${identifier}$`, "i") });
    console.log("Tenant collection lookup result:", tenantDoc);

    if (!userDoc && !tenantDoc) {
      console.log("User not found in User or Tenant collections");
      return res.status(404).json({ error: "User not found" });
    }

    const userIdsToSearch = [];
    if (userDoc?._id) userIdsToSearch.push(userDoc._id);
    if (tenantDoc?._id) userIdsToSearch.push(tenantDoc._id);

    const Message = require("../models/conversation/message");
    const messages = await Message.find({
      $or: [
        { sender: { $in: userIdsToSearch } },
        { recipients: { $in: userIdsToSearch } }
      ]
    }).populate("sender recipients responses.responder");

    console.log(`Found ${messages.length} messages for user IDs: ${userIdsToSearch}`);
    res.json(messages);
  } catch (err) {
    console.error("Error in getMessagesForUser:", err);
    res.status(500).json({ error: err.message });
  }
};




// ✅ Respond to a message
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
        $set: { status: "responded" },
      },
      { new: true }
    ).populate("sender recipients responses.responder");
    if (!updated) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json(updated);
  } catch (err) {
    console.error("Error in respondToMessage:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Close a message
exports.closeMessage = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }
    const updated = await Message.findByIdAndUpdate(
      id,
      { $set: { status: "closed" } },
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


