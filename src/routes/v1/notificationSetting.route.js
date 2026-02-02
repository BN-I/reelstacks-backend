const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const notificationSettingController = require('../../controllers/notificationSetting.controller');

const router = express.Router();

// Get current user's notification settings
router.get('/', auth(), notificationSettingController.getNotificationSettings);

// Update current user's notification settings
router.patch('/', auth(), notificationSettingController.updateNotificationSettings);

module.exports = router;
