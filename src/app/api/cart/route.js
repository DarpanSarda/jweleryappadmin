import connectToDatabase from '@/lib/mongodb';
import Cart from '@/models/Cart';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await connectToDatabase();

    // Get query parameters for filtering, searching, sorting
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'last_updated';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit')) || 10;
    const page = parseInt(searchParams.get('page')) || 1;

    // Build query
    let query = {};
    if (sessionId) {
      query.session_id = sessionId;
    }
    if (search) {
      query.$or = [
        { session_id: { $regex: search, $options: 'i' } },
        { 'items.product_name': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const carts = await Cart.find(query)
      .populate('items.product_id', 'product_name images')
      .sort(sortObj)
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Cart.countDocuments(query);

    return NextResponse.json({
      carts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching carts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
