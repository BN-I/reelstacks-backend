const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { reelService } = require('../services');

const createReel = catchAsync(async (req, res) => {
  const body = Object.assign({}, req.body);
  const user = req.user;
  const reel = await reelService.createReel(body, user);
  res.status(httpStatus.CREATED).send(reel);
});

const getAllReels = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'folder']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  if (filter.title) {
    filter.title = {
      $regex: filter.title,
      $options: 'i', // case-insensitive
    };
  }

  const result = await reelService.queryReels(filter, options);
  res.send(result);
});

const getReels = catchAsync(async (req, res) => {
  const user = req.user;
  const filter = pick(req.query, ['title', 'folder']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  if (filter.title) {
    filter.title = {
      $regex: filter.title,
      $options: 'i', // case-insensitive
    };
  }

  if (user) {
    filter.user = user._id;
  }
  const result = await reelService.queryReels(filter, options);
  res.send(result);
});

const getReel = catchAsync(async (req, res) => {
  const reel = await reelService.getReelById(req.params.reelId);
  res.send(reel);
});

const getReelsByFolder = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  if (filter.title) {
    filter.title = {
      $regex: filter.title,
      $options: 'i', // case-insensitive
    };
  }

  if (req.user) {
    filter.user = req.user._id;
  }

  if (req.params.folderId) {
    filter.folder = req.params.folderId;
  }

  const reels = await reelService.queryReels(filter, options);
  res.send(reels);
});

const deleteReel = catchAsync(async (req, res) => {
  await reelService.deleteReelById(req.params.reelId);
  res.status(httpStatus.NO_CONTENT).send();
});

// Bulk delete reels belonging to the authenticated user
const deleteManyReels = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { reelIds } = req.body;
  if (!Array.isArray(reelIds) || reelIds.length === 0) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'reelIds must be a non-empty array' });
  }
  // Only delete reels that belong to the user
  const deletedCount = await reelService.deleteManyReelsByUser(reelIds, userId);
  res.status(httpStatus.OK).send({ deletedCount });
});

module.exports = {
  createReel,
  getReels,
  getReel,
  deleteReel,
  getReelsByFolder,
  deleteManyReels,
  getAllReels,
};
