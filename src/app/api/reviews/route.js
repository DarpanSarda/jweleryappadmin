import connectToDatabase from '@/lib/mongodb';
import Review from '@/models/Review';
import Product from '@/models/Product';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    await connectToDatabase();

    // Get query parameters for filtering, searching, sorting, pagination
    const { searchParams } = new URL(request.url);
    const approved = searchParams.get('approved');
    const productId = searchParams.get('product_id');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit')) || 10;
    const page = parseInt(searchParams.get('page')) || 1;

    // Build query
    let query = {};
    if (approved !== null && approved !== undefined && approved !== '') {
      query.is_approved = approved === 'true';
    }
    if (productId) {
      query.product_id = productId;
    }
    if (search) {
      query.$or = [
        { review_text: { $regex: search, $options: 'i' } },
        { user_name: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const reviews = await Review.find(query)
      .populate('product_id', 'product_name images')
      .sort(sortObj)
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    return NextResponse.json({
      reviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { product_id, rating, review_text, user_name, is_approved } = body;

    // Validate required fields
    if (!product_id || !rating || !review_text || !user_name) {
      return NextResponse.json(
        { error: 'product_id, rating, review_text, and user_name are required' },
        { status: 400 }
      );
    }

    // Validate product_id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Check if product exists
    const product = await Product.findById(product_id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const reviewData = {
      product_id,
      rating,
      review_text,
      user_name,
      is_approved: is_approved || false
    };

    const review = await Review.create(reviewData);
    const populatedReview = await Review.findById(review._id).populate('product_id', 'product_name images');

    return NextResponse.json(populatedReview, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
