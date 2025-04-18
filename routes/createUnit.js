const express = require('express');
const { requiresAuth } = require('express-openid-connect');
const Owner = require('../models/owner');
const Property = require('../models/property');
const Unit = require('../models/unit');

const router = express.Router();

// GET route to show form
router.get('/:id', requiresAuth(), async (req, res) => {
  const propertyId = req.params.id;  // Extract propertyId from the URL param
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
      propertyId: property._id,  // Pass propertyId to the form for use in POST
      propertyName: property.name,  // Optional: send property name if needed
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

// POST route to create unit
router.post('/:id', requiresAuth(), async (req, res) => {
  const propertyId = req.params.id;  // Extract propertyId from the URL param

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
    property.units.push(newUnit._id);
    await property.save();

    res.redirect(`/property/${propertyId}`);
  } catch (error) {
    console.error(error);
    res.render('createUnit', {
      name: req.oidc.user.name,
      error: 'Failed to create unit.',
      formData: req.body,
      propertyId,
    });
  }
});

module.exports = router;
