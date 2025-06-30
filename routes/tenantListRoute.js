// routes/tenantListRoute.js
const express = require('express');
const router = express.Router();
const Tenant = require('../models/tenant'); // adjust path if your model is in another folder

// GET /tenants — fetch list of tenants
router.get('/', async (req, res) => {
  try {
    const tenants = await Tenant.find({}, '_id name email'); // fetch minimal data
    res.json(tenants);
  } catch (err) {
    console.error("Failed to fetch tenants:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
