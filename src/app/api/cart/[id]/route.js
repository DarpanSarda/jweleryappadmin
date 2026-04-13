import connectToDatabase from '@/lib/mongodb';
import Cart from '@/models/Cart';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    // In Next.js 16, params might be a Promise
    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid cart ID format' }, { status: 400 });
    }

    const cart = await Cart.findById(id)
      .populate('items.product_id', 'product_name images');

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();

    // In Next.js 16, params might be a Promise
    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid cart ID format' }, { status: 400 });
    }

    const cart = await Cart.findByIdAndDelete(id);

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Cart deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting cart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
