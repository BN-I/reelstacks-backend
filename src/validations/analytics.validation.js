const Joi = require('joi');
const { query } = require('../config/logger');

const getAnalytics = {
  query: Joi.object().keys({}),
};

module.exports = {
  getAnalytics,
};
