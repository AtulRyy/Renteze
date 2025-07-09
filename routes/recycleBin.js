const express = require("express");
const router = express.Router();
const History = require("../models/history");
const Property = require("../models/property");
const Unit = require("../models/unit");

// GET deleted items (recycle bin)
router.get("/", async (req, res) => {
  try {
    const email = req.query.email || "system";

    const items = await History.find({
      $or: [{ userEmail: email }, { userEmail: "system" }],
      status: "deleted",
    }).sort({ date: -1 });

    const formatted = items.map((item) => ({
      ...item._doc,
      deletedAt: item.date,
    }));

    res.json({ items: formatted });
  } catch (err) {
    console.error("❌ Error fetching recycle bin items:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /recycle-bin/restore/:id
router.post("/restore/:id", async (req, res) => {
  try {
    const historyItem = await History.findById(req.params.id);

    if (!historyItem) {
      return res.status(404).json({ success: false, message: "History item not found" });
    }

    let restoreResult = null;

    // Handle different types of deleted items
    if (historyItem.type === "property") {
      restoreResult = await Property.findByIdAndUpdate(historyItem.referenceId, {
        deleted: false,
        deletedAt: null,
      });
    } else if (historyItem.type === "unit") {
      restoreResult = await Unit.findByIdAndUpdate(historyItem.referenceId, {
        deleted: false,
        deletedAt: null,
      });
    } else {
      return res.status(400).json({ success: false, message: "Unsupported item type" });
    }

    if (!restoreResult) {
      return res.status(404).json({ success: false, message: "Referenced item not found" });
    }

    // Delete the history record
    await History.findByIdAndDelete(historyItem._id);

    res.status(200).json({ success: true, message: "✅ Restored successfully" });

  } catch (err) {
    console.error("❌ Error restoring item:", err);
    res.status(500).json({ success: false, message: "❌ Restore failed" });
  }
});

module.exports = router;
