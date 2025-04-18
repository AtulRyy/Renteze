const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Tenant = require('../models/tenant');
const unit = require('../models/unit');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const cpUpload = upload.fields([
  { name: 'proofOfAddress', maxCount: 1 },
  { name: 'proofOfBusiness', maxCount: 1 },
  { name: 'proofOfIdentity', maxCount: 1 },
  { name: 'agreementDraft', maxCount: 1 },
  { name: 'agreementCopy', maxCount: 1 }
]);

// Render the form
router.get('/:id', (req, res) => {
  const unitId = req.params.id
  res.render('addTenant', { error: null, unitId });
});

// Handle tenant creation
router.post('/:id', cpUpload, async (req, res) => {
  const unitId = req.params.id
  try {
    const {
      name, email, phone,
      nameOfBusiness, natureOfBusiness,
      rent, advance, agreementStartDate, agreementEndDate, annualIncrement
    } = req.body;

    const tenant = new Tenant({
      unit: unitId,
      name,
      email,
      phone,
      nameOfBusiness,
      natureOfBusiness,
      rent,
      advance,
      agreementStartDate,
      agreementEndDate,
      annualIncrement,
      uploads: {
        proofOfAddress: req.files['proofOfAddress'][0].path,
        proofOfBusiness: req.files['proofOfBusiness'][0].path,
        proofOfIdentity: req.files['proofOfIdentity'][0].path,
        agreementDraft: req.files['agreementDraft'][0].path,
        agreementCopy: req.files['agreementCopy'][0].path
      }
    });

    await tenant.save();


    // Update the Unit
    await unit.findByIdAndUpdate(unitId, {
      isOccupied: true,
      tenant: tenant._id
    });

    res.redirect(`/unit/${unitId}`); // or redirect to a success page
  } catch (err) {
    console.error(err);
    res.render('addTenant', { error: 'Something went wrong. Please check your inputs.', unitId });
  }
});

module.exports = router;
