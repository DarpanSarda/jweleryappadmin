import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  product_name: {
    type: String,
    required: true
  },
  product_image: {
    type: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    default: 0
  }
}, { _id: true });

const OrderSchema = new mongoose.Schema({
  cart_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart'
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  order_number: {
    type: String,
    unique: true,
    required: true
  },
  items: [OrderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  shipping_charge: {
    type: Number,
    default: 0,
    min: 0
  },
  grand_total: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  payment_method: {
    type: String,
    enum: ['COD', 'Card', 'UPI', 'NetBanking', 'Wallet'],
    default: 'COD'
  },
  order_status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  user_name: {
    type: String,
    required: true
  },
  user_email: {
    type: String
  },
  user_number: {
    type: String,
    required: true
  },
  user_address: {
    type: String,
    required: true
  },
  user_city: {
    type: String,
    required: true
  },
  user_state: {
    type: String
  },
  user_pincode: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
