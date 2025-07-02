const express = require('express');
const { requiresAuth } = require('express-openid-connect');
const Owner = require('../models/owner');
const Property = require('../models/property');
const Unit = require('../models/unit');

const router = express.Router();

/* ===============================
   GET /unit/:id/form
   Server-rendered form to create a unit
================================== */
router.get('/:id/form', requiresAuth(), async (req, res) => {
  const propertyId = req.params.id;
  try {
    const user = await Owner.findOne({ email: req.oidc.user.email });
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.render('createUnit', {
        name: user.name,
        error: 'No property found for this user.',
        formData: {},
        propertyId: null,
      });
    }

    res.render('createUnit', {
      name: user.name,
      error: null,
      formData: {},
      propertyId: property._id,
      propertyName: property.name,
    });
  } catch (err) {
    console.error(err);
    res.render('createUnit', {
      name: req.oidc.user.name,
      error: 'Error loading form.',
      formData: {},
      propertyId: null,
    });
  }
});

/* ===============================
   POST /unit/:id
   API endpoint to create a unit
================================== */
router.post('/:id', async (req, res) => {
  const propertyId = req.params.id;
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
    const newUnit = new Unit({
      propertyId,
      roomId,
      roomArea,
      floor,
      rentCost,
      maintenanceCost,
      bescomNumber,
      hasWaterConnection: hasWaterConnection === 'on',
      hasIndependentToilet: hasIndependentToilet === 'on',
    });

    await newUnit.save();

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    property.units.push(newUnit._id);
    await property.save();

    res.status(201).json({
      success: true,
      message: 'Unit created successfully',
      data: newUnit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to create unit',
      error: error.message,
      formData: req.body,
    });
  }
});

/* ===============================
   GET /unit/:id
   API endpoint to fetch a unit,
   populated with tenant & property
================================== */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { testEmail } = req.query; // optional: track/test requests by email

  try {
    const unit = await Unit.findById(id)
      .populate('tenant')
      .populate('propertyId');

    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }

    console.log('✅ API returning unit with populated tenant:', unit);

    return res.status(200).json({
      success: true,
      data: { unit },
    });
  } catch (err) {
    console.error('❌ Error fetching unit with tenant:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  }
});

module.exports = router;
