const express = require('express');
const { requiresAuth } = require('express-openid-connect');
const Property = require('../models/property');
const Owner = require('../models/owner');

const router = express.Router();

// Render edit form
router.get('/:id', requiresAuth(), async (req, res) => {
  const user = await Owner.findOne({ email: req.oidc.user.email });
  const property = await Property.findById(req.params.id);

  if (!property || !property.ownerId.equals(user._id)) {
    return res.status(403).send("Unauthorized");
  }

  res.render('editProperty', {
    name: user.name,
    property,
    error: null
  });
});

// Handle edit submission
router.post('/:id', requiresAuth(), async (req, res) => {
  const user = await Owner.findOne({ email: req.oidc.user.email });
  const { propertyName, propertyAddress, propertyLocation } = req.body;

  try {
    const updated = await Property.findOneAndUpdate(
      { _id: req.params.id, ownerId: user._id },
      {
        name: propertyName,
        address: propertyAddress,
        location: propertyLocation
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).send("Property not found or unauthorized");
    }

    res.redirect(`/property/${req.params.id}`);
  } catch (err) {
    res.render('editProperty', {
      name: user.name,
      property: { _id: req.params.id, name: propertyName, address: propertyAddress, location: propertyLocation },
      error: 'Failed to update property.'
    });
  }
});

module.exports = router;
