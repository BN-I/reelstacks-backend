const httpStatus = require('http-status');
const { Reel } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const s3Service = require('./s3.service');
const { fetchOGMetaTags } = require('../utils/ogMetaTags');
const { downloadImage, generateFileName } = require('../utils/imageDownloader');
const { default: axios } = require('axios');
const https = require('https');
const { decodeUrl } = require('../../tests/utils/common');

const createReel = async (reelBody, user) => {
  try {
    console.log('Creating reel with body:', reelBody);
    let meta = {};
    const url = reelBody.url;

    if (url.includes('tiktok.com')) {
      const tiktokMeta = await axios.get(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
      meta = {
        url: url,
        folder: reelBody.folder,
        title: tiktokMeta.data.title,
        description: tiktokMeta.data.author_name,
        image: tiktokMeta.data.thumbnail_url,
      };
    } else if (url.includes('youtube.com')) {
      const youtubeMeta = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}`);
      console.log('Youtube Meta:', youtubeMeta.data);
      meta = {
        url: url,
        folder: reelBody.folder,
        title: youtubeMeta.data.title,
        description: youtubeMeta.data.author_name,
        image: youtubeMeta.data.thumbnail_url,
      };
    } else if (url.includes('x.com')) {
      const xMeta = await axios.get(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`);
      meta = {
        url: url,
        folder: reelBody.folder,
        title: xMeta.data.html,
        description: xMeta.data.author_name,
        image: `https://pbs.twimg.com/profile_images/1683497657388392455/yW7azZHt_400x400.jpg`,
      };
    } else {
      // Fetch OG meta tags from the URL
      const ogTags = await fetchOGMetaTags(url);
      console.log('Fetched OG Tags:', ogTags);

      // Download and upload image to S3 if available
      let imageUrl = '';

      try {
        const { buffer, contentType } = await downloadImage(decodeUrl(ogTags.thumbnail) || ogTags.thumbnail);
        const fileName = generateFileName(ogTags.thumbnail);

        // Upload image to S3
        const uploadResult = await s3Service.uploadFile(fileName, buffer, contentType, {
          originalUrl: ogTags.thumbnail,
        });

        imageUrl = uploadResult.url;
      } catch (imageError) {
        logger.warn(`Failed to process and upload image: ${imageError.message}`);
      }

      // Create the reel with fetched data
      meta = {
        url: url,
        folder: reelBody.folder,
        title: ogTags.title || 'Untitled',
        description: ogTags.description || '',
        image: imageUrl, // Use the S3 URL
      };
    }
    const reelMeta = {
      url: url,
      folder: reelBody.folder,
      user: user._id,
      title: meta.title || 'Untitled',
      description: meta.description || '',
      image: meta.image, // Use the S3 URL
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

module.exports = {
  createReel,
  queryReels,
  getReelById,
  deleteReelById,
  deleteManyReelsByUser,
};
