const httpStatus = require('http-status');
const { Reel } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const s3Service = require('./s3.service');
const { fetchOGMetaTags, getDomainFallbackMeta } = require('../utils/ogMetaTags');
const { downloadImage, generateFileName } = require('../utils/imageDownloader');
const { default: axios } = require('axios');
const https = require('https');
const { decodeUrl } = require('../../tests/utils/common');

const FALLBACK_IMAGE = 'https://reelstacks-thumbnails.s3.us-east-1.amazonaws.com/test/dummy.webp';

const fetchMetaWithPuppeteer = async (url, folder) => {
  let ogTags = {};
  try {
    ogTags = await fetchOGMetaTags(url);
  } catch (err) {
    logger.warn(`Puppeteer OG fetch failed for ${url}: ${err.message}`);
  }

  // If page-level OG tags are unavailable (private/ad/blocked), fall back to domain branding
  if (!ogTags.thumbnail) {
    logger.warn(`Falling back to domain branding for ${url}`);
    ogTags = getDomainFallbackMeta(url);
  }

  let imageUrl = FALLBACK_IMAGE;
  if (ogTags.thumbnail) {
    try {
      const { buffer, contentType } = await downloadImage(decodeUrl(ogTags.thumbnail) || ogTags.thumbnail);
      const fileName = generateFileName(ogTags.thumbnail);
      const uploadResult = await s3Service.uploadFile(fileName, buffer, contentType, {
        originalUrl: ogTags.thumbnail,
      });
      imageUrl = uploadResult.url;
    } catch (imageError) {
      logger.warn(`Failed to process and upload image: ${imageError.message}`);
    }
  }

  return {
    url,
    folder,
    title: ogTags.title || 'Untitled',
    description: ogTags.description || '',
    image: imageUrl,
  };
};

const createReel = async (reelBody, user) => {
  try {
    console.log('Creating reel with body:', reelBody);
    let meta = {};
    const url = reelBody.url;

    if (url.includes('tiktok.com')) {
      try {
        const tiktokMeta = await axios.get(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
        meta = {
          url,
          folder: reelBody.folder,
          title: tiktokMeta.data.title,
          description: tiktokMeta.data.author_name,
          image: tiktokMeta.data.thumbnail_url,
        };
      } catch (oembedErr) {
        logger.warn(`TikTok oembed failed, falling back to Puppeteer: ${oembedErr.message}`);
        meta = await fetchMetaWithPuppeteer(url, reelBody.folder);
      }
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      try {
        const youtubeMeta = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}`);
        meta = {
          url,
          folder: reelBody.folder,
          title: youtubeMeta.data.title,
          description: youtubeMeta.data.author_name,
          image: youtubeMeta.data.thumbnail_url,
        };
      } catch (oembedErr) {
        logger.warn(`YouTube oembed failed, falling back to Puppeteer: ${oembedErr.message}`);
        meta = await fetchMetaWithPuppeteer(url, reelBody.folder);
      }
    } else if (url.includes('x.com')) {
      try {
        const xMeta = await axios.get(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`);
        meta = {
          url,
          folder: reelBody.folder,
          title: xMeta.data.html,
          description: xMeta.data.author_name,
          image: `https://pbs.twimg.com/profile_images/1683497657388392455/yW7azZHt_400x400.jpg`,
        };
      } catch (oembedErr) {
        logger.warn(`X oembed failed, falling back to Puppeteer: ${oembedErr.message}`);
        meta = await fetchMetaWithPuppeteer(url, reelBody.folder);
      }
    } else {
      meta = await fetchMetaWithPuppeteer(url, reelBody.folder);
    }
    const reelMeta = {
      url: url,
      folder: reelBody.folder,
      user: user._id,
      title: meta.title || 'Untitled',
      description: meta.description || '',
      image: meta.image || FALLBACK_IMAGE,
    };

    return Reel.create(reelMeta);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error creating reel: ${error.message}`);
  }
};

const queryReels = async (filter, options) => {
  options.populate = 'folder user';
  const reels = await Reel.paginate(filter, options);
  return reels;
};

const getReelById = async (id) => {
  return Reel.findById(id).populate('folder user');
};

const deleteReelById = async (reelId) => {
  const reel = await getReelById(reelId);
  if (!reel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reel not found');
  }
  await reel.remove();
  return reel;
};

/**
 * Delete multiple reels by IDs, only if they belong to the user
 * @param {string[]} reelIds
 * @param {string} userId
 * @returns {Promise<number>} Number of deleted reels
 */
const deleteManyReelsByUser = async (reelIds, userId) => {
  const { deletedCount } = await Reel.deleteMany({ _id: { $in: reelIds }, user: userId });
  return deletedCount;
};

const deleteReelsByFolder = async (folderId) => {
  const { deletedCount } = await Reel.deleteMany({ folder: folderId });
  return deletedCount;
};

module.exports = {
  createReel,
  queryReels,
  getReelById,
  deleteReelById,
  deleteManyReelsByUser,
  deleteReelsByFolder,
};
