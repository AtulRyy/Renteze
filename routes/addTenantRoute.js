const express = require("express");
const router = express.Router();
const Tenant = require("../models/tenant");

// ✅ Add Tenant API
router.post('/:propertyId/tenant', async (req, res) => {
  const { propertyId } = req.params;
  const ownerEmail = req.query.testEmail;
  const {
    name, email, phone,
    nameOfBusiness, natureOfBusiness,
    rent, advance, agreementStartDate, agreementEndDate,
    annualIncrement, unit, paymentHistory
  } = req.body;

  console.log("📥 Incoming tenant data:", req.body);

  const cleanedPaymentHistory = Array.isArray(paymentHistory) && paymentHistory.length > 0
    ? paymentHistory.map(p => ({
        amount: Number(p.amount),
        invoiceMonth: p.invoiceMonth,
        invoiceType: p.invoiceType,
        status: p.status || "Unpaid",
        paidOn: p.paidOn || null,
        paymentMethod: p.paymentMethod || "-"
      }))
    : [];

  const tenantData = {
    name,
    email,
    phone,
    nameOfBusiness,
    natureOfBusiness,
    rent: Number(rent),
    advance: Number(advance),
    agreementStartDate: new Date(agreementStartDate),
    agreementEndDate: new Date(agreementEndDate),
    annualIncrement: Number(annualIncrement),
    propertyId,
    unit,
    ownerEmail,
    paymentHistory: cleanedPaymentHistory,
  };

  try {
    const tenant = await Tenant.create(tenantData);
    console.log("✅ Tenant saved:", tenant);
    res.status(201).json({ success: true, message: "Tenant created successfully", tenant });
  } catch (error) {
    console.error("❌ Failed to create tenant:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


module.exports = router;
