const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { Feedback } = require('../models');

exports.createFeedback = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { rating, title, message } = req.body;
  const feedback = await Feedback.create({ user: userId, rating, title, message });
  res.status(httpStatus.CREATED).send(feedback);
});

exports.getMyFeedback = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const feedbacks = await Feedback.find({ user: userId }).sort({ createdAt: -1 });
  res.status(httpStatus.OK).send(feedbacks);
});
