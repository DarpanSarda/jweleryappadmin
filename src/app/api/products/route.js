import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Build query
    let query = {};
    if (search) {
      query.$or = [
        { product_name: { $regex: search, $options: 'i' } },
        { short_description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get total count
    const total = await Product.countDocuments(query);

    // Get products with pagination
    const products = await Product.find(query)
      .populate('category_id', 'name')
      .sort(sortObj)
      .limit(limit)
      .skip((page - 1) * limit);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();

    // Parse JSON body
    const body = await request.json();

    const {
      product_name,
      original_price,
      discounted_price,
      category_id,
      stock,
      short_description,
      long_description,
      images
    } = body;

    // Validate required fields
    const requiredFields = { product_name, original_price, discounted_price, category_id, stock, short_description, long_description };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value && value !== 0) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    // Validate category_id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(category_id)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    // Check if category exists
    const category = await Category.findById(category_id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Validate prices
    if (original_price < 0 || discounted_price < 0) {
      return NextResponse.json({ error: 'Prices cannot be negative' }, { status: 400 });
    }

    // Calculate discount percentage
    const discounted_percentage = original_price > 0
      ? Math.round(((original_price - discounted_price) / original_price) * 100)
      : 0;

    const productData = {
      product_name,
      original_price,
      discounted_price,
      discounted_percentage,
      images: images || [],
      category_id,
      stock,
      short_description,
      long_description
    };

    const product = await Product.create(productData);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
