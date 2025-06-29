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
    pin:{
        type:Number,
         required :true
    },
    units: [
        {
            type: mongoose.Schema.Types.ObjectId, ref: "Unit"
        }
    ],
    floors:{
        type:Number,
        required:true
    },
    PropertyType:{
        type:String
    },
    displayID:{
        type:String
    }
})
propertySchema.pre('save', function(next) {
  if (!this.displayID && this.name) {
    this.displayID = this.name.substring(0, 3).toUpperCase();
  }
  next();
});
module.exports=mongoose.model("Property",propertySchema)