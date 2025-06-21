const express = require("express")
const { requiresAuth } = require("express-openid-connect")
const router = express.Router()
const mongoose = require('mongoose')

const Owner = require('../models/owner');

router.get('/', requiresAuth(), (req, res) => {
    res.render('complete-profile', { email: req.oidc.user.email })
})
router.post('/', async (req, res) => {
  const { name, email, phoneno } = req.body;
  const userEmail = req.oidc?.user?.email || req.query?.testEmail;

  try {
    const updatedOwner = await Owner.findOneAndUpdate(
      { email: userEmail }, // Find by email
      {
        name,
        phoneno,
        profileCompletion: true
      },
      { new: true } // Return the updated document
    );

    if (!updatedOwner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found with that email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Owner updated successfully',
      data: updatedOwner
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error updating owner',
      error: err.message
    });
  }
});

module.exports = router