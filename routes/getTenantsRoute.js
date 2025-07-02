const express = require('express');
const router = express.Router();
const Property = require('../models/property');
const Unit = require('../models/unit');
const Tenant = require('../models/tenant');

// GET /tenants/owner/:ownerId
router.get('/owner/:ownerId', async (req, res) => {
  const ownerId = req.params.ownerId;

  try {
    const properties = await Property.find({ ownerId }).select('_id');
    const propertyIds = properties.map(p => p._id);
    console.log('Properties found:', propertyIds.length);

    if (propertyIds.length === 0) {
      return res.status(404).json({ message: 'No properties found for this owner.' });
    }

    const units = await Unit.find({ propertyId: { $in: propertyIds } }).select('_id');
    const unitIds = units.map(u => u._id);
    console.log('Units found:', unitIds.length);

    if (unitIds.length === 0) {
      return res.status(404).json({ message: 'No units found under these properties.' });
    }

    const tenants = await Tenant.find({ unit: { $in: unitIds } })
      .populate('unit', 'roomId propertyId')
      .lean();
      console.log('Tenants found:', tenants.length);

    res.status(200).json({ count: tenants.length, tenants });
  } catch (err) {
    console.error('Error fetching tenants for owner:', err);
    res.status(500).json({ error: 'Server error while fetching tenants' });
  }
});

module.exports = router;