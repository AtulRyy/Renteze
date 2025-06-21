const express=require('express')
const owner = require('../models/owner')
const { requiresAuth } = require('express-openid-connect')
const property = require('../models/property')
const router=express.Router()
const Unit = require('../models/unit'); 


router.get('/:id', /* requiresAuth(), */ async (req, res) => {
  const propertyId = req.params.id;
  
  try {
    const userEmail = req.oidc?.user?.email || req.params.testEmail;

    const user = await owner.findOne({ email: userEmail });

    const currentProperty = await property.findById(propertyId)
      .populate('ownerId')
      .populate('units'); // populate units if any

    if (!currentProperty) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.json({
      success: true,
      data: {
        property: currentProperty,
        units: currentProperty.units,
        ownerName: user?.name || 'Unknown Owner'
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving property',
      error: error.message
    });
  }
});


module.exports=router