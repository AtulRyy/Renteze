const express = require('express');
const router = express.Router();
const RentPayment = require('../models/rentPayment');
const Tenant = require('../models/tenant');

// Route: GET /:tenantId
router.get('/:tenantId', async (req, res) => {
  const { tenantId } = req.params;

  try {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).send('Tenant not found');
    }

    const payments = await RentPayment.find({ tenant: tenantId }).sort({ paymentDate: -1 });

    res.render('viewPayments', {
      tenant,
      payments
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');



// Ensure invoices folder exists
const invoiceDir = path.join(__dirname, '..', 'invoices');
if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir);

router.post('/:tenantId', async (req, res) => {
  const { amountPaid, paymentDate, remarks } = req.body;
  const { tenantId } = req.params;

  try {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).send('Tenant not found');

    // Create new RentPayment entry (without invoice yet)
    const newPayment = new RentPayment({
      tenant:tenantId,
      amountPaid,
      paymentDate,
      remarks
    });
    if (tenant.rentStatus === 'due' || tenant.rentStatus === 'overdue') {
      tenant.rentStatus = 'paid';
      await tenant.save();
    }
    // Save to get ID for naming file
    await newPayment.save();

    // Generate PDF
    const fileName = `receipt-${tenant.name}-${newPayment._id}.pdf`;
    const filePath = path.join('invoices', fileName);
    const fullFilePath = path.join(__dirname, '..', filePath);

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(fullFilePath));

    doc.fontSize(20).text('Rent Payment Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Tenant: ${tenant.name}`);
    doc.text(`Email: ${tenant.email}`);
    doc.text(`Phone: ${tenant.phone}`);
    doc.text(`Amount Paid: ₹${amountPaid}`);
    doc.text(`Payment Date: ${new Date(paymentDate).toLocaleDateString()}`);
    if (remarks) doc.text(`Remarks: ${remarks}`);
    doc.text(`Generated At: ${new Date().toLocaleString()}`);

    doc.end();

    // Update payment with invoice path
    newPayment.invoiceFile = filePath;
    await newPayment.save();

    res.redirect(`/unit/${tenant.unit}`);
  } catch (err) {
    console.error('Error saving payment or generating PDF:', err);
    res.status(500).send('Internal Server Error');
  }
});



module.exports = router;
