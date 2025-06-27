const express = require('express');
const router  = express.Router();
const path    = require('path');
const multer  = require('multer');
const { requiresAuth } = require('express-openid-connect');

const Tenant   = require('../models/tenant');
const Unit     = require('../models/unit');
const Owner    = require('../models/owner');
const Property = require('../models/property');

/* ------------------------- Multer configuration ------------------------- */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
const cpUpload = upload.fields([
  { name: 'proofOfAddress',   maxCount: 1 },
  { name: 'proofOfBusiness',  maxCount: 1 },
  { name: 'proofOfIdentity',  maxCount: 1 },
  { name: 'agreementDraft',   maxCount: 1 },
  { name: 'agreementCopy',    maxCount: 1 }
]);

/* ---------------------------- GET /:id ---------------------------------- */
/* Render edit form with current tenant values */
router.get('/:id', requiresAuth(), async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).populate({
      path: 'unit',
      populate: { path: 'propertyId' }
    });

    if (!tenant) return res.status(404).send('Tenant not found');

    /* Security: ensure the logged-in owner actually owns this property */
    const owner = await Owner.findOne({ email: req.oidc.user.email });
    if (!tenant.unit.propertyId.ownerId.equals(owner._id)) {
      return res.status(403).send('Unauthorized');
    }

    res.render('editTenant', { tenant, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error loading tenant details');
  }
});

/* --------------------------- POST /:id ---------------------------------- */
/* Process edits */
router.post('/:id', requiresAuth(), cpUpload, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).populate({
      path: 'unit',
      populate: { path: 'propertyId' }
    });
    if (!tenant) return res.status(404).send('Tenant not found');

    const owner = await Owner.findOne({ email: req.oidc.user.email });
    if (!tenant.unit.propertyId.ownerId.equals(owner._id)) {
      return res.status(403).send('Unauthorized');
    }

    /* ---- scalar fields ---- */
    const {
      name, email, phone,
      nameOfBusiness, natureOfBusiness,
      rent, advance,
      agreementStartDate, agreementEndDate, annualIncrement
    } = req.body;

    Object.assign(tenant, {
      name,
      email,
      phone,
      nameOfBusiness,
      natureOfBusiness,
      rent,
      advance,
      agreementStartDate,
      agreementEndDate,
      annualIncrement
    });

    /* ---- optional file replacements ---- */
    const files = req.files || {};
    const mapField = (field) => {
      if (files[field]) {
        tenant.uploads[field] = files[field][0].path;   // overwrite old path
      }
    };
    ['proofOfAddress', 'proofOfBusiness', 'proofOfIdentity', 'agreementDraft', 'agreementCopy']
      .forEach(mapField);

    await tenant.save();

    /* Redirect back to the unit page */
    res.redirect(`/unit/${tenant.unit._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating tenant details');
  }
});

module.exports = router;
