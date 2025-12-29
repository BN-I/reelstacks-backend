const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createFolder = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    user: Joi.string().custom(objectId),
  }),
};

const getFolders = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getFolder = {
  params: Joi.object().keys({
    folderId: Joi.string().custom(objectId),
  }),
};

const updateFolder = {
  params: Joi.object().keys({
    folderId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      user: Joi.string().custom(objectId),
    })
    .min(1),
};

const deleteFolder = {
  params: Joi.object().keys({
    folderId: Joi.string().custom(objectId),
  }),
};

const getUserFolders = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

module.exports = {
  createFolder,
  getFolders,
  getFolder,
  updateFolder,
  deleteFolder,
  getUserFolders,
};
