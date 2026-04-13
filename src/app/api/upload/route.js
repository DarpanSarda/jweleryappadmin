import { NextResponse } from 'next/server';
import { uploadMultipleImages } from '@/lib/cloudinary';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images');

    console.log('Upload request received with files:', files.length);

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    // Filter out empty files
    const validFiles = files.filter(file => file.size > 0);
    console.log('Valid files:', validFiles.length);

    if (validFiles.length === 0) {
      return NextResponse.json({ error: 'No valid images provided' }, { status: 400 });
    }

    console.log('Starting upload of', validFiles.length, 'images...');
    const imageUrls = await uploadMultipleImages(validFiles);
    console.log('Upload completed, URLs:', imageUrls);

    return NextResponse.json({ urls: imageUrls }, { status: 200 });
  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
