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
    const owner = await Owner.findOne({ email }).select('_id');
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found with this email.' });
    }

    const ownerId = owner._id;

    const properties = await Property.find({ ownerId }).select('_id');
    const propertyIds = properties.map(p => p._id);

    if (propertyIds.length === 0) {
      return res.status(404).json({ message: 'No properties found for this owner.' });
    }

    const units = await Unit.find({ propertyId: { $in: propertyIds } }).select('_id');
    const unitIds = units.map(u => u._id);

    if (unitIds.length === 0) {
      return res.status(404).json({ message: 'No units found under these properties.' });
    }

    const tenants = await Tenant.find({ unit: { $in: unitIds } })
      .populate('unit', 'roomId propertyId')
      .lean();

    res.status(200).json({ count: tenants.length, tenants });
  } catch (err) {
    console.error('Error fetching tenants for owner by email:', err);
    res.status(500).json({ error: 'Server error while fetching tenants' });
  }
});

module.exports = router;