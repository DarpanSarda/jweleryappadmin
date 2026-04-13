import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
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

const CartSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    unique: true
  },
  items: [CartItemSchema],
  subtotal: {
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
    default: 0,
    min: 0
  },
  last_updated: {
    type: Date,
    default: Date.now
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

// Calculate totals before saving
CartSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  } else {
    this.subtotal = 0;
  }
  this.grand_total = this.subtotal + this.shipping_charge;
  this.last_updated = new Date();
  next();
});

export default mongoose.models.Cart || mongoose.model('Cart', CartSchema);
