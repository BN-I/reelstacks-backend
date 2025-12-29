const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createReel = {
  body: Joi.object().keys({
    url: Joi.string().required().uri(),
    folder: Joi.string().required().custom(objectId),
  }),
};

const getReels = {
  query: Joi.object().keys({
    title: Joi.string(),
    folder: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getReel = {
  params: Joi.object().keys({
    reelId: Joi.string().custom(objectId),
  }),
};

const getReelsByFolder = {
  params: Joi.object().keys({
    folderId: Joi.string().custom(objectId),
  }),
  query: Joi.object().keys({
    title: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const updateReel = {
  params: Joi.object().keys({
    reelId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      url: Joi.string().uri(),
      folder: Joi.string().custom(objectId),
    })
    .min(1),
};

const deleteReel = {
  params: Joi.object().keys({
    reelId: Joi.string().custom(objectId),
  }),
};

const deleteManyReels = {
  body: Joi.object().keys({
    reelIds: Joi.array().items(Joi.string().custom(objectId)).min(1).required(),
  }),
};

module.exports = {
  createReel,
  getReels,
  getReel,
  updateReel,
  deleteReel,
  getReelsByFolder,
  deleteManyReels,
};
