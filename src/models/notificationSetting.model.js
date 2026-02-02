const mongoose = require('mongoose');

const notificationTypes = ['promotion', 'reminder', 'event'];

const channelSchema = new mongoose.Schema(
  {
    promotion: { type: Boolean, default: true },
    reminder: { type: Boolean, default: true },
    event: { type: Boolean, default: true },
  },
  { _id: false }
);

const notificationSettingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    push: {
      type: channelSchema,
      default: () => ({}),
    },
    email: {
      type: channelSchema,
      default: () => ({}),
    },
    text: {
      type: channelSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

const NotificationSetting = mongoose.model('NotificationSetting', notificationSettingSchema);

module.exports = NotificationSetting;
