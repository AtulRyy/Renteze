const Owner=require('../models/owner')

const checkNewUser = async (req, res, next) => {
    const email = req.oidc.user.email;

    // Check if this email already exists in your Owner collection
    const userExists = await Owner.findOne({ email });

    if (!userExists) {
        // New user! Create a new Owner record
        await Owner.create({
            name: req.oidc.user.name,
            email,
            properties: []
        });
        return res.redirect(`/complete-profile`)
    }
    console.log("existing fellow");
    if (!userExists.profileCompletion) {
        console.log("go finish profile");
        
        return res.redirect('/complete-profile'); // redirect to profile setup
      }
    
    next();
};
module.exports=checkNewUser