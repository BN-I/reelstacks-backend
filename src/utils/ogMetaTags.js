const https = require('https');
const http = require('http');
const logger = require('../config/logger');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

/**
 * Fetch Open Graph meta tags from a URL
 * @param {string} url - The URL to fetch meta tags from
 * @returns {Promise<Object>} - Returns an object with title, description, and image
 */
const fetchOGMetaTags = async (reelUrl) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Block unnecessary resources to speed things up
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Use 'networkidle2' instead of 'domcontentloaded' — waits for redirects to settle
    await page.goto(reelUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for at least one OG meta tag to appear in the DOM
    await page
      .waitForSelector('meta[property="og:image"], meta[property="og:title"]', {
        timeout: 10000,
      })
      .catch(() => null); // don't throw if not found, handle below

    const meta = await page.evaluate(() => {
      const get = (sel) => document.querySelector(sel)?.getAttribute('content');
      return {
        thumbnail: get('meta[property="og:image"]') || get('meta[property="og:image:url"]'),
        title: get('meta[property="og:title"]'),
        description: get('meta[property="og:description"]'),
      };
    });

    return meta;
  } finally {
    await browser.close();
  }
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
