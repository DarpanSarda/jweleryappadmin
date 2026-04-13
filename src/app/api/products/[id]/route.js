import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { uploadMultipleImages, deleteMultipleImages } from '@/lib/cloudinary';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    // In Next.js 16, params might be a Promise
    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
    }

    const product = await Product.findById(id).populate('category_id', 'name');
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectToDatabase();

    // In Next.js 16, params might be a Promise
    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
    }

    // Parse FormData
    const formData = await request.formData();

    // Extract all fields
    const product_name = formData.get('product_name');
    const original_price = parseFloat(formData.get('original_price'));
    const discounted_price = parseFloat(formData.get('discounted_price'));
    const category_id = formData.get('category_id');
    const stock = parseInt(formData.get('stock'));
    const short_description = formData.get('short_description');
    const long_description = formData.get('long_description');
    const existingImages = JSON.parse(formData.get('existingImages') || '[]');

    // Get image files
    const imageFiles = formData.getAll('images').filter(file => file.size > 0);

    // Validate category_id if provided
    if (category_id && !mongoose.Types.ObjectId.isValid(category_id)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    // Check if category exists
    if (category_id) {
      const category = await Category.findById(category_id);
      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
    }

    // Upload new images to Cloudinary
    let uploadedImageUrls = [];
    if (imageFiles.length > 0) {
      console.log('Uploading', imageFiles.length, 'images to Cloudinary...');
      uploadedImageUrls = await uploadMultipleImages(imageFiles);
      console.log('Images uploaded successfully:', uploadedImageUrls);
    }

    // Combine existing images with newly uploaded ones
    const allImages = [...existingImages, ...uploadedImageUrls];

    // Calculate discount percentage
    const discounted_percentage = original_price > 0
      ? Math.round(((original_price - discounted_price) / original_price) * 100)
      : 0;

    const updateData = {
      product_name,
      original_price,
      discounted_price,
      discounted_percentage,
      images: allImages,
      category_id,
      stock,
      short_description,
      long_description
    };

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category_id', 'name');

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();

    // In Next.js 16, params might be a Promise
    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
    }

    // First, get the product to retrieve its images
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      try {
        console.log('Deleting images from Cloudinary:', product.images);
        await deleteMultipleImages(product.images);
      } catch (error) {
        console.error('Failed to delete images from Cloudinary:', error);
        // Continue with product deletion even if image deletion fails
      }
    }

    // Then delete the product
    await Product.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
