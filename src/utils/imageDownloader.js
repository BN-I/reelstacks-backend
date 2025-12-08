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

      const options = {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          Referer: 'https://google.com',
        },
        timeout: 15000,
      };

      const req = protocol.get(imageUrl, options, (response) => {
        const status = response.statusCode;

        // Follow redirects
        if ([301, 302, 303, 307, 308].includes(status)) {
          return resolve(downloadImage(response.headers.location));
        }

        const contentType = response.headers['content-type'] || '';

        if (!contentType.startsWith('image/')) {
          return reject(new Error(`URL did not return an image. Type: ${contentType}`));
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          resolve({
            buffer: Buffer.concat(chunks),
            contentType,
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Image download timeout'));
      });
    } catch (err) {
      reject(err);
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

  return `${timestamp}-${randomString}-${originalFileName}`;
};

module.exports = {
  downloadImage,
  generateFileName,
};
