const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  invoiceMonth: { type: String, required: true },
  invoiceType: { type: String, required: true },
  status: { type: String, required: true },
  paidOn: { type: Date, default: null },
  paymentMethod: { type: String, default: "-" },
}, { _id: false });

const tenantSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  nameOfBusiness: String,
  natureOfBusiness: String,
  rent: Number,
  advance: Number,
  agreementStartDate: Date,
  agreementEndDate: Date,
  annualIncrement: Number,
  paymentHistory: { 
    type: [paymentSchema], 
    default: [] 
  },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
  ownerEmail: String,
});

module.exports = mongoose.model("Tenant", tenantSchema);
