const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { folderService, reelService } = require('../services');

const createFolder = catchAsync(async (req, res) => {
  const body = Object.assign({}, req.body);
  if (!body.user && req.user) body.user = req.user._id;
  const folder = await folderService.createFolder(body);
  res.status(httpStatus.CREATED).send(folder);
});

const getFolders = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'user']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  if (filter.name) {
    filter.name = {
      $regex: filter.name,
      $options: 'i', // case-insensitive
    };
  }

  options.populate = 'user';

  const result = await folderService.queryFolders(filter, options);
  res.send(result);
});

const getFolder = catchAsync(async (req, res) => {
  const folder = await folderService.getFolderById(req.params.folderId);
  res.send(folder);
});

const updateFolder = catchAsync(async (req, res) => {
  const folder = await folderService.updateFolderById(req.params.folderId, req.body);
  res.send(folder);
});

const deleteFolder = catchAsync(async (req, res) => {
  await reelService.deleteReelsByFolder(req.params.folderId);
  await folderService.deleteFolderById(req.params.folderId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getUserFolders = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  if (!options.sortBy) options.sortBy = 'createdAt:desc';
  console.log(req.query);
  if (filter.name) {
    filter.name = {
      $regex: filter.name,
      $options: 'i', // case-insensitive
    };
  }

  if (req.user) {
    filter.user = req.user._id;
  }

  const result = await folderService.getUserFolders(filter, options);

  const folders = result.results.map(async (folder) => {
    const reel = await reelService.queryReels({ folder: folder._id }, { limit: 4 });
    return {
      ...folder.toJSON(),
      thumbnails: reel.results.map((r) => r.image) || null,
      count: reel.totalResults,
    };
  });

  result.results = await Promise.all(folders);
  res.send(result);
});

const getAllUserFolders = catchAsync(async (req, res) => {
  const filter = { user: req.user._id };
  const folders = await folderService.getAllUserFolders(filter);
  res.send(folders);
});

module.exports = {
  createFolder,
  getFolders,
  getFolder,
  updateFolder,
  deleteFolder,
  getUserFolders,
  getAllUserFolders,
};
