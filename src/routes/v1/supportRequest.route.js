const express = require('express');
const auth = require('../../middlewares/auth');
const supportRequestController = require('../../controllers/supportRequest.controller');

const router = express.Router();

// Create a new support request
router.post('/', auth(), supportRequestController.createSupportRequest);

// Get all support requests for the current user
router.get('/', auth(), supportRequestController.getMySupportRequests);

module.exports = router;
