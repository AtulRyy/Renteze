const mongoose = require('mongoose')

const propertySchema = mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
    name: {
        type: String, required: true
    },
    address: {
        type: String, required: true
    },
    location:{
        type: String, required: true
    },
    units: [
        {
            type: mongoose.Schema.Types.ObjectId, ref: "Unit"
        }
    ]
})
module.exports=mongoose.model("Property",propertySchema)