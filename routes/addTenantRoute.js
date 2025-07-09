const express = require("express");
const router = express.Router();
const Tenant = require("../models/tenant");
const Unit = require("../models/unit");
const RentPayment = require("../models/rentPayment");

// HTML form GET route (unchanged)
router.get("/:id", (req, res) => {
  const unitId = req.params.id;
  res.render("addTenant", { error: null, unitId });
});

// HTML form POST route — without multer (unchanged)
router.post("/:id", async (req, res) => {
  const unitId = req.params.id;
  try {
    const {
      name,
      email,
      phone,
      nameOfBusiness,
      natureOfBusiness,
      rent,
      advance,
      agreementStartDate,
      agreementEndDate,
      annualIncrement,
    } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !rent ||
      !advance ||
      !agreementStartDate ||
      !agreementEndDate ||
      !annualIncrement
    ) {
      return res.render("addTenant", {
        error: "All required fields must be provided.",
        unitId,
      });
    }

    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.render("addTenant", { error: "Invalid unit ID.", unitId });
    }

    const tenant = new Tenant({
      unit: unitId,
      name,
      email,
      phone,
      nameOfBusiness: nameOfBusiness || "",
      natureOfBusiness: natureOfBusiness || "",
      rent: Number(rent),
      advance: Number(advance),
      agreementStartDate: new Date(agreementStartDate),
      agreementEndDate: new Date(agreementEndDate),
      annualIncrement: Number(annualIncrement),
      uploads: {},
    });

    await tenant.save();
    await Unit.findByIdAndUpdate(unitId, {
      isOccupied: true,
      tenant: tenant._id,
    });

    return res.send("Success");
  } catch (err) {
    console.error("❌ Error creating tenant (HTML form):", err);
    return res.render("addTenant", {
      error: err.message || "Something went wrong. Please check your inputs.",
      unitId,
    });
  }
});

