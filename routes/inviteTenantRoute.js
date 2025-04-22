const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Tenant = require('../models/tenant');
const Unit = require('../models/unit');
const tenant = require('../models/tenant');
const axios = require('axios');
const bcrypt = require('bcrypt');
const user = require('../models/user');


const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // use env in prod

// Email transport setup (Gmail example)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAILER,
        pass: process.env.EMAILPASS
    }
});


router.get('/set-password/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const currentTenant = await Tenant.findById(decoded.id);

        if (!currentTenant) return res.send('Invalid or expired link.');

        res.render('setPassword', { tenantId: currentTenant._id }); // You'll create this EJS
    } catch (err) {
        res.send('Invalid or expired token');
    }
});

router.post('/set-password', async (req, res) => {
    const { tenantId, password } = req.body;

    try {
        const currentTenant = await Tenant.findById(tenantId);
        if (!currentTenant) return res.status(404).send('Tenant not found');

        const hashedPassword = await bcrypt.hash(password, 10);
        currentTenant.password = hashedPassword;
        await currentTenant.save();

        // 🔐 Create user in Auth0
        const auth0Domain = process.env.ISSUER;
        const clientId = process.env.CLIENTID;
        const clientSecret = process.env.SECRET;

        // Step 1: Get access token from Auth0 Management API
        const tokenRes = await axios.post(`${auth0Domain}/oauth/token`, {
            client_id: clientId,
            client_secret: clientSecret,
            audience: `${auth0Domain}/api/v2/`,
            grant_type: 'client_credentials'
        });

        const accessToken = tokenRes.data.access_token;

        // Step 2: Create the user
        await axios.post(
            `${auth0Domain}/api/v2/users`,
            {
                email: currentTenant.email,
                password: password,
                connection: 'Username-Password-Authentication'
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.send('Tenant registered and can now log in via Auth0.');
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).send('Failed to register tenant in Auth0.<br> '+err.response.data.message);
    }
});

// Route to send invite
router.post('/:unitId', async (req, res) => {
    const { tenantEmail } = req.body;
    const { unitId } = req.params;

    try {
        const currentTenant = await tenant.findOne({ email: tenantEmail, unit: unitId });

        if (!currentTenant) {
            return res.send('Tenant not found for this unit');
        }

        const token = jwt.sign({ id: currentTenant._id }, JWT_SECRET, { expiresIn: '1d' });

        const link = `${process.env.baseURL}/invite-tenant/set-password/${token}`;

        await transporter.sendMail({
            from: 'your_email@gmail.com',
            to: tenantEmail,
            subject: 'Set up your tenant portal password',
            html: `<p>Click the link below to set your password:</p><a href="${link}">${link}</a>`
        });
        await new user({ email: tenantEmail, role: 'tenant' }).save();

        res.send('Invite sent to tenant email.');
    } catch (err) {
        console.error(err);
        res.send('Failed to send invite');
    }
});






module.exports = router;
