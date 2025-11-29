const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const redisClient = require('./utils/redisClient');
const { firebaseService } = require('./services');

// Attempt Redis connect once (no retries)
(async () => {
  try {
    await redisClient.connectOnce();
  } catch (err) {
    logger.warn('Redis connectOnce failed during startup');
  }
})();

// Initialize Firebase if service account provided via env var

try {
  const serviceAccount = config.firebase;
  firebaseService.init(serviceAccount);
  logger.info('Firebase admin initialized');
} catch (err) {
  logger.warn('Failed to initialize Firebase admin:', err.message || err);
}

let server;
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