// API endpoint: create tenant (used by React frontend)
router.post("/property/:propertyId/tenant", async (req, res) => {
  const { propertyId } = req.params;
  const { testEmail } = req.query;
  const {
    unit,
    name,
    email,
    phone,
    nameOfBusiness,
    natureOfBusiness,
    rent,
    advance,
    agreementStartDate,
    agreementEndDate,
    annualIncrement,
    paymentHistory,
  } = req.body;

  console.log("📥 Incoming tenant data:", JSON.stringify(req.body, null, 2));
  console.log("📦 Property ID:", propertyId);

  try {
    if (
      !unit || !name || !email || !phone ||
      !rent || !advance || !agreementStartDate ||
      !agreementEndDate || !annualIncrement
    ) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!testEmail) {
      return res.status(401).json({ success: false, message: "Unauthorized: testEmail required" });
    }

    const unitDoc = await Unit.findOne({ _id: unit, property: propertyId });
    if (!unitDoc) {
      console.log("❌ Invalid unit or unit doesn't belong to property.");
      return res.status(400).json({
        success: false,
        message: "Invalid unit ID or unit does not belong to the property"
      });
    }

    if (
      (nameOfBusiness && nameOfBusiness.toLowerCase().startsWith("n/a")) ||
      (natureOfBusiness && natureOfBusiness.toLowerCase().startsWith("n/a"))
    ) {
      return res.status(400).json({
        success: false,
        message: "Name of Business and Nature of Business cannot start with 'N/A'"
      });
    }

    // ✅ Validate and Normalize Payment History
    let validatedPaymentHistory = [];
    if (Array.isArray(paymentHistory) && paymentHistory.length > 0) {
      for (const payment of paymentHistory) {
        console.log("🔍 Processing payment:", payment);

        if (!payment.amount || !payment.invoiceMonth || !payment.status) {
          console.warn("⚠️ Skipping payment due to missing fields:", payment);
          continue; // skip this entry, don't stop entire request
        }

        if (!/^[A-Za-z]+ \d{4}$/.test(payment.invoiceMonth)) {
          console.warn("⚠️ Skipping due to invalid invoiceMonth format:", payment.invoiceMonth);
          continue;
        }

        const validInvoiceTypes = ["Rent", "Maintenance", "Advance", "Other"];
        const invoiceType = payment.invoiceType || "Rent";
        if (!validInvoiceTypes.includes(invoiceType)) {
          console.warn("⚠️ Skipping due to invalid invoiceType:", invoiceType);
          continue;
        }

        const [month, year] = payment.invoiceMonth.split(" ");
        const normalizedInvoiceMonth = `${month.charAt(0).toUpperCase() + month.slice(1).toLowerCase()} ${year}`;

        validatedPaymentHistory.push({
          amount: Number(payment.amount),
          invoiceMonth: normalizedInvoiceMonth,
          invoiceType,
          status: payment.status,
          paidOn: payment.paidOn ? new Date(payment.paidOn) : null,
          paymentMethod: payment.paymentMethod || "-"
        });
      }
    }

    // ✅ Add default advance entry if no valid payments provided
    if (validatedPaymentHistory.length === 0) {
      validatedPaymentHistory.push({
        amount: Number(advance),
        invoiceMonth: new Date().toLocaleString("default", { month: "long", year: "numeric" }),
        invoiceType: "Advance",
        status: "Paid",
        paidOn: new Date(),
        paymentMethod: "Advance"
      });
    }

    console.log("✅ Validated Payment History:", validatedPaymentHistory);

    // ✅ Create Tenant
    const tenant = new Tenant({
      unit,
      name,
      email,
      phone,
      nameOfBusiness: nameOfBusiness || "",
      natureOfBusiness: natureOfBusiness || "",
      rent: Number(rent),
      advance: Number(advance),
      agreementStartDate: new Date(agreementStartDate),
      agreementEndDate: new Date(agreementEndDate),
      annualIncrement: Number(annualIncrement),
      paymentHistory: validatedPaymentHistory,
      uploads: {},
      rentStatus: "due"
    });

    await tenant.validate();
    const savedTenant = await tenant.save();

    await Unit.findByIdAndUpdate(unit, {
      isOccupied: true,
      tenant: savedTenant._id
    });

    // ✅ Sync to RentPayment Collection
    const rentPayments = validatedPaymentHistory.map((payment) => ({
      tenant: savedTenant._id,
      amountPaid: payment.amount,
      paymentDate: payment.paidOn || new Date(),
      modeOfTransfer:
        payment.paymentMethod?.toLowerCase() === "-"
          ? "cash"
          : payment.paymentMethod?.toLowerCase() || "cash",
      remarks: payment.invoiceType || "Rent",
      invoiceFile: ""
    }));

    await RentPayment.insertMany(rentPayments);
    console.log("✅ RentPayments synced to RentPayment collection");

    return res.status(201).json({
      success: true,
      message: "Tenant created successfully",
      tenant: savedTenant
    });

  } catch (err) {
    console.error("❌ Server error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error"
    });
  }
});


// API endpoint: get all tenants (with property & unit info) (unchanged)
router.get("/", async (req, res) => {
  const { testEmail } = req.query;
  if (!testEmail) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: testEmail required" });
  }

  try {
    const tenants = await Tenant.find().populate({
      path: "unit",
      populate: { path: "propertyId" },
    });

    const tenantList = tenants.map((t) => {
      const unit = t.unit;
      const property = unit?.propertyId;

      return {
        _id: t._id,
        name: t.name,
        email: t.email,
        phone: t.phone,
        nameOfBusiness: t.nameOfBusiness,
        natureOfBusiness: t.natureOfBusiness,
        rent: t.rent,
        advance: t.advance,
        agreementStartDate: t.agreementStartDate,
        agreementEndDate: t.agreementEndDate,
        annualIncrement: t.annualIncrement,
        rentStatus: t.rentStatus || "due",
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        unitId: unit?._id,
        roomId: unit?.roomId || "",
        hasWaterConnection: unit?.hasWaterConnection || false,
        propertyId: property?._id,
        propertyName: property?.name || "Unknown",
        propertyLocation: property?.location || "",
      };
    });

    console.log(`✅ Fetched ${tenantList.length} tenants.`);
    res.json({ success: true, tenants: tenantList });
  } catch (err) {
    console.error("❌ Error fetching tenants:", err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
});

module.exports = router;
