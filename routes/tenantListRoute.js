// routes/tenants.js
const express = require('express');
const router = express.Router();
const Tenant = require('../models/tenant');

// GET /tenants - return all tenants
router.get('/', async (req, res) => {
  try {
    const tenants = await Tenant.find({}, '_id name email'); // Sirf zaruri fields
    res.json(tenants);
  } catch (error) {
    console.error("Failed to fetch tenants:", error);
    res.status(500).json({ error: "Failed to fetch tenants" });
  }
});

module.exports = router;
