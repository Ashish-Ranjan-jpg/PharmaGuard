/**
 * Cloudinary Service
 * Handles VCF file upload to Cloudinary for storage
 */

const cloudinary = require('cloudinary').v2;

function initCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} fileName - Original filename
 * @param {string} userId - User ID for folder organization
 * @returns {object} Upload result with URL
 */
async function uploadVCFFile(fileBuffer, fileName, userId = 'anonymous') {
  try {
    initCloudinary();

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: `pharmaguard/${userId}/vcf_files`,
          public_id: `${fileName}_${Date.now()}`,
          tags: ['vcf', 'pharmacogenomics', 'pharmaguard'],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              success: true,
              url: result.secure_url,
              publicId: result.public_id,
              fileName: fileName,
              size: result.bytes,
              uploadedAt: result.created_at,
            });
          }
        }
      );

      // Convert buffer to stream and pipe to upload
      const { Readable } = require('stream');
      const readableStream = new Readable();
      readableStream.push(fileBuffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error.message);
    return {
      success: false,
      error: error.message,
      url: null,
    };
  }
}

/**
 * Upload a profile image buffer to Cloudinary
 * @param {Buffer} fileBuffer - The image buffer to upload
 * @param {string} userId - User ID for folder organization
 * @returns {object} Upload result with URL
 */
async function uploadProfileImage(fileBuffer, userId = 'anonymous') {
  try {
    initCloudinary();

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: `pharmaguard/${userId}/profile_images`,
          public_id: `avatar_${Date.now()}`,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' }
          ],
          tags: ['avatar', 'profile', 'pharmaguard'],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              success: true,
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              uploadedAt: result.created_at,
            });
          }
        }
      );

      const { Readable } = require('stream');
      const readableStream = new Readable();
      readableStream.push(fileBuffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  } catch (error) {
    console.error('Cloudinary image upload error:', error.message);
    return {
      success: false,
      error: error.message,
      url: null,
    };
  }
}

module.exports = { uploadVCFFile, uploadProfileImage, initCloudinary };
