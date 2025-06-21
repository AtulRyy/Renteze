const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');

const Unit = require('../models/unit');
const Owner = require('../models/owner');
const Property = require('../models/property');

// GET /unit/:id → Show unit details
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


module.exports = router;
