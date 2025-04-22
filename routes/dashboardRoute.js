const express = require('express');
const { requiresAuth } = require('express-openid-connect');
const checkNewUser = require('../middleware/checkNewUser');
const Owner = require('../models/owner');
const owner = require('../models/owner');
const tenant = require('../models/tenant');
const userModel = require('../models/user');
const issue = require('../models/issue');
const router = express.Router()


router.get('/', requiresAuth(), async (req, res) => {
    const userEmail = req.oidc.user.email;

    try {
        const user = await userModel.findOne({ email: userEmail });

        if (!user) {
            return res.status(404).send('❌ User role not found.');
        }

        if (user.role === 'owner') {
            const ownerUser = await Owner.findOne({ email: userEmail }).populate('properties');

            if (!ownerUser) {
                return res.status(404).send('❌ Owner not found.');
            }
            const issues = await issue.find();
            return res.render('dashboard-owner', {
                name: ownerUser.name,
                properties: ownerUser.properties,
                issues: issues 
            });

        } else if (user.role === 'tenant') {
            const tenantUser = await tenant.findOne({ email: userEmail });

            if (!tenantUser) {
                return res.status(404).send('❌ Tenant not found.');
            }

            return res.render('dashboard-tenant', {
                tenant: tenantUser
            });

        } else if (user.role === 'admin') {
            // Placeholder: redirect or render admin dashboard if needed
            return res.send('Admin dashboard under construction...');
        }

    } catch (err) {
        console.error('Error checking user role:', err);
        res.status(500).send('❌ Server error.');
    }
})
router.post('/', requiresAuth(), (req, res) => {
    res.send("sent")
})



module.exports = router