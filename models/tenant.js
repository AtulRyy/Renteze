const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    unit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    nameOfBusiness: {
        type: String,
        required: true
    },
    natureOfBusiness: {
        type: String,
        required: true
    },
    rent: {
        type: Number,
        required: true
    },
    advance: {
        type: Number,
        required: true
    },
    agreementStartDate: {
        type: Date,
        required: true
    },
    agreementEndDate: {
        type: Date,
        required: true
    },
    annualIncrement: {
        type: Number,
        required: true
    },
    uploads: {
        proofOfAddress: {
            type: String, // store the file path or cloud URL
            required: true
        },
        proofOfBusiness: {
            type: String,
            required: true
        },
        proofOfIdentity: {
            type: String,
            required: true
        },
        agreementDraft: {
            type: String,
            required: true
        },
        agreementCopy: {
            type: String,
            required: true
        }
    },
    rentStatus: {
        type: String,
        enum: ['due', 'overdue', 'paid'],
        default: 'due'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Tenant", tenantSchema);
