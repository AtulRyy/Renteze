// utils/updateRentStatus.js
const Tenant = require('../models/tenant'); // adjust path if different

async function updateRentStatusIfNeeded() {
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  // Check if today is two days before the month end
  if (today.getDate() === lastDayOfMonth - 2) {
    console.log('Updating rent status to due...');

    try {
      await Tenant.updateMany(
        { isOccupied: true },
        { rentStatus: 'due' }
      );

      console.log('Rent status updated for all occupied tenants.');
    } catch (error) {
      console.error('Error updating rent status:', error);
    }
  } else {
    console.log('Not the day to update rent status.');
  }
}

module.exports = updateRentStatusIfNeeded;
