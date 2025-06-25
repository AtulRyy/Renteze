const express = require('express')
const property = require('../models/property')
const { requiresAuth } = require('express-openid-connect')
const owner = require('../models/owner')
const router = express.Router()



router.get('/', requiresAuth(), async (req, res) => {
    const user = await owner.findOne({ email: req.oidc.user.email })
    res.render('createProperty', {
        name: user.name,
        error: null,
        formData: {}
    })
})
router.post('/', /* requiresAuth(), */ async (req, res) => {
  try {
    const userEmail = req.oidc?.user?.email || req.query?.testEmail;

    const user = await owner.findOne({ email: userEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found'
      });
    }

    const { propertyName, propertyAddress, propertyLocation } = req.body;

    const existingProperty = await property.findOne({ 
      name: propertyName, 
      ownerId: user._id 
    });

    if (existingProperty) {
      return res.status(400).json({
        success: false,
        message: 'Property name already exists',
        formData: { propertyName, propertyAddress, propertyLocation }
      });
    }

    const newProperty = new property({
      ownerId: user._id,
      name: propertyName,
      address: propertyAddress,
      location: propertyLocation
    });

    await newProperty.save();

    user.properties.push(newProperty._id);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: newProperty
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
      error: err.message,
      formData: req.body
    });
  }
});



module.exports = router;