import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  product_name: {
    type: String,
    required: true,
    trim: true
  },
  original_price: {
    type: Number,
    required: true,
    min: 0
  },
  discounted_price: {
    type: Number,
    required: true,
    min: 0
  },
  discounted_percentage: {
    type: Number,
    required: true
  },
  images: [{
    type: String
  }],
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  short_description: {
    type: String,
    required: true,
    trim: true
  },
  long_description: {
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

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
