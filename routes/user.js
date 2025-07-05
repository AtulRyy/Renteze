const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Add your get-user-by-email endpoint
router.get('/api/users/by-email/:email', userController.getUserByEmail);

module.exports = router;
