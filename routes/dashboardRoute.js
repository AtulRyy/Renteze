const express = require('express');
const { requiresAuth } = require('express-openid-connect');
const Owner = require('../models/owner');
const owner = require('../models/owner');
const tenant = require('../models/tenant');
const userModel = require('../models/user');
const issue = require('../models/issue');
const Property = require('../models/property');
const Unit = require('../models/unit'); // Make sure this path is correct
const router = express.Router();

router.get('/', /* requiresAuth(), */ async (req, res) => {
  const userEmail = req.oidc?.user?.email || req.query.testEmail;

  try {
    const user = await userModel.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).send('❌ User role not found.');
    }

    if (user.role === 'owner') {
      const ownerUser = await Owner.findOne({ email: userEmail }).populate('properties');

      if (!ownerUser) {
        return res.status(404).send('❌ Owner not found.');
      }

      const issues = await issue.find();

      return res.json({
        name: ownerUser.name,
        properties: ownerUser.properties,
        issues: issues
      });

    } else if (user.role === 'tenant') {
      const tenantUser = await tenant.findOne({ email: userEmail });

      if (!tenantUser) {
        return res.status(404).send('❌ Tenant not found.');
      }

      return res.json({
        tenant: tenantUser
      });

    } else if (user.role === 'admin') {
      return res.send('Admin dashboard under construction...');
    }

  } catch (err) {
    console.error('Error checking user role:', err);
    res.status(500).send('❌ Server error.');
  }
});

router.delete('/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;

    const propertyToDelete = await Property.findById(propertyId);

    if (!propertyToDelete) {
      return res.status(404).json({
        success: false,
        message: '❌ Property not found',
      });
    }

    // 1. Delete all associated units
    if (propertyToDelete.units && propertyToDelete.units.length > 0) {
      await Unit.deleteMany({ _id: { $in: propertyToDelete.units } });
    }

    // 2. Delete the property
    await Property.findByIdAndDelete(propertyId);

    // 3. Remove property reference from owner's properties list
    await Owner.updateOne(
      { properties: propertyId },
      { $pull: { properties: propertyId } }
    );

    res.status(200).json({
      success: true,
      message: '✅ Property and associated units deleted successfully',
    });

  } catch (err) {
    console.error('Error deleting property:', err);
    res.status(500).json({
      success: false,
      message: '❌ Internal server error',
    });
  }
});

module.exports = router;
