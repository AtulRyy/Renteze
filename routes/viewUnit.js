const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');

const Unit = require('../models/unit');
const Owner = require('../models/owner');
const Property = require('../models/property');

// GET /unit/:id → Show unit details
router.get('/:id', requiresAuth(), async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id).populate('propertyId');

    if (!unit) {
      return res.status(404).render('error', {
        message: 'Unit not found',
        error: {}
      });
    }

    const user = await Owner.findOne({ email: req.oidc.user.email });

    // Optional: Confirm the user owns this unit via property
    if (!unit.propertyId.ownerId.equals(user._id)) {
      return res.status(403).render('error', {
        message: 'Unauthorized to view this unit',
        error: {}
      });
    }

    res.render('viewUnit', { unit, name: user.name });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      message: 'Server error loading unit details',
      error
    });
  }
});

module.exports = router;
