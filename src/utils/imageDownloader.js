const https = require('https');
const http = require('http');
const logger = require('../config/logger');

/**
 * Download an image from a URL
 * @param {string} imageUrl - The URL of the image to download
 * @returns {Promise<{buffer: Buffer, contentType: string}>} - Returns the image buffer and content type
 */
const downloadImage = async (imageUrl) => {
  return new Promise((resolve, reject) => {
    try {
      const protocol = imageUrl.startsWith('https') ? https : http;

      const request = protocol.get(imageUrl, { timeout: 10000 }, (response) => {
        const contentType = response.headers['content-type'] || 'image/jpeg';
        const chunks = [];

        response.on('data', (chunk) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({ buffer, contentType });
        });
      });

      request.on('error', (error) => {
        logger.error(`Error downloading image from ${imageUrl}: ${error.message}`);
        reject(error);
      });

      request.on('timeout', () => {
        request.abort();
        logger.error(`Timeout downloading image from ${imageUrl}`);
        reject(new Error('Request timeout'));
      });
    } catch (error) {
      logger.error(`Error in downloadImage: ${error.message}`);
      reject(error);
    }
  });
};

/**
 * Generate a unique file name for S3
 * @param {string} originalUrl - The original image URL
 * @returns {string} - Returns a unique file name
 */
const generateFileName = (originalUrl) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 9);
  const urlParts = originalUrl.split('/');
  const originalFileName = urlParts[urlParts.length - 1].split('?')[0] || 'image';

  return `reels/${timestamp}-${randomString}-${originalFileName}`;
};

module.exports = {
  downloadImage,
  generateFileName,
};
