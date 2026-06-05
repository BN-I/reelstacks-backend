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

/**
 * Get all folders for a user
 * @param {string} userId
 * @param {Object} options
 * @returns {Promise<Array>}
 */
const getUserFolders = async (filter = {}, options = {}) => {
  const folders = await Folder.paginate(filter, options);
  return folders;
};

const getAllUserFolders = async (filter = {}) => {
  return Folder.find(filter).select('id name user sort').sort({ sort: 1, createdAt: 1 });
};

const reorderFolders = async (userId, folderIds) => {
  const bulkOps = folderIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, user: userId },
      update: { $set: { sort: index } },
    },
  }));
  await Folder.bulkWrite(bulkOps);
};

module.exports = {
  createFolder,
  queryFolders,
  getFolderById,
  updateFolderById,
  deleteFolderById,
  getUserFolders,
  getAllUserFolders,
  reorderFolders,
};
