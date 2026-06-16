const puppeteer = require('puppeteer');

/**
 * Fetch Open Graph meta tags from a URL
 * @param {string} url - The URL to fetch meta tags from
 * @returns {Promise<Object>} - Returns an object with title, description, and image
 */
const fetchOGMetaTags = async (reelUrl) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(reelUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const meta = await page.evaluate(() => {
      console.log(document);
      const get = (sel) => document.querySelector(sel)?.getAttribute('content');
      return {
        thumbnail: get('meta[property="og:image"]') || get('meta[property="og:image:url"]'),
        title: get('meta[property="og:title"]'),
        description: get('meta[property="og:description"]'),
      };
    });

    if (!meta.thumbnail) {
      throw new Error('Thumbnail not found — Reel may be private or restricted');
    }

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

const getDomainFallbackMeta = (url) => {
  const { hostname } = new URL(url);
  const domain = hostname.replace(/^www\./, '');
  const brandName = domain.split('.')[0];
  const title = brandName.charAt(0).toUpperCase() + brandName.slice(1);
  return {
    title,
    description: domain,
    thumbnail: `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
  };
};

module.exports = {
  fetchOGMetaTags,
  getDomainFallbackMeta,
};
