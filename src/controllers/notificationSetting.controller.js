const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { NotificationSetting } = require('../models');

// Get current user's notification settings
exports.getNotificationSettings = catchAsync(async (req, res) => {
  const userId = req.user.id;
  let settings = await NotificationSetting.findOne({ user: userId });
  if (!settings) {
    // Create default settings if not found
    settings = await NotificationSetting.create({ user: userId });
  }
  res.status(httpStatus.OK).send(settings);
});

// Update current user's notification settings
exports.updateNotificationSettings = catchAsync(async (req, res) => {
  const userId = req.user.id;
  let settings = await NotificationSetting.findOne({ user: userId });
  if (!settings) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification settings not found');
  }
  Object.assign(settings, req.body);
  await settings.save();
  res.status(httpStatus.OK).send(settings);
});
