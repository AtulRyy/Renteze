const express = require("express");
const router = express.Router();
const Owner = require('../models/owner');

router.get('/', (req, res) => { 
  res.render('complete-profile', { email: req.oidc?.user?.email || req.query?.testEmail });
});

router.get('/get', async (req, res) => {
  const userEmail = req.oidc?.user?.email || req.query?.testEmail;

  try {
    const owner = await Owner.findOne({ email: userEmail });
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found with that email'
      });
    }

    res.status(200).json({
      success: true,
      data: owner
    });
  } catch (err) {
    console.error("Error fetching owner:", err);
    res.status(500).json({
      success: false,
      message: 'Error fetching owner data',
      error: err.message
    });
  }
});

router.post('/', async (req, res) => {
  const { name, phoneno, location, dateOfBirth, emailNotifications } = req.body;
  const userEmail = req.oidc?.user?.email || req.query?.testEmail;

  try {
    const updatedOwner = await Owner.findOneAndUpdate(
      { email: userEmail },
      {
        name,
        phoneno,
        location,
        dateOfBirth,
        emailNotifications,
        profileCompletion: true
      },
      { new: true }
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
    console.error("Error updating owner:", err);
    res.status(500).json({
      success: false,
      message: 'Error updating owner',
      error: err.message
    });
  }
});

module.exports = router;
