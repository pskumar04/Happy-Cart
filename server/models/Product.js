const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
  },
  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  supplierCost: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['men', 'women', 'children']
  },
  subcategory: {
    type: String,
    required: true
  },
  images: [{
    type: String,
    default: []
  }],
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  sizes: [{
    type: String,
    required: true
  }],
  colors: [{
    type: String,
    required: true
  }],
  // FIXED: Removed duplicate sizeStock field
  sizeStock: {
    type: Object,
    default: {}
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    },
    reviews: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        default: ''
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true
});

// Update totalStock when sizeStock changes
productSchema.pre('save', function(next) {
  if (this.sizeStock && typeof this.sizeStock === 'object') {
    this.stock = Object.values(this.sizeStock).reduce(
      (sum, stock) => sum + (parseInt(stock) || 0), 0
    );
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);