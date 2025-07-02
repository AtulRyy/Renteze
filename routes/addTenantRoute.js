const express = require("express");
const router = express.Router();
const Tenant = require("../models/tenant");
const Unit = require("../models/unit");

// HTML form GET route (if you still use it)
router.get("/:id", (req, res) => {
  const unitId = req.params.id;
  res.render("addTenant", { error: null, unitId });
});

// HTML form POST route — without multer
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

    if (!name || !email || !phone || !rent || !advance || !agreementStartDate || !agreementEndDate || !annualIncrement) {
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
    await Unit.findByIdAndUpdate(unitId, { isOccupied: true, tenant: tenant._id });

    return res.send("Success");
  } catch (err) {
    console.error("❌ Error creating tenant (HTML form):", err);
    return res.render("addTenant", {
      error: err.message || "Something went wrong. Please check your inputs.",
      unitId,
    });
  }
});

// API endpoint to create tenant (React frontend)
router.post("/property/:propertyId/tenant", async (req, res) => {
  const { propertyId } = req.params;
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
  } = req.body;
  const { testEmail } = req.query;

  console.log("📥 Incoming request:", { propertyId, testEmail, body: req.body });

  try {
    if (!unit || !name || !email || !phone || !rent || !advance || !agreementStartDate || !agreementEndDate || !annualIncrement) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const unitDoc = await Unit.findOne({ _id: unit, property: propertyId });
    if (!unitDoc) {
      return res.status(400).json({ success: false, message: "Invalid unit ID or unit does not belong to the property" });
    }

    if (!testEmail) {
      return res.status(401).json({ success: false, message: "Unauthorized: testEmail required" });
    }

    const tenant = new Tenant({
      unit,
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
      uploads: {},
    });

    await tenant.save();
    await Unit.findByIdAndUpdate(unit, { isOccupied: true, tenant: tenant._id });

    console.log("✅ Tenant created successfully:", tenant);

    return res.status(201).json({ success: true, message: "Tenant created successfully", tenant });
  } catch (err) {
    console.error("❌ Unexpected server error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// API endpoint: get all tenants (with property & unit info)
router.get("/", async (req, res) => {
  const { testEmail } = req.query;
  if (!testEmail) {
    return res.status(401).json({ success: false, message: "Unauthorized: testEmail required" });
  }

  try {
    const tenants = await Tenant.find().populate({
      path: "unit",
      populate: { path: "propertyId" },
    });

    const tenantList = tenants.map(t => {
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
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

module.exports = router;
