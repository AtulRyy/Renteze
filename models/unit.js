const mongoose = require('mongoose');

const UnitSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  roomId: {
    type: String,
    required: true,
  },
  roomArea: {
    type: String,
    required: true,
  },
  floor: {
    type: Number,
    required: true,
  },
  rentCost: {
    type: Number,
    required: true,
  },
  maintenanceCost: {
    type: Number,
    required: true,
  },
  bescomNumber: {
    type: String,
    required: true,
  },
  hasWaterConnection: {
    type: Boolean,
    default: false,
  },
  hasIndependentToilet: {
    type: Boolean,
    default: false,
  },
  isOccupied: {
    type: Boolean,
    default: false,
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
  },
  displayID: {
    type: String,
  }
});

UnitSchema.pre('save', async function (next) {
  if (!this.displayID) {
    try {
      const property = await mongoose.model('Property').findById(this.propertyId);
      if (property && property.name) {
        const propDisplayID = property.name.substring(0, 3).toUpperCase();
        this.displayID = `${propDisplayID}-${this.roomId}`;
      } else {
        throw new Error('Property not found or missing property name');
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Unit', UnitSchema);
