const Joi = require('joi');

const createCategory = {
  body: Joi.object().keys({
    name: Joi.string().required(),
  }),
};

module.exports = {
  createCategory,
};
