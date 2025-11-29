const httpStatus = require('http-status');
const { Folder } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a folder
 * @param {Object} folderBody
 * @returns {Promise<Folder>}
 */
const createFolder = async (folderBody) => {
  return Folder.create(folderBody);
};

/**
 * Query for folders
 */
const queryFolders = async (filter, options) => {
  const folders = await Folder.paginate(filter, options);
  return folders;
};

const getFolderById = async (id) => {
  return Folder.findById(id);
};

const updateFolderById = async (folderId, updateBody) => {
  const folder = await getFolderById(folderId);
  if (!folder) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Folder not found');
  }
  Object.assign(folder, updateBody);
  await folder.save();
  return folder;
};

const deleteFolderById = async (folderId) => {
  const folder = await getFolderById(folderId);
  if (!folder) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Folder not found');
  }
  await folder.remove();
  return folder;
};

module.exports = {
  createFolder,
  queryFolders,
  getFolderById,
  updateFolderById,
  deleteFolderById,
};
