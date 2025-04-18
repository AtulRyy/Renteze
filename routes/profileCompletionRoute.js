const express = require("express")
const { requiresAuth } = require("express-openid-connect")
const router = express.Router()
const mongoose = require('mongoose')

const Owner = require('../models/owner');

router.get('/', requiresAuth(), (req, res) => {
    res.render('complete-profile', { email: req.oidc.user.email })
})
router.post('/', async (req, res) => {
    const { name, email, phoneno } = req.body;
    
    
    try {
        const updatedOwner = await Owner.findOneAndUpdate(
            { email: req.oidc.user.email },                          // Find by email
            {
                name: name,
                phoneno: phoneno,
                profileCompletion: true                  // Example: mark profile as complete
            },
            { new: true }                               // Return updated doc
        );

        if (!updatedOwner) {
            return res.status(404).send("❌ Owner not found with that email");
        }

        res.redirect('/dashboard')
    } catch (err) {
        console.error(err);
        res.status(500).send('❌ Error updating owner');
    }

})
module.exports = router