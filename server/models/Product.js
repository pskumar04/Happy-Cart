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
  sizeStock: {
    type: Map,
    of: Number,
    default: {}
  },
  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  supplierCost: {
    type: Number,
    required: true,
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
        default: '' // Changed from required to default empty string
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

module.exports = mongoose.model('Product', productSchema);