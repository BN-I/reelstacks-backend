const https = require('https');
const http = require('http');
const logger = require('../config/logger');

/**
 * Fetch Open Graph meta tags from a URL
 * @param {string} url - The URL to fetch meta tags from
 * @returns {Promise<Object>} - Returns an object with title, description, and image
 */
const fetchOGMetaTags = async (url) => {
  return new Promise((resolve, reject) => {
    try {
      const protocol = url.startsWith('https') ? https : http;

      const request = protocol.get(
        url,
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 5.1; rv:19.0) Gecko/20100101 Firefox/19.0',
          },
        },
        (response) => {
          let htmlData = '';

          response.on('data', (chunk) => {
            console.log(chunk);
            htmlData += chunk.toString();
            // if (htmlData.length > 100000) request.abort();
          });

          response.on('end', () => {
            const metaTags = parseMetaTags(htmlData);
            resolve(metaTags);
          });
        }
      );

      request.on('error', reject);
      request.on('timeout', () => {
        request.abort();
        reject(new Error('Request timeout'));
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Parse HTML and extract OG meta tags
 * @param {string} htmlData - The HTML content
 * @returns {Object} - Returns an object with title, description, and image
 */
const parseMetaTags = (htmlData) => {
  const metaTags = {
    title: null,
    description: null,
    image: null,
  };

  // Extract Open Graph title
  const ogTitleMatch = htmlData.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  if (ogTitleMatch) {
    metaTags.title = ogTitleMatch[1];
  }

  // Extract Open Graph description
  const ogDescriptionMatch = htmlData.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  if (ogDescriptionMatch) {
    metaTags.description = ogDescriptionMatch[1];
  }

  // Extract Open Graph image
  const ogImageMatch = htmlData.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    metaTags.image = ogImageMatch[1];
  }

  // Fallback: Extract regular meta tags if OG tags not found
  if (!metaTags.title) {
    const titleMatch = htmlData.match(/<title\s*>([^<]+)<\/title>/i);
    if (titleMatch) {
      metaTags.title = titleMatch[1];
    }
  }

  if (!metaTags.description) {
    const descriptionMatch = htmlData.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (descriptionMatch) {
      metaTags.description = descriptionMatch[1];
    }
  }

  return metaTags;
};

module.exports = {
  fetchOGMetaTags,
};
