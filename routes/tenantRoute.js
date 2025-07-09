const express = require('express');
const router = express.Router();
const Issue = require('../models/issue');
const Tenant = require('../models/tenant');

// ✅ Admin: Fetch all issues
router.get('/admin/issues', async (req, res) => {
  try {
    const issues = await Issue.find().sort({ createdAt: -1 }).populate('tenant');
    console.log(`✅ Found ${issues.length} issues for admin.`);
    res.json({ success: true, issues });
  } catch (err) {
    console.error('❌ Error fetching issues for admin:', err);
    res.status(500).json({ success: false, message: 'Error fetching issues', issues: [] });
  }
});

// ✅ Tenant: Get issues for logged-in tenant
router.get('/issues', async (req, res) => {
  const userEmail = req?.query?.tenantEmail;
  console.log("Fetching issues for tenantEmail:", userEmail);

  try {
    const tenants = await Tenant.find({ email: { $regex: `^${userEmail}$`, $options: 'i' } });
    console.log("Found tenants:", tenants);

    if (!tenants || tenants.length === 0) {
      console.log(`❌ Tenant not found for email: ${userEmail}`);
      return res.status(404).json({ success: false, message: 'Tenant not found', issues: [] });
    }

    const tenantIds = tenants.map(tenant => tenant._id);
    console.log("Tenant IDs:", tenantIds);

    const issues = await Issue.find({ tenant: { $in: tenantIds } }).sort({ createdAt: -1 });
    console.log(`✅ Found ${issues.length} issues for tenant.`);
    res.json({ success: true, issues });
  } catch (err) {
    console.error('❌ Error fetching issues:', err);
    res.status(500).json({ success: false, message: 'Error fetching issues', issues: [] });
  }
});

// ✅ Raise a new issue
router.post('/raise-issue', async (req, res) => {
  const { title, priority, description, tenantEmail } = req.body;
  console.log(`Raising issue for tenantEmail: ${tenantEmail}`);

  try {
    const tenant = await Tenant.findOne({ email: { $regex: `^${tenantEmail}$`, $options: 'i' } });
    console.log("Found tenant:", tenant);

    if (!tenant) {
      console.log(`❌ Tenant not found for email: ${tenantEmail}`);
      return res.status(404).json({ success: false, message: '❌ Tenant not found' });
    }

    const issue = new Issue({
      tenant: tenant._id,
      title,
      priority: priority?.toLowerCase() || 'medium',
      description
    });

    await issue.save();
    console.log('✅ Issue saved:', issue);

    res.status(201).json({ success: true, message: '✅ Issue raised successfully', issue });
  } catch (err) {
    console.error('❌ Error raising issue:', err);
    res.status(500).json({ success: false, message: 'Error submitting issue' });
  }
});

// ✅ Update issue status
router.post('/update-issue-status/:id', async (req, res) => {
  const issueId = req.params.id;
  const newStatus = req.body.status;

  try {
    const updated = await Issue.findByIdAndUpdate(
      issueId,
      { status: newStatus },
      { new: true }
    );

    if (!updated) {
      console.log(`Issue with ID ${issueId} not found`);
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    console.log(`✅ Updated issue status:`, updated);
    res.json({ success: true, message: '✅ Issue status updated', issue: updated });
  } catch (err) {
    console.error('❌ Error updating issue:', err);
    res.status(500).json({ success: false, message: 'Error updating issue status' });
  }
});

// ✅ Reply to an issue
router.post('/reply-to-issue/:id', async (req, res) => {
  const issueId = req.params.id;
  const { content, sender } = req.body;

  try {
    const issue = await Issue.findById(issueId);
    if (!issue) {
      console.log(`Issue with ID ${issueId} not found`);
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    issue.replies = issue.replies || [];
    issue.replies.push({ content, sender, createdAt: new Date() });
    await issue.save();

    console.log(`✅ Reply added to issue ${issueId}:`, { content, sender });
    res.json({ success: true, message: 'Reply added successfully', issue });
  } catch (err) {
    console.error('❌ Error adding reply:', err);
    res.status(500).json({ success: false, message: 'Error adding reply' });
  }
});

module.exports = router;
