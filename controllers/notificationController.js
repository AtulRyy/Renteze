const mongoose = require("mongoose");
const Notification = require("../models/notification");
const Owner = require("../models/user");
const Tenant = require("../models/tenant");

// ✅ GET /api/users/by-email/:email
exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const user =
      (await Owner.findOne({ email })) || (await Tenant.findOne({ email }));
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error in getUserByEmail:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ POST /notifications
exports.sendNotification = async (req, res) => {
  try {
    const { senderEmail, recipientEmails, title, body } = req.body;
    console.log("🔎 Requested senderEmail:", senderEmail);
    console.log("🔎 Requested recipientEmails:", recipientEmails);

    const sender =
      (await Owner.findOne({ email: senderEmail })) ||
      (await Tenant.findOne({ email: senderEmail }));
    if (!sender) return res.status(404).json({ error: "Sender not found" });

    let allRecipients = [];
    for (const email of recipientEmails) {
      const recipient =
        (await Owner.findOne({ email })) || (await Tenant.findOne({ email }));
      if (recipient) {
        allRecipients.push(recipient);
      } else {
        console.warn(`⚠️ Recipient not found: ${email}`);
      }
    }

    if (!allRecipients.length)
      return res.status(404).json({ error: "No valid recipients found" });

    console.log(
      "✅ Found recipients:",
      allRecipients.map((r) => r.email)
    );

    const notification = await Notification.create({
      sender: sender._id,
      recipients: allRecipients.map((r) => r._id),
      title,
      body,
    });

    console.log(
      `✅ Notification created with recipients:`,
      allRecipients.map((r) => r.email)
    );
    res.status(201).json({ notification });
  } catch (err) {
    console.error("❌ Error in sendNotification:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ GET /notifications?email=user@example.com
exports.getNotificationsByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email is required" });

    let user =
      (await Owner.findOne({ email })) || (await Tenant.findOne({ email }));

    if (!user) {
      console.warn(`⚠️ User not found for email: ${email}`);
      return res.status(404).json({ error: "User not found" });
    }


    try {
      const notifications = await Notification.find({ recipients: user._id })
        .sort({ createdAt: -1 })
        .populate("sender", "email")
        .populate("recipients", "email");

      res.json({ notifications });
    } catch (innerErr) {
      console.error("🔥 Inner error during notifications fetch:", innerErr);
      res.status(500).json({ error: "Failed to fetch notifications", details: innerErr.message });
    }
  } catch (err) {
    console.error("❌ Error in getNotificationsByEmail:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};


// ✅ GET /notifications/user/:userId
exports.getNotificationsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ error: "Invalid userId" });

    const notifications = await Notification.find({ recipients: userId })
      .sort({ createdAt: -1 })
      .populate("sender", "email")
      .populate("recipients", "email");

    res.json({ notifications });
  } catch (err) {
    console.error("Error in getNotificationsForUser:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ POST /notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user =
      (await Owner.findOne({ email })) || (await Tenant.findOne({ email }));
    if (!user) return res.status(404).json({ error: "User not found" });

    await Notification.updateOne(
      { _id: id },
      { $addToSet: { isReadBy: user._id } }
    );

    console.log(`✅ Notification ${id} marked as read by user ${user._id}`);
    res.json({ message: "Notification marked as read." });
  } catch (err) {
    console.error("❌ Error in markAsRead:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.markAllAsRead = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user =
      (await Owner.findOne({ email })) || (await Tenant.findOne({ email }));
    if (!user) return res.status(404).json({ error: "User not found" });

    // Delete all notifications for this user
    await Notification.deleteMany({ recipients: user._id });

    res.json({ message: "All notifications deleted for this user." });
  } catch (err) {
    console.error("Error deleting notifications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

