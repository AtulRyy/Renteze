const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/', notificationController.getNotificationsByEmail);

router.post('/', notificationController.sendNotification);

router.get('/user/:userId', notificationController.getNotificationsForUser);

router.post('/:id/read', notificationController.markAsRead);

router.patch("/markAllRead", notificationController.markAllAsRead);

module.exports = router;
