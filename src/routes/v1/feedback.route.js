const express = require('express');
const auth = require('../../middlewares/auth');
const feedbackController = require('../../controllers/feedback.controller');

const router = express.Router();

router.post('/', auth(), feedbackController.createFeedback);
router.get('/', auth(), feedbackController.getMyFeedback);

module.exports = router;
