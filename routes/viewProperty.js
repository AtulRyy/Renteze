const express = require("express");
const owner = require("../models/owner");
const property = require("../models/property");
const Unit = require("../models/unit");

const router = express.Router();

/**
 * GET /property
 * Fetch all properties for a given owner email: /property?testEmail=someone@example.com
 */
router.get("/", async (req, res) => {
  const testEmail = req.query.testEmail;

  try {
    const userEmail = req.oidc?.user?.email || testEmail;
    console.log("[Fetch Properties] Using email:", userEmail);

    const user = await owner.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Owner not found for the provided email",
      });
    }

    const properties = await property.find({ ownerId: user._id });

    res.json({
      success: true,
      properties,
    });
  } catch (error) {
    console.error("[Fetch Properties] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving properties",
      error: error.message,
    });
  }
});

/**
 * GET /property/:id?testEmail=someone@example.com
 * Fetch details for a single property with its units
 */
router.get("/:id", async (req, res) => {
  const propertyId = req.params.id;
  const testEmail = req.query.testEmail;

  try {
    const userEmail = req.oidc?.user?.email || testEmail;
    console.log("[Property View] Using email:", userEmail);

    const user = await owner.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Owner not found for the provided email",
      });
    }

    const currentProperty = await property.findById(propertyId);
    if (!currentProperty) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Verify ownership of property
    if (currentProperty.ownerId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this property",
      });
    }

    const units = await Unit.find({ _id: { $in: currentProperty.units } });

    res.json({
      success: true,
      data: {
        property: currentProperty,
        units,
        ownerName: user.name || "Unknown Owner",
      },
    });
  } catch (error) {
    console.error("[Property View] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving property",
      error: error.message,
    });
  }
});

/**
 * 🔥 NEW: GET /property/:id/units?testEmail=someone@example.com
 * Fetch only the units for a property, for your TenantForm unit selector.
 */
router.get("/:id/units", async (req, res) => {
  const propertyId = req.params.id;
  const testEmail = req.query.testEmail;

  try {
    const userEmail = req.oidc?.user?.email || testEmail;
    console.log("[Fetch Units] Using email:", userEmail);

    const user = await owner.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Owner not found for the provided email",
      });
    }

    const currentProperty = await property.findById(propertyId);
    if (!currentProperty) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (currentProperty.ownerId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view units of this property",
      });
    }

    const units = await Unit.find({ _id: { $in: currentProperty.units } });

    res.json({
      success: true,
      units,
    });
  } catch (error) {
    console.error("[Fetch Units] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving units",
      error: error.message,
    });
  }
});


router.post('/property/:unitId/tenant', async (req, res) => {
  const { unitId } = req.params;
  const testEmail = req.query.testEmail;
  const tenantData = req.body;

  try {
    const userEmail = req.oidc?.user?.email || testEmail;
    console.log("[Add Tenant] Using email:", userEmail);

    const ownerUser = await owner.findOne({ email: userEmail });
    if (!ownerUser) {
      return res.status(404).json({
        success: false,
        message: "Owner not found for the provided email",
      });
    }

    // ✅ Check that the unit exists and belongs to this owner
    const unitDoc = await Unit.findById(unitId).populate('propertyId');
    if (!unitDoc) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }
    if (unitDoc.propertyId.ownerId.toString() !== ownerUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to add tenant to this unit",
      });
    }

    // ✅ Create and save the tenant
    const newTenant = new tenant({
      ...tenantData,
      unit: unitId,
    });
    await newTenant.save();

    res.json({
      success: true,
      message: "Tenant added successfully",
      tenant: newTenant,
    });
  } catch (error) {
    console.error("[Add Tenant] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding tenant",
      error: error.message,
    });
  }
});



module.exports = router;



