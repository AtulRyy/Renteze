const express = require('express');
const router = express.Router();

const Issue = require('../models/issue');
const Tenant = require('../models/tenant');
const { requiresAuth } = require('express-openid-connect');

// ✅ Update issue status
router.post('/update-issue-status/:id', async (req, res) => {
  const issueId = req.params.id;
  const newStatus = req.body.status;

  try {
    const updated = await Issue.findByIdAndUpdate(issueId, { status: newStatus }, { new: true });

    if (!updated) return res.status(404).json({ success: false, message: 'Issue not found' });

    res.json({ success: true, message: '✅ Issue status updated', issue: updated });
  } catch (error) {
    console.error('❌ Error updating issue:', error);
    res.status(500).json({ success: false, message: 'Error updating issue status' });
  }
});

// ✅ Raise a new issue
router.post('/raise-issue', async (req, res) => {
  
  const { title, priority, description,tenantEmail } = req.body;

  try {
    const tenant = await Tenant.findOne({ email: tenantEmail });

    if (!tenant) {
      return res.status(404).json({ success: false, message: '❌ Tenant not found' });
    }

    const issue = new Issue({
      tenant: tenant._id,
      title,
      priority,
      description
    });

    await issue.save();

    res.status(201).json({ success: true, message: '✅ Issue raised successfully', issue });
  } catch (err) {
    console.error('❌ Error raising issue:', err);
    res.status(500).json({ success: false, message: 'Error submitting issue' });
  }
});

// ✅ Get issues for logged-in tenant
router.get('/issues', async (req, res) => {
  const userEmail=req?.query?.tenantEmail
  // const userEmail = req.oidc.user.email;

  try {
    const tenant = await Tenant.findOne({ email: userEmail });

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const issues = await Issue.find({ tenant: tenant._id });

    res.json({ success: true, issues });
  } catch (err) {
    console.error('❌ Error fetching issues:', err);
    res.status(500).json({ success: false, message: 'Error fetching issues' });
  }
});

module.exports = router;
