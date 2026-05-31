const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const redisClient = require('../utils/redisClient');
const s3Service = require('../services/s3.service');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const updateOnBoardingCompleted = catchAsync(async (req, res) => {
  console.log(req.user.id);
  const user = await userService.updateUserById(req.user.id, { OnBoardingCompleted: true });
  res.send(user);
});

const getMe = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  res.send(user);
});

const updateMe = catchAsync(async (req, res) => {
  const allowed = pick(req.body, ['name', 'profilePicture']);
  const user = await userService.updateUserById(req.user.id, allowed);
  res.send(user);
});

const changePassword = catchAsync(async (req, res) => {
  const { otp, newPassword } = req.body;
  const otpKey = `otp:${req.user.email}`;
  const storedOtp = await redisClient.get(otpKey);
  if (!storedOtp) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'OTP expired or not found');
  }
  if (storedOtp !== otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP');
  }
  await redisClient.del(otpKey);
  await userService.updateUserById(req.user.id, { password: newPassword });
  res.status(httpStatus.NO_CONTENT).send();
});

const uploadAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No image file provided');
  }
  const ext = req.file.originalname.split('.').pop() || 'jpg';
  const fileKey = `avatars/${req.user.id}-${Date.now()}.${ext}`;
  const result = await s3Service.uploadFile(fileKey, req.file.buffer, req.file.mimetype);
  const user = await userService.updateUserById(req.user.id, { profilePicture: result.url });
  res.send(user);
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateOnBoardingCompleted,
  getMe,
  updateMe,
  changePassword,
  uploadAvatar,
};
