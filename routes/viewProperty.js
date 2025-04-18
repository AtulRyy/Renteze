const express=require('express')
const owner = require('../models/owner')
const { requiresAuth } = require('express-openid-connect')
const property = require('../models/property')
const router=express.Router()
const Unit = require('../models/unit'); 


router.get('/:id',requiresAuth(),async(req,res)=>{
    const propertyId = req.params.id;
    try {
        const user=await owner.findOne({email:req.oidc.user.email})
        const currentProperty = await property.findById(propertyId).populate('ownerId').populate('units'); // Find property by ID
        if (!property) {
            return res.status(404).send('Property not found');
        }
        res.render('viewProperty', {
            property: currentProperty,
            units: currentProperty.units, // Optional: send units separately
            name: user.name
        });
    } catch (error) {
        res.status(500).send('Error retrieving property '+error);
    }
})

module.exports=router