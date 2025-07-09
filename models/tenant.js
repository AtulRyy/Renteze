const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  invoiceMonth: { type: String, required: true },
  invoiceType: { type: String, enum: ["Rent", "Maintenance", "Advance", "Other"], default: "Rent" },
  status: { type: String, enum: ["Paid", "Unpaid"], required: true },
  paidOn: { type: Date },
  paymentMethod: { type: String, default: "-" }
}, { _id: false });

const TenantSchema = new mongoose.Schema({
  unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  nameOfBusiness: { type: String, default: "" },
  natureOfBusiness: { type: String, default: "" },
  rent: { type: Number, required: true },
  advance: { type: Number, required: true },
  agreementStartDate: { type: Date, required: true },
  agreementEndDate: { type: Date, required: true },
  annualIncrement: { type: Number, required: true },
  paymentHistory: {
    type: [PaymentSchema],
    default: []
  },
  uploads: {
    proofOfAddress: { type: String, default: "" },
    proofOfBusiness: { type: String, default: "" },
    proofOfIdentity: { type: String, default: "" },
    agreementDraft: { type: String, default: "" },
    agreementCopy: { type: String, default: "" }
  },
  rentStatus: { type: String, enum: ["due", "paid", "partial"], default: "due" },
}, {
  timestamps: true
});

module.exports = mongoose.model("Tenant", TenantSchema);
