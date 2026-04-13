import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Review from '@/models/Review';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectToDatabase();

    // Get counts for all entities
    const [productsCount, categoriesCount, reviewsCount, ordersCount, cartsCount] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Review.countDocuments(),
      Order.countDocuments(),
      Cart.countDocuments()
    ]);

    const stats = {
      productsCount,
      categoriesCount,
      reviewsCount,
      ordersCount,
      cartItemsCount: cartsCount
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
