const express=require('express')
const router=express.Router()

const Issue = require('../models/issue');
const Tenant = require('../models/tenant');
const { requiresAuth } = require('express-openid-connect');
const issue = require('../models/issue');

router.post('/update-issue-status/:id', async (req, res) => {
    const issueId = req.params.id;
    const newStatus = req.body.status;
  
    try {
      await issue.findByIdAndUpdate(issueId, { status: newStatus });
      res.redirect('/dashboard'); // Or redirect to a specific route
    } catch (error) {
      console.error(error);
      res.status(500).send("Error updating issue status");
    }
  });
router.post('/raise-issue', requiresAuth(), async (req, res) => {
  const userEmail = req.oidc.user.email;
  const { title, priority, description } = req.body;

  try {
    // Get the tenant's document based on email
    const tenant = await Tenant.findOne({ email: userEmail });

    if (!tenant) {
      return res.status(404).send('❌ Tenant not found.');
    }

    // Create new issue with tenant reference
    const issue = new Issue({
      tenant: tenant._id,
      title,
      priority,
      description
    });

    await issue.save();

    res.redirect('/dashboard'); // or wherever you want after submission
  } catch (err) {
    console.error('Error raising issue:', err);
    res.status(500).send('❌ Error submitting issue.');
  }
});

router.get('/issues', requiresAuth(), async (req, res) => {
    const userEmail = req.oidc.user.email;
  
    try {
      const tenant = await Tenant.findOne({ email: userEmail });
      if (!tenant) return res.status(404).send("Tenant not found");
  
      const issues = await Issue.find({ tenant: tenant._id });
  
      res.render('tenant-issues', { issues });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error fetching issues");
    }
  });

module.exports=router