// routes/auth.js
const express = require('express');
const router = express.Router();
const Owner = require('../models/owner');
const Admin = require('../models/admin');
const Tenant = require('../models/tenant');

router.get('/auth/check-user', async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ message: "Email required" });

  const owner = await Owner.findOne({ email });
  if (owner) return res.json({ role: 'owner' });

  const admin = await Admin.findOne({ email });
  if (admin) return res.json({ role: 'admin' });

  const tenant = await Tenant.findOne({ email });
  if (tenant) return res.json({ role: 'tenant' });

  return res.json({ redirect: '/complete-profile' });
});

module.exports = router;
