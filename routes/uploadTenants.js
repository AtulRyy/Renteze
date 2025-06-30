const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csvtojson');
const Tenant = require('../models/tenant'); // adjust path as needed
const owner = require('../models/owner');

// Multer config
const upload = multer({ storage: multer.memoryStorage() });

// CSV Upload Route
router.post('/', upload.single('file'), async (req, res) => {
    const userEmail = req.oidc?.user?.email || req.query?.testEmail;

    const user = await owner.findOne({ email: userEmail });

    if (!user) {
    return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found'
    });
    }
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    try {
        const csvString = req.file.buffer.toString('utf-8');
        const jsonArray = await csv().fromString(csvString);

        let updatedTenants = [];
        for (const tenantData of jsonArray) {
            const {
                unit, name, email, phone,
                nameOfBusiness, natureOfBusiness,
                rent, advance,
                agreementStartDate, agreementEndDate,
                annualIncrement
            } = tenantData;

            if (!unit || !name || !email) continue; // Basic validation

            const existingTenant = await Tenant.findOne({ email });

            const updateFields = {
                unit,
                name,
                email,
                phone,
                nameOfBusiness,
                natureOfBusiness,
                rent: parseFloat(rent),
                advance: parseFloat(advance),
                agreementStartDate: new Date(agreementStartDate),
                agreementEndDate: new Date(agreementEndDate),
                annualIncrement: parseFloat(annualIncrement)
            };

            let tenant;
            if (existingTenant) {
                tenant = await Tenant.findOneAndUpdate({ email }, updateFields, { new: true });
            } else {
                tenant = new Tenant({
                    ...updateFields,
                    uploads: {
                        proofOfAddress: '',
                        proofOfBusiness: '',
                        proofOfIdentity: '',
                        agreementDraft: '',
                        agreementCopy: ''
                    }
                });
                await tenant.save();
            }

            updatedTenants.push(tenant);
        }

        res.status(200).json({ message: "Tenants uploaded successfully", tenants: updatedTenants });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Server error during upload" });
    }
});

module.exports = router;
