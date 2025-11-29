const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { folderService } = require('../services');

const createFolder = catchAsync(async (req, res) => {
  const body = Object.assign({}, req.body);
  if (!body.user && req.user) body.user = req.user._id;
  const folder = await folderService.createFolder(body);
  res.status(httpStatus.CREATED).send(folder);
});

const getFolders = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
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
  await folderService.deleteFolderById(req.params.folderId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createFolder,
  getFolders,
  getFolder,
  updateFolder,
  deleteFolder,
};
