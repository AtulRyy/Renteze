const express = require('express');
const { requiresAuth } = require('express-openid-connect');
const Unit = require('../models/unit');
const Owner = require('../models/owner');
const Property = require('../models/property');

const router = express.Router();

// Render edit unit form
router.get('/:id', requiresAuth(), async (req, res) => {
  const user = await Owner.findOne({ email: req.oidc.user.email });
  const unit = await Unit.findById(req.params.id).populate('propertyId');

  if (!unit || !unit.propertyId.ownerId.equals(user._id)) {
    return res.status(403).send("Unauthorized");
  }

  res.render('editUnit', {
    name: user.name,
    unit,
    error: null
  });
});

// Handle update
router.post('/:id', requiresAuth(), async (req, res) => {
  const user = await Owner.findOne({ email: req.oidc.user.email });
  const {
    roomId, roomArea, floor,
    rentCost, maintenanceCost, bescomNumber,
    hasWaterConnection, hasIndependentToilet, isOccupied
  } = req.body;

  try {
    const unit = await Unit.findById(req.params.id).populate('propertyId');
    if (!unit || !unit.propertyId.ownerId.equals(user._id)) {
      return res.status(403).send("Unauthorized");
    }

    Object.assign(unit, {
      roomId,
      roomArea,
      floor,
      rentCost,
      maintenanceCost,
      bescomNumber,
      hasWaterConnection: hasWaterConnection === 'on',
      hasIndependentToilet: hasIndependentToilet === 'on',
      isOccupied: isOccupied === 'on'
    });

    await unit.save();
    res.redirect(`/unit/${req.params.id}`);
  } catch (err) {
    res.render('editUnit', {
      name: user.name,
      unit: req.body,
      error: 'Failed to update unit.'
    });
  }
});

module.exports = router;
