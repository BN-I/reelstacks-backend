const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { reelService } = require('../services');

const createReel = catchAsync(async (req, res) => {
  const body = Object.assign({}, req.body);
  const reel = await reelService.createReel(body);
  res.status(httpStatus.CREATED).send(reel);
});

const getReels = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'folder']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await reelService.queryReels(filter, options);
  res.send(result);
});

const getReel = catchAsync(async (req, res) => {
  const reel = await reelService.getReelById(req.params.reelId);
  res.send(reel);
});

const deleteReel = catchAsync(async (req, res) => {
  await reelService.deleteReelById(req.params.reelId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createReel,
  getReels,
  getReel,
  deleteReel,
};
