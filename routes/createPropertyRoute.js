const express = require('express')
const property = require('../models/property')
const { requiresAuth } = require('express-openid-connect')
const owner = require('../models/owner')
const router = express.Router()



router.get('/', requiresAuth(), async (req, res) => {
    const user = await owner.findOne({ email: req.oidc.user.email })
    res.render('createProperty', {
        name: user.name,
        error: null,
        formData: {}
    })
})
router.post('/', requiresAuth(), async (req, res) => {

    const user = await owner.findOne({ email: req.oidc.user.email })
    const { propertyName, propertyAddress, propertyLocation } = req.body;
    try {
        const existingProperty = await property.findOne({ 
            name: propertyName, 
            ownerId: user._id 
        });
        

        if (existingProperty) {
            return res.render('createProperty', {
                name: user.name,
                error: 'Property name already exists.',
                formData: { propertyName, propertyAddress, propertyLocation }
            });
        }

        const newProperty = new property({
            ownerId: user._id,
            name: propertyName,
            address: propertyAddress,
            location: propertyLocation
        });
        await newProperty.save();
        user.properties.push(newProperty._id);
        await user.save();


        res.redirect('/dashboard'); // or wherever you want
    } catch (err) {
        console.error(err);
        res.render('createProperty', {
            name: user.name,
            error: 'Something went wrong. Please try again later.',
            formData: { propertyName, propertyAddress, propertyLocation }
        });
    }
})

module.exports = router;