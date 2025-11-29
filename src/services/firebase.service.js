const admin = require('firebase-admin');
const logger = require('../config/logger');

let initialized = false;

const init = (serviceAccount) => {
  if (initialized) return;
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  initialized = true;
  logger.info('Firebase admin initialized');
};

const verifyIdToken = async (idToken) => {
  if (!initialized) throw new Error('Firebase not initialized');
  const decoded = await admin.auth().verifyIdToken(idToken);
  return decoded;
};

module.exports = {
  init,
  verifyIdToken,
};
