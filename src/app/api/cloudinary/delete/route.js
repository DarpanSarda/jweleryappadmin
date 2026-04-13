import { NextResponse } from 'next/server';
import { deleteImage, deleteMultipleImages } from '@/lib/cloudinary';

export async function POST(request) {
  try {
    const { imageUrls } = await request.json();

    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json({ error: 'No image URLs provided' }, { status: 400 });
    }

    console.log('Deleting images from Cloudinary:', imageUrls);

    const results = await deleteMultipleImages(imageUrls);

    return NextResponse.json({ success: true, results }, { status: 200 });
  } catch (error) {
    console.error('Error deleting images:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
