const mongoose = require('mongoose');

const UnitSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  roomId: {
    type: String,
    required: true
  },
  roomArea: {
    type: String,
    required: true
  },
  floor: {
    type: Number,
    required: true
  },
  rentCost: {
    type: Number,
    required: true
  },
  maintenanceCost: {
    type: Number,
    required: true
  },
  bescomNumber: {
    type: String,
    required: true
  },
  hasWaterConnection: {
    type: Boolean,
    default: false
  },
  hasIndependentToilet: {
    type: Boolean,
    default: false
  },
  isOccupied: {
    type: Boolean,
    default: false
  },
});

module.exports = mongoose.model('Unit', UnitSchema);
