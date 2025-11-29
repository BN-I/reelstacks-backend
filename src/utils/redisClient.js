// src/utils/redisClient.js
const { createClient } = require('redis');
const logger = require('../config/logger');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

(async () => {
  redisClient.on('error', (err) => {
    console.log('Redis Client Error', err);
    process.exit(1);
  });
  if (!redisClient.isOpen) {
    await redisClient.connect();
    logger.info('Connected to Redis');
  }
})();

module.exports = redisClient;
