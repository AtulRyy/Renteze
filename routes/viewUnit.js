const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');

const Unit = require('../models/unit');
const Owner = require('../models/owner');
const Property = require('../models/property');

router.get('/:id', /*requiresAuth(),*/  async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id)
      .populate('propertyId')
      .populate('tenant');

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    const user = await Owner.findOne({ email: req.oidc?.user?.email || req.query?.testEmail });

    if (!unit.propertyId.ownerId.equals(user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this unit'
      });
    }

    res.json({
      success: true,
      data: {
        unit,
        ownerName: user.name
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error loading unit details',
      error: error.message
    });
  }
});

router.get('/property/:propertyId', async (req, res) => {
  console.log("API Call: GET /unit/property/" + req.params.propertyId);

  try {
    const property = await Property.findById(req.params.propertyId);

    if (!property) {
      console.log("Property not found for ID:", req.params.propertyId);
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const user = await Owner.findOne({ email: req.oidc?.user?.email || req.query?.testEmail });
    console.log("Fetched user:", user);

    if (!user) {
      console.log("No owner found for email:", req.oidc?.user?.email || req.query?.testEmail);
      return res.status(403).json({
        success: false,
        message: 'Owner not found'
      });
    }

    if (!property.ownerId.equals(user._id)) {
      console.log("Unauthorized: property.ownerId", property.ownerId, "user._id", user._id);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view units for this property'
      });
    }

    const units = await Unit.find({ propertyId: req.params.propertyId });
    console.log("Found units:", units.length);

    res.json({
      success: true,
      units
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: 'Server error loading property units',
      error: error.message
    });
  }
});

module.exports = router;
  