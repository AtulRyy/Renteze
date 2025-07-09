const express = require("express");
const { requiresAuth } = require("express-openid-connect");
const Owner = require("../models/owner");
const tenant = require("../models/tenant");
const userModel = require("../models/user");
const issue = require("../models/issue");
const Property = require("../models/property");
const Unit = require("../models/unit");
const router = express.Router();
const softDelete = require("../utils/softDelete"); 
const History = require("../models/history"); 

// GET: Dashboard Loader
router.get("/", async (req, res) => {
  const userEmail = req.oidc?.user?.email || req.query.testEmail;

  try {
    const user = await userModel.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).send("❌ User role not found.");
    }

    if (user.role === "owner") {
      const ownerUser = await Owner.findOne({ email: userEmail }).populate({
        path: "properties",
        match: { deleted: false }, // ✅ Show only non-deleted properties
      });

      if (!ownerUser) {
        return res.status(404).send("❌ Owner not found.");
      }

      const issues = await issue.find();

      return res.json({
        role: user.role,
        name: ownerUser.name,
        properties: ownerUser.properties,
        issues,
      });
    } else if (user.role === "tenant") {
      const tenantUser = await tenant.findOne({ email: userEmail });

      if (!tenantUser) {
        return res.status(404).send("❌ Tenant not found.");
      }

      return res.json({
        role: user.role,
        tenant: tenantUser,
      });
    } else if (user.role === "admin") {
      return res.json({
        role: user.role,
        message: "Admin dashboard under construction...",
      });
    }
  } catch (err) {
    console.error("Error checking user role:", err);
    res.status(500).send("❌ Server error.");
  }
});

// DELETE: Soft-delete a property and log to history
router.delete("/:propertyId", async (req, res) => {
  try {
    const { propertyId } = req.params;

    const propertyToDelete = await Property.findById(propertyId).populate("units");

    if (!propertyToDelete) {
      return res.status(404).json({
        success: false,
        message: "❌ Property not found",
      });
    }

    console.log("🗑️ Soft deleting property:", propertyToDelete._id);

    // ✅ Mark property as soft-deleted
    propertyToDelete.deleted = true;
    propertyToDelete.deletedAt = new Date();
    await propertyToDelete.save();

    // ✅ Log the soft-deletion to History
    await History.create({
      userEmail: req.oidc?.user?.email || "system",
      action: "delete_property",
      type: "property",
      referenceId: propertyToDelete._id,
      title: propertyToDelete.name,
      description: `Soft-deleted property with ${propertyToDelete.units.length} units`,
      status: "deleted",
    });

    console.log("✅ Soft delete completed. Property moved to history");

    res.status(200).json({
      success: true,
      message: "✅ Property soft-deleted and logged to history",
    });

  } catch (err) {
    console.error("Error soft-deleting property:", err);
    res.status(500).json({
      success: false,
      message: "❌ Internal server error",
    });
  }
});

module.exports = router;
