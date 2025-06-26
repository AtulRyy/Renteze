const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const dayjs = require('dayjs');

const router = express.Router();
const RentPayment = require('../models/rentPayment');
const Tenant = require('../models/tenant');

/* ---------- GET  /:tenantId  – show all payments for one tenant ---------- */
router.get('/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).send('Tenant not found');

    const payments = await RentPayment
      .find({ tenant: tenantId })
      .sort({ paymentDate: -1 });

    res.render('viewPayments', { tenant, payments });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

/* ---------- POST /:tenantId  – record a (possibly partial) payment ---------- */
const invoiceDir = path.join(__dirname, '..', 'invoices');
if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir);

router.post('/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const { amountPaid, paymentDate, remarks, modeOfTransfer } = req.body;

  try {
    /* -- sanity checks ---------------------------------------------------- */
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).send('Tenant not found');
    if (!['cash', 'cheque', 'upi'].includes(modeOfTransfer))
      return res.status(400).send('Invalid payment mode');

    /* -- create payment doc ---------------------------------------------- */
    const newPayment = new RentPayment({
      tenant: tenantId,
      amountPaid,
      paymentDate,
      modeOfTransfer,
      remarks,
    });
    await newPayment.save();

    /* -- figure out how much this tenant has paid for the month ---------- */
    const cycleStart = dayjs(paymentDate).startOf('month').toDate();
    const cycleEnd   = dayjs(paymentDate).endOf('month').toDate();

    const [{ totalPaid = 0 } = {}] = await RentPayment.aggregate([
      {
        $match: {
          tenant: new mongoose.Types.ObjectId(tenantId),
          paymentDate: { $gte: cycleStart, $lte: cycleEnd },
        },
      },
      { $group: { _id: null, totalPaid: { $sum: '$amountPaid' } } },
    ]);

    /* -- update tenant status -------------------------------------------- */
    const fullyCovered = totalPaid >= tenant.monthlyRent;
    if (fullyCovered) tenant.rentStatus = 'paid';
    else if (totalPaid > 0) tenant.rentStatus = 'partial';
    // else leave as 'due' or 'overdue'
    await tenant.save();

    /* -- build PDF receipt ----------------------------------------------- */
    const fileName = `receipt-${tenant.name}-${newPayment._id}.pdf`;
    const filePath = path.join('invoices', fileName);
    const fullFilePath = path.join(__dirname, '..', filePath);

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(fullFilePath));

    doc.fontSize(20).text('Rent Payment Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12)
      .text(`Tenant        : ${tenant.name}`)
      .text(`Email         : ${tenant.email}`)
      .text(`Phone         : ${tenant.phone}`)
      .text(`Amount Paid   : ₹${amountPaid}`)
      .text(`Payment Date  : ${new Date(paymentDate).toLocaleDateString()}`)
      .text(`Mode of Transfer: ${modeOfTransfer}`)
      .text(`Remarks       : ${remarks || '—'}`)
      .text(`Generated At  : ${new Date().toLocaleString()}`);

    doc.end();

    newPayment.invoiceFile = filePath;
    await newPayment.save();

    res.redirect(`/unit/${tenant.unit}`);
  } catch (err) {
    console.error('Error saving payment or generating PDF:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
