const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const axios = require('axios');
const Admin = require('../models/admin');
const Property = require('../models/property');
const User = require('../models/user'); // Optional: for role tracking

const JWT_TOKEN = process.env.JWT_TOKEN || 'your-secret-key';

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAILER,
        pass: process.env.EMAILPASS
    }
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

// POST: Create admin and send invite email
router.post('/invite-admin', async (req, res) => {
    const { name, email, phone, assignedProperties } = req.body;

    try {
        const admin = await Admin.findOneAndUpdate(
            { email },
            {
                name,
                phone,
                assignedProperties: Array.isArray(assignedProperties)
                    ? assignedProperties
                    : [assignedProperties]
            },
            { new: true, upsert: true }
        );

        const token = jwt.sign({ id: admin._id }, JWT_TOKEN, { expiresIn: '1d' });
        const link = `${process.env.baseURL}/invite-admin/set-password/${token}`;

        await transporter.sendMail({
            from: process.env.EMAILER,
            to: email,
            subject: 'Set up your Admin account password',
            html: `
                <p>Hi ${name},</p>
                <p>You’ve been invited to manage properties on Renteze.</p>
                <p>Click the link below to set your password and activate your account:</p>
                <p><a href="${link}">${link}</a></p>
                <p>This link expires in 24 hours.</p>
            `
        });

        await new User({ email, role: 'admin' }).save();

        res.status(200).json({ message: 'Admin invited successfully.' });
    } catch (err) {
        console.error('Error inviting admin:', err);
        res.status(500).json({ message: 'Failed to invite admin' });
    }
});

// GET: Render set password page
router.get('/invite-admin/set-password/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, process.env.JWT_TOKEN);
        const admin = await Admin.findById(decoded.id);

        if (!admin) return res.send('Invalid or expired link.');

        res.render('setPassword', {
            userId: admin._id,
            role: 'admin' // 👈 This sets the form action path
        });
    } catch (err) {
        res.send('Invalid or expired token.');
    }
});

// POST: Handle password setup and Auth0 registration
router.post('/invite-admin/set-password', async (req, res) => {
    const { userId, password } = req.body;

    try {
        const admin = await Admin.findById(userId);
        if (!admin) return res.status(404).send('Admin not found');

        const hashedPassword = await bcrypt.hash(password, 10);
        admin.password = hashedPassword;
        await admin.save();

        // Auth0 Management Token
        const tokenRes = await axios.post(`${process.env.ISSUER}/oauth/token`, {
            client_id: process.env.CLIENTID,
            client_secret: process.env.SECRET,
            audience: `${process.env.ISSUER}/api/v2/`,
            grant_type: 'client_credentials'
        });

        const accessToken = tokenRes.data.access_token;

        // Create user in Auth0
        await axios.post(
            `${process.env.ISSUER}/api/v2/users`,
            {
                email: admin.email,
                password,
                connection: 'Username-Password-Authentication'
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.send('Admin registered and password set. You may now log in.');
    } catch (err) {
        console.error('Error setting password for admin:', err.response?.data || err.message);
        res.status(500).send('Failed to complete registration.<br>' + (err.response?.data?.message || err.message));
    }
});

module.exports = router;
