const AWS = require('aws-sdk');
const config = require('../config/config');
const logger = require('../config/logger');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region,
});

/**
 * Upload a file to S3
 * @param {string} fileKey - The key/path where the file will be stored in S3
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} contentType - The MIME type of the file
 * @param {Object} metadata - Optional metadata to attach to the file
 * @returns {Promise<Object>} - Returns the S3 upload response
 */
const uploadFile = async (fileKey, fileBuffer, contentType, metadata = {}) => {
  try {
    const params = {
      Bucket: config.aws.s3BucketName,
      Key: `test/${fileKey}`,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: metadata,
      ACL: 'public-read',
      // Removed ACL: 'public-read' - use backend to serve files instead
    };

    const result = await s3.upload(params).promise();
    logger.info(`File uploaded successfully: ${fileKey}`);
    return {
      success: true,
      url: result.Location,
      key: result.Key,
      etag: result.ETag,
    };
  } catch (error) {
    logger.error(`Error uploading file to S3: ${error.message}`);
    throw error;
  }
};

/**
 * Download a file from S3
 * @param {string} fileKey - The key/path of the file in S3
 * @returns {Promise<Buffer>} - Returns the file buffer
 */
const downloadFile = async (fileKey) => {
  try {
    const params = {
      Bucket: config.aws.s3BucketName,
      Key: fileKey,
    };

    const result = await s3.getObject(params).promise();
    logger.info(`File downloaded successfully: ${fileKey}`);
    return result.Body;
  } catch (error) {
    logger.error(`Error downloading file from S3: ${error.message}`);
    throw error;
  }
};

/**
 * Delete a file from S3
 * @param {string} fileKey - The key/path of the file in S3
 * @returns {Promise<Object>} - Returns deletion confirmation
 */
const deleteFile = async (fileKey) => {
  try {
    const params = {
      Bucket: config.aws.s3BucketName,
      Key: fileKey,
    };

    await s3.deleteObject(params).promise();
    logger.info(`File deleted successfully: ${fileKey}`);
    return {
      success: true,
      message: `File ${fileKey} deleted successfully`,
    };
  } catch (error) {
    logger.error(`Error deleting file from S3: ${error.message}`);
    throw error;
  }
};

/**
 * Get a signed URL for a file in S3 (for temporary access)
 * @param {string} fileKey - The key/path of the file in S3
 * @param {number} expiresIn - Time in seconds for which the URL is valid (default: 1 hour)
 * @returns {Promise<string>} - Returns the signed URL
 */
const getSignedUrl = async (fileKey, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: config.aws.s3BucketName,
      Key: fileKey,
      Expires: expiresIn,
    };

    const url = s3.getSignedUrl('getObject', params);
    logger.info(`Signed URL generated for: ${fileKey}`);
    return url;
  } catch (error) {
    logger.error(`Error generating signed URL: ${error.message}`);
    throw error;
  }
};

/**
 * List files in an S3 folder/prefix
 * @param {string} prefix - The folder prefix to list files from
 * @param {number} maxKeys - Maximum number of files to return (default: 1000)
 * @returns {Promise<Array>} - Returns array of file objects
 */
const listFiles = async (prefix = '', maxKeys = 1000) => {
  try {
    const params = {
      Bucket: config.aws.s3BucketName,
      Prefix: prefix,
      MaxKeys: maxKeys,
    };

    const result = await s3.listObjectsV2(params).promise();
    logger.info(`Listed files with prefix: ${prefix}`);
    return {
      files: result.Contents || [],
      isTruncated: result.IsTruncated,
      continuationToken: result.NextContinuationToken,
    };
  } catch (error) {
    logger.error(`Error listing files from S3: ${error.message}`);
    throw error;
  }
};

/**
 * Check if a file exists in S3
 * @param {string} fileKey - The key/path of the file in S3
 * @returns {Promise<boolean>} - Returns true if file exists, false otherwise
 */
const fileExists = async (fileKey) => {
  try {
    const params = {
      Bucket: config.aws.s3BucketName,
      Key: fileKey,
    };

    await s3.headObject(params).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    logger.error(`Error checking file existence in S3: ${error.message}`);
    throw error;
  }
};

/**
 * Get file metadata from S3
 * @param {string} fileKey - The key/path of the file in S3
 * @returns {Promise<Object>} - Returns file metadata
 */
const getFileMetadata = async (fileKey) => {
  try {
    const params = {
      Bucket: config.aws.s3BucketName,
      Key: fileKey,
    };

    const result = await s3.headObject(params).promise();
    logger.info(`Retrieved metadata for: ${fileKey}`);
    return {
      contentType: result.ContentType,
      contentLength: result.ContentLength,
      lastModified: result.LastModified,
      etag: result.ETag,
      metadata: result.Metadata,
    };
  } catch (error) {
    logger.error(`Error retrieving file metadata from S3: ${error.message}`);
    throw error;
  }
};

/**
 * Copy a file within S3
 * @param {string} sourceKey - The source file key
 * @param {string} destinationKey - The destination file key
 * @returns {Promise<Object>} - Returns copy confirmation
 */
const copyFile = async (sourceKey, destinationKey) => {
  try {
    const params = {
      Bucket: config.aws.s3BucketName,
      CopySource: `${config.aws.s3BucketName}/${sourceKey}`,
      Key: destinationKey,
    };

    const result = await s3.copyObject(params).promise();
    logger.info(`File copied from ${sourceKey} to ${destinationKey}`);
    return {
      success: true,
      message: `File copied successfully`,
      etag: result.CopyObjectResult.ETag,
    };
  } catch (error) {
    logger.error(`Error copying file in S3: ${error.message}`);
    throw error;
  }
};

module.exports = {
  uploadFile,
  downloadFile,
  deleteFile,
  getSignedUrl,
  listFiles,
  fileExists,
  getFileMetadata,
  copyFile,
};
