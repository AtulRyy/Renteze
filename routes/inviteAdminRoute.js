const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Admin = require('../models/admin');
const Property = require('../models/property');
const User = require('../models/user');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAILER,
    pass: process.env.EMAILPASS,
  },
});

// GET: Show invite admin form with unassigned properties
router.get('/invite-admin', async (req, res) => {
  try {
    const allProps = await Property.find();
    const admins = await Admin.find();
    const managedPropertyIds = admins.flatMap(admin =>
      (admin.assignedProperties || []).map(p => p.toString())
    );

    const unassignedProperties = allProps.filter(
      prop => !managedPropertyIds.includes(prop._id.toString())
    );

    res.render('invite-admin', { properties: unassignedProperties });
  } catch (err) {
    console.error('Error loading invite-admin form:', err);
    res.status(500).send('Failed to load invite form');
  }
});

// POST: Create admin in DB and send Auth0 signup invite
router.post('/invite-admin', async (req, res) => {
  const { name, email, phone, assignedProperties } = req.body;

  try {
    // 🔹 Upsert admin info locally
    await Admin.findOneAndUpdate(
      { email },
      {
        name,
        phone,
        assignedProperties: Array.isArray(assignedProperties)
          ? assignedProperties
          : [assignedProperties],
      },
      { new: true, upsert: true }
    );

    // 🔥 Build Auth0 dedicated signup link (opens signup form directly with prefilled email)
    const auth0SignupLink =
  `https://dev-0k7k4op02hlhzto5.us.auth0.com/authorize` +
  `?response_type=code` +
  `&client_id=w7HCQSk26CF8QwPo5acEfzG0mzCD5yri` +
  `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
  `&scope=openid%20profile%20email` +
  `&screen_hint=signup` +
  `&login_hint=${encodeURIComponent(email)}`;


    // 🔹 Send invite email with signup link
    await transporter.sendMail({
      from: process.env.EMAILER,
      to: email,
      subject: 'Set up your Admin account on Renteze',
      html: `
        <p>Hi ${name},</p>
        <p>You’ve been invited to manage properties on <strong>Renteze</strong>.</p>
        <p>Click below to set your password and activate your account:</p>
        <p><a href="${auth0SignupLink}" target="_blank">${auth0SignupLink}</a></p>
        <p>This will redirect you to our secure Auth0 signup page.</p>
      `,
    });

    // 🔹 Optional: track user role locally
    await User.updateOne(
      { email },
      { role: 'admin' },
      { upsert: true }
    );

    console.log(`✅ Invite sent to ${email}`);
    res.status(200).json({ message: 'Admin invited successfully.' });
  } catch (err) {
    console.error('❌ Error inviting admin:', err);
    res.status(500).json({ message: 'Failed to invite admin' });
  }
});


module.exports = router;
