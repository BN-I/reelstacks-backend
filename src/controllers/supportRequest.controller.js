const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { SupportRequest } = require('../models');

// Create a new support request
exports.createSupportRequest = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { title, description } = req.body;
  const supportRequest = await SupportRequest.create({
    user: userId,
    title,
    description,
  });
  res.status(httpStatus.CREATED).send(supportRequest);
});

// Get all support requests for the current user
exports.getMySupportRequests = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const requests = await SupportRequest.find({ user: userId }).sort({ createdAt: -1 });
  res.status(httpStatus.OK).send(requests);
});
