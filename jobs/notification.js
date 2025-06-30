const cron = require('node-cron');
const Tenant = require('../models/tenant');
const Notification = require('../models/notification');
const mongoose = require('mongoose');

// Helper: Get days between two dates
const getDaysBetween = (d1, d2) => {
  const diff = new Date(d2).setHours(0,0,0,0) - new Date(d1).setHours(0,0,0,0);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// This runs every day at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('⏰ Running daily tenant notification check...');

  try {
    const today = new Date();
    const tenants = await Tenant.find();

    for (const tenant of tenants) {
      const { agreementEndDate, rentDueDate, name, _id } = tenant;

      // 1. Rent due in 5 days
      const rentDue = new Date(rentDueDate);
      const rentDaysLeft = getDaysBetween(today, rentDue);

      if (rentDaysLeft === 5 || rentDaysLeft === 2 || rentDaysLeft === 1) {
        await Notification.create({
          user: _id,
          title: `Your rent is due in ${rentDaysLeft} day(s)`
        });
      }

      // 2. Contract ending in 10 days
      const contractDaysLeft = getDaysBetween(today, agreementEndDate);
      if (contractDaysLeft === 10 || contractDaysLeft === 5 || contractDaysLeft === 2 || contractDaysLeft === 1) {
        await Notification.create({
          user: _id,
          title: `Your rental agreement ends in ${contractDaysLeft} days`
        });
      }
    }
  } catch (err) {
    console.error('❌ Notification job error:', err);
  }
});
