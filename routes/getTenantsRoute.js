const express = require('express');
const router = express.Router();
const Owner = require('../models/owner');
const Property = require('../models/property');
const Unit = require('../models/unit');
const Tenant = require('../models/tenant');

// GET /tenants/owner-by-email?email=example@example.com
router.get('/owner-by-email', async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ message: 'Email query parameter is required.' });
  }

  try {
    // 1️⃣ Owner find
    const owner = await Owner.findOne({ email }).select('_id');
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found with this email.' });
    }

    const ownerId = owner._id;

    // 2️⃣ Owner ki properties find karo
    const properties = await Property.find({ ownerId }).select('_id');
    const propertyIds = properties.map(p => p._id);

    if (propertyIds.length === 0) {
      return res.status(404).json({ message: 'No properties found for this owner.' });
    }

    // 3️⃣ Properties ke units find karo
    const units = await Unit.find({ propertyId: { $in: propertyIds } }).select('_id propertyId roomId');
    const unitIds = units.map(u => u._id);

    if (unitIds.length === 0) {
      return res.status(404).json({ message: 'No units found under these properties.' });
    }

    // 4️⃣ Tenants fetch karo aur unke units ko populate karo
    const tenants = await Tenant.find({ unit: { $in: unitIds } })
      .populate({
        path: 'unit',
        select: 'roomId propertyId',
        populate: {
          path: 'propertyId', // 🟢 propertyId ko bhi populate karo
          select: 'name',     // sirf property ka naam chahiye
        },
      })
      .lean();

    res.status(200).json({ count: tenants.length, tenants });
  } catch (err) {
    console.error('Error fetching tenants for owner by email:', err);
    res.status(500).json({ error: 'Server error while fetching tenants' });
  }
});

// ✅ Edit Tenant API
router.put('/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const ownerEmail = req.query.testEmail;
  const updateData = req.body;

  console.log("📥 Update Request:", updateData);

  try {
    const updatedTenant = await Tenant.findOneAndUpdate(
      { _id: tenantId, ownerEmail },
      { $set: updateData },
      { new: true }
    );

    if (!updatedTenant) {
      return res.status(404).json({ success: false, message: "Tenant not found" });
    }

    console.log("✅ Tenant updated:", updatedTenant);
    res.status(200).json({ success: true, message: "Tenant updated successfully", tenant: updatedTenant });
  } catch (error) {
    console.error("❌ Update Failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Delete Tenant API
router.delete('/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const ownerEmail = req.query.testEmail;

  try {
    const deletedTenant = await Tenant.findOneAndDelete({ _id: tenantId, ownerEmail });

    if (!deletedTenant) {
      return res.status(404).json({ success: false, message: "Tenant not found" });
    }

    console.log("✅ Tenant deleted:", deletedTenant);
    res.status(200).json({ success: true, message: "Tenant deleted successfully" });
  } catch (error) {
    console.error("❌ Delete Failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/tenant/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const { email } = req.query;

  if (!email) return res.status(400).json({ message: 'Owner email is required' });

  try {
    const tenant = await Tenant.findOne({ _id: tenantId, ownerEmail: email });
    if (!tenant) {
      return res.status(404).json({ success: false, message: "Tenant not found" });
    }
    res.status(200).json({ success: true, tenant });
  } catch (err) {
    console.error("❌ Error fetching tenant:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});




module.exports = router;
