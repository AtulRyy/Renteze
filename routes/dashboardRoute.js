const express=require('express');
const { requiresAuth } = require('express-openid-connect');
const checkNewUser = require('../middleware/checkNewUser');
const Owner = require('../models/owner');
const owner = require('../models/owner');
const router=express.Router()


router.get('/',requiresAuth(),checkNewUser, async (req,res)=>{
    const user = await owner.findOne({ email: req.oidc.user.email }).populate('properties');
    if (!user) {
        return res.status(404).send('User not found');
    }

    res.render('dashboard', {
        name: user.name,
        properties: user.properties  // Pass the properties to the view
    });
})
router.post('/',requiresAuth(),(req,res)=>{
    res.send("sent")
})



module.exports=router