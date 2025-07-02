const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    nameOfBusiness: {
      type: String,
      default: "",
    },
    natureOfBusiness: {
      type: String,
      default: "",
    },
    rent: {
      type: Number,
      required: true,
    },
    advance: {
      type: Number,
      required: true,
    },
    agreementStartDate: {
      type: Date,
      required: true,
    },
    agreementEndDate: {
      type: Date,
      required: true,
    },
    annualIncrement: {
      type: Number,
      required: true,
    },
    uploads: {
      proofOfAddress: {
        type: String,
      },
      proofOfBusiness: {
        type: String,
      },
      proofOfIdentity: {
        type: String,
      },
      agreementDraft: {
        type: String,
      },
      agreementCopy: {
        type: String,
      },
    },
    rentStatus: {
      type: String,
      enum: ["due", "overdue", "paid", "partial"],
      default: "due",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Tenant", tenantSchema);
