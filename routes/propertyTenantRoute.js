// const express = require('express');
// const router = express.Router();
// const Tenant = require('../models/tenant');
// const Unit = require('../models/unit');
// const multer = require('multer');
// const path = require('path');

// // Configure multer for file storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/tenants/');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   }
// });

// // Set up multer for multiple fields
// const upload = multer({ storage }).fields([
//   { name: 'proofOfAddress', maxCount: 1 },
//   { name: 'proofOfBusiness', maxCount: 1 },
//   { name: 'proofOfIdentity', maxCount: 1 },
//   { name: 'agreementDraft', maxCount: 1 },
//   { name: 'agreementCopy', maxCount: 1 },
// ]);

// router.post('/:propertyId/tenant', upload, async (req, res) => {
//   const { propertyId } = req.params;
//   const {
//     unit, name, email, phone,
//     nameOfBusiness, natureOfBusiness,
//     rent, advance,
//     agreementStartDate, agreementEndDate,
//     annualIncrement
//   } = req.body;

//   console.log("📥 Incoming tenant data:", req.body);
//   console.log("📦 Property ID:", propertyId);

//   try {
//     const uploads = {
//       proofOfAddress: req.files?.proofOfAddress?.[0]?.path,
//       proofOfBusiness: req.files?.proofOfBusiness?.[0]?.path,
//       proofOfIdentity: req.files?.proofOfIdentity?.[0]?.path,
//       agreementDraft: req.files?.agreementDraft?.[0]?.path,
//       agreementCopy: req.files?.agreementCopy?.[0]?.path,
//     };

//     const tenant = new Tenant({
//       unit,
//       name,
//       email,
//       phone,
//       nameOfBusiness,
//       natureOfBusiness,
//       rent,
//       advance,
//       agreementStartDate,
//       agreementEndDate,
//       annualIncrement,
//       uploads,
//     });

//     const savedTenant = await tenant.save();
//     console.log("✅ Tenant saved:", savedTenant);

//     const updatedUnit = await Unit.findByIdAndUpdate(unit, {
//       isOccupied: true,
//       tenant: savedTenant._id
//     }, { new: true });

//     console.log("🏠 Unit updated:", updatedUnit);

//     res.status(201).json({ success: true, message: "Tenant created successfully", tenant: savedTenant });
//   } catch (err) {
//     console.error("❌ Error creating tenant:", err);
//     res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// });

// module.exports = router;
