const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const csv = require('csvtojson');
const Unit = require('../models/unit');

const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;

  try {
    const jsonArray = await csv().fromFile(filePath);

    const units = jsonArray.map((row) => ({
      propertyId: row.propertyId,
      roomId: row.roomId,
      roomArea: row.roomArea,
      floor: parseInt(row.floor),
      rentCost: parseFloat(row.rentCost),
      maintenanceCost: parseFloat(row.maintenanceCost),
      bescomNumber: row.bescomNumber,
      hasWaterConnection: row.hasWaterConnection === 'true',
      hasIndependentToilet: row.hasIndependentToilet === 'true',
      isOccupied: false,
      tenant: null
    }));

    await Unit.insertMany(units);
    fs.unlinkSync(filePath); // clean up temp file

    res.status(200).json({ message: 'Units uploaded successfully', count: units.length });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload units' });
  }
});

module.exports = router;