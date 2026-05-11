// Upload images directly to Cloudinary from the browser
// This avoids Vercel's 4.5MB payload limit for serverless functions

export async function uploadImageToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset');
  formData.append('folder', 'vezura-products');

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Upload failed');
  }

  const data = await response.json();
  return data.secure_url;
}

export async function uploadMultipleImagesToCloudinary(files) {
  const uploadPromises = files.map(file => uploadImageToCloudinary(file));
  return await Promise.all(uploadPromises);
}
