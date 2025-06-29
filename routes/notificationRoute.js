const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Send a notification
router.post('/', notificationController.sendNotification);

// Get notifications for a user
router.get('/user/:userId', notificationController.getNotificationsForUser);

// Mark as read
router.post('/:id/read', notificationController.markAsRead);

module.exports = router;
