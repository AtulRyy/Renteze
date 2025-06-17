const mongoose = require('mongoose');

const rentPaymentSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    modeOfTransfer: {
      type: String,
      enum: ['cash', 'cheque', 'upi'],
      required: true,
    },
    remarks: {
      type: String,
      default: '',
    },
    invoiceFile: {
      type: String, // path to the generated invoice PDF (optional)
      default: '',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('RentPayment', rentPaymentSchema);
