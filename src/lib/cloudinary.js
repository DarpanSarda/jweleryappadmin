import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary immediately when module loads
let cloudinaryConfigured = false;

if (process.env.CLOUDINARY_URL) {
  try {
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    console.log('Configuring Cloudinary from CLOUDINARY_URL:', cloudinaryUrl.replace(/:([^@]+)@/, ':***@'));

    const match = cloudinaryUrl.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)$/);

    if (match) {
      const [, apiKey, apiSecret, cloudName] = match;

      // Set configuration using the global config
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      // Verify configuration was applied
      const config = cloudinary.config();
      cloudinaryConfigured = !!(config.cloud_name && config.api_key && config.api_secret);

      console.log('Cloudinary configuration result:', {
        cloud_name: config.cloud_name,
        api_key: config.api_key,
        api_secret_length: config.api_secret?.length || 0,
        configured: cloudinaryConfigured
      });
    } else {
      console.error('Failed to parse CLOUDINARY_URL');
    }
  } catch (error) {
    console.error('Error configuring Cloudinary:', error);
  }
} else {
  console.error('CLOUDINARY_URL environment variable not found');
}

export async function uploadImage(imageFile) {
  try {
    const config = cloudinary.config();
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!config.cloud_name) {
      throw new Error('Cloudinary cloud_name is not configured.');
    }

    console.log('Upload attempt - Cloud:', config.cloud_name, 'Preset:', uploadPreset || 'none (will use signed)');

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
      // Use upload preset if available (unsigned), otherwise use signed upload
      const uploadOptions = {
        resource_type: 'auto',
      };

      if (uploadPreset) {
        uploadOptions.upload_preset = uploadPreset;
        uploadOptions.folder = 'vezura-products';
        console.log('Using unsigned upload with preset:', uploadPreset);
      } else {
        console.log('Using signed upload (no preset configured)');
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Upload failed:', error.message);
            reject(error);
          } else {
            console.log('Upload successful:', result.secure_url);
            resolve(result.secure_url);
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error('Error in uploadImage:', error);
    throw new Error('Image upload failed: ' + error.message);
  }
}

export async function uploadMultipleImages(imageFiles) {
  try {
    const uploadPromises = imageFiles.map(file => uploadImage(file));
    return await Promise.all(uploadPromises);
  } catch (error) {
    throw new Error('Multiple image upload failed: ' + error.message);
  }
}

export async function deleteImage(imageUrl) {
  try {
    const config = cloudinary.config();

    if (!config.cloud_name) {
      throw new Error('Cloudinary cloud_name is not configured.');
    }

    // Extract public_id from the Cloudinary URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/vtimestamp/folder/public_id.format
    const urlParts = imageUrl.split('/');

    // Find the index of 'upload' in the URL
    const uploadIndex = urlParts.indexOf('upload');

    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL format');
    }

    // Extract everything after upload/version: folder/public_id.format
    const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join('/');

    // Remove the file extension
    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');

    console.log('Deleting image from Cloudinary:', publicId);

    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: 'image' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary delete error:', error);
            reject(error);
          } else {
            console.log('Cloudinary delete successful:', result);
            resolve(result);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw new Error('Failed to delete image: ' + error.message);
  }
}

export async function deleteMultipleImages(imageUrls) {
  try {
    const deletePromises = imageUrls.map(url => deleteImage(url));
    return await Promise.all(deletePromises);
  } catch (error) {
    throw new Error('Failed to delete some images: ' + error.message);
  }
}

export default cloudinary;
