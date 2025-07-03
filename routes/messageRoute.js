const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// Create message
router.post('/', messageController.createMessage);

// ✅ FIXED: Get messages for a user using query param ?email=
router.get('/user', messageController.getMessagesForUser);

// Respond to message
router.post('/:id/respond', messageController.respondToMessage);

// Close message
router.post('/:id/close', messageController.closeMessage);

module.exports = router;
