const httpStatus = require('http-status');
const { Reel } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const { s3Service } = require('./index');
const { fetchOGMetaTags } = require('../utils/ogMetaTags');
const { downloadImage, generateFileName } = require('../utils/imageDownloader');

const createReel = async (reelBody) => {
  try {
    // Fetch OG meta tags from the URL
    const ogTags = await fetchOGMetaTags(reelBody.url);

    // Download the image from the OG image URL
    let imageUrl = null;
    if (ogTags.image) {
      try {
        const { buffer, contentType } = await downloadImage(ogTags.image);
        const fileName = generateFileName(ogTags.image);

        // Upload image to S3
        const uploadResult = await s3Service.uploadFile(fileName, buffer, contentType, {
          originalUrl: ogTags.image,
        });

        imageUrl = uploadResult.url;
      } catch (imageError) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Failed to process image: ${imageError.message}`);
      }
    }

    if (!imageUrl) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Could not process the image from the URL');
    }

    // Create the reel with fetched data
    const reelData = {
      url: reelBody.url,
      folder: reelBody.folder,
      title: ogTags.title || 'Untitled',
      description: ogTags.description || '',
      image: imageUrl,
    };

    return Reel.create(reelData);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error creating reel: ${error.message}`);
  }
};

const queryReels = async (filter, options) => {
  const reels = await Reel.paginate(filter, options);
  return reels;
};

const getReelById = async (id) => {
  return Reel.findById(id);
};

const updateReelById = async (reelId, updateBody) => {
  try {
    const reel = await getReelById(reelId);
    if (!reel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Reel not found');
    }

    // If URL is being updated, fetch new OG tags and image
    if (updateBody.url && updateBody.url !== reel.url) {
      const ogTags = await fetchOGMetaTags(updateBody.url);

      // Download and upload new image if available
      let imageUrl = reel.image; // Keep existing image by default
      if (ogTags.image) {
        try {
          const { buffer, contentType } = await downloadImage(ogTags.image);
          const fileName = generateFileName(ogTags.image);

          // Upload new image to S3
          const uploadResult = await s3Service.uploadFile(fileName, buffer, contentType, {
            originalUrl: ogTags.image,
          });

          imageUrl = uploadResult.url;

          // Delete old image from S3 if it exists
          const oldImageKey = reel.image.split('.com/').pop();
          if (oldImageKey) {
            await s3Service.deleteFile(oldImageKey).catch((err) => {
              // Log error but don't fail the update
              logger.warn(`Failed to delete old image from S3: ${err.message}`);
            });
          }
        } catch (imageError) {
          throw new ApiError(httpStatus.BAD_REQUEST, `Failed to process new image: ${imageError.message}`);
        }
      }

      // Update reel with OG tag data
      reel.url = updateBody.url;
      reel.title = ogTags.title || reel.title;
      reel.description = ogTags.description || reel.description;
      reel.image = imageUrl;
    }

    // Update folder if provided (allowed regardless of URL change)
    if (updateBody.folder) {
      reel.folder = updateBody.folder;
    }

    await reel.save();
    return reel;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error updating reel: ${error.message}`);
  }
};

const deleteReelById = async (reelId) => {
  const reel = await getReelById(reelId);
  if (!reel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reel not found');
  }
  await reel.remove();
  return reel;
};

module.exports = {
  createReel,
  queryReels,
  getReelById,
  updateReelById,
  deleteReelById,
};
