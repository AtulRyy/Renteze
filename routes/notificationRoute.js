const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// ✅ GET /notifications?email=... → get notifications by email
router.get('/', notificationController.getNotificationsByEmail);

// ✅ POST /notifications → send a new notification
router.post('/', notificationController.sendNotification);

// ✅ GET /notifications/user/:userId → get notifications by user ID
router.get('/user/:userId', notificationController.getNotificationsForUser);

// ✅ POST /notifications/:id/read → mark a notification as read
router.post('/:id/read', notificationController.markAsRead);

router.patch("/markAllRead", notificationController.markAllAsRead);

module.exports = router;
