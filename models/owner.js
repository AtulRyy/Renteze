const mongoose = require('mongoose')

const OwnerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    profileCompletion: { type: Boolean, default: false },
    phoneno: { type: String },
    location: { type: String },          
    dateOfBirth: { type: Date },         
    emailNotifications: { type: Boolean, default: true },
    properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }]
});


module.exports = mongoose.model("Owner", OwnerSchema)