const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');

const Unit = require('../models/unit');
const Owner = require('../models/owner');
const Property = require('../models/property');

/**
 * 🔹 GET /unit/:id → Get single unit details
 */
router.get('/:id', /* requiresAuth(), */ async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id)
      .populate('propertyId')
      .populate('tenant');

    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }

    const user = await Owner.findOne({ email: req.oidc?.user?.email || req.query?.testEmail });
    if (!user || !unit.propertyId.ownerId.equals(user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({
      success: true,
      data: {
        unit,
        ownerName: user.name
      }
    });
  } catch (error) {
    console.error('Error fetching unit:', error);
    res.status(500).json({
      success: false,
      message: 'Server error loading unit details',
      error: error.message
    });
  }
});

/**
 * 🔹 GET /unit/property/:propertyId → Get all units for a property
 */
router.get('/property/:propertyId', /* requiresAuth(), */ async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const user = await Owner.findOne({ email: req.oidc?.user?.email || req.query?.testEmail });

    const property = await Property.findById(propertyId).populate({
      path: 'units',
      populate: { path: 'tenant' }
    });

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    if (!user || !property.ownerId.equals(user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({
      success: true,
      units: property.units
    });
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({
      success: false,
      message: 'Server error loading units',
      error: error.message
    });
  }
});

/**
 * 🔹 POST /unit/property/:propertyId/create → Create a new unit
 */
router.post('/property/:propertyId/create', /* requiresAuth(), */ async (req, res) => {
  const propertyId = req.params.propertyId;

  const {
    roomId,
    roomArea,
    floor,
    rentCost,
    maintenanceCost,
    bescomNumber,
    hasWaterConnection,
    hasIndependentToilet,
  } = req.body;

  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const user = await Owner.findOne({ email: req.oidc?.user?.email || req.query?.testEmail });
    if (!user || !property.ownerId.equals(user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const newUnit = new Unit({
      propertyId,
      roomId,
      roomArea,
      floor,
      rentCost,
      maintenanceCost,
      bescomNumber,
      hasWaterConnection: hasWaterConnection === 'on' || hasWaterConnection === true,
      hasIndependentToilet: hasIndependentToilet === 'on' || hasIndependentToilet === true,
      occupancyStatus: req.body.occupancyStatus, // ✅ ensure this is included
    });

    await newUnit.save();

    property.units.push(newUnit._id);
    await property.save();

    res.status(201).json({
      success: true,
      message: 'Unit created successfully',
      data: newUnit
    });
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating unit',
      error: error.message
    });
  }
});

/**
 * 🔹 PATCH /unit/:unitId → Update a unit
 */
router.patch('/:unitId', /* requiresAuth(), */ async (req, res) => {
  try {
    const { unitId } = req.params;
    const updates = req.body;

    const unit = await Unit.findById(unitId).populate('propertyId');
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }

    const user = await Owner.findOne({ email: req.oidc?.user?.email || req.query?.testEmail });
    if (!user || !unit.propertyId.ownerId.equals(user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Apply updates directly
    Object.keys(updates).forEach((key) => {
      unit[key] = updates[key];
    });

    await unit.save();

    res.json({
      success: true,
      message: 'Unit updated successfully',
      data: unit,
    });
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating unit',
      error: error.message,
    });
  }
});


/**
 * 🔹 DELETE /unit/:unitId → Delete a unit
 */
router.delete('/:unitId', /* requiresAuth(), */ async (req, res) => {
  try {
    const { unitId } = req.params;

    const unit = await Unit.findById(unitId).populate('propertyId');
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }

    const user = await Owner.findOne({ email: req.oidc?.user?.email || req.query?.testEmail });
    if (!user || !unit.propertyId.ownerId.equals(user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Remove unit from property's units array
    await Property.findByIdAndUpdate(unit.propertyId._id, {
      $pull: { units: unit._id },
    });

    // Delete the unit itself
    await Unit.findByIdAndDelete(unitId);

    res.json({
      success: true,
      message: 'Unit deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting unit',
      error: error.message,
    });
  }
});

module.exports = router;
