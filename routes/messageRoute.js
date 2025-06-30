const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// Create message
router.post('/', messageController.createMessage);

// Get messages for a user
router.get('/user/:userId', messageController.getMessagesForUser);

// Respond to message
router.post('/:id/respond', messageController.respondToMessage);

// Close message
router.post('/:id/close', messageController.closeMessage);

module.exports = router;
