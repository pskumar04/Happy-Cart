const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const uploadProductImages = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Get all products with filtering
router.get('/', async (req, res) => {
  try {
    const { category, bestseller, search, page = 1, limit = 12 } = req.query;
    
    let filter = {};
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (bestseller === 'true') {
      filter.isBestSeller = true;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .populate('supplier', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('supplier', 'name email phone address logisticsName');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new product with image upload (Supplier only)
router.post('/', auth, uploadProductImages, async (req, res) => {
  try {
    console.log('Product creation request body:', req.body);
    console.log('Uploaded files:', req.files);

    if (req.user.role !== 'supplier') {
      return res.status(403).json({ message: 'Only suppliers can add products' });
    }

    // Parse JSON fields
    const {
      name,
      description,
      price,
      originalPrice,
      category,
      subcategory,
      stock,
      isBestSeller,
      sizes,
      colors,
      sizeStock
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !originalPrice || !category || !subcategory) {
      // Clean up uploaded files if validation fails
      if (req.files) {
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
      return res.status(400).json({ 
        message: 'All fields are required: name, description, price, originalPrice, category, subcategory' 
      });
    }

    // Parse sizes, colors, and sizeStock from JSON strings
    let parsedSizes = ['S', 'M', 'L', 'XL'];
    let parsedColors = ['Black', 'White', 'Blue'];
    let parsedSizeStock = { 'S': 0, 'M': 0, 'L': 0, 'XL': 0 };

    try {
      if (sizes) {
        parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
      }
      if (colors) {
        parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
      }
      if (sizeStock) {
        parsedSizeStock = typeof sizeStock === 'string' ? JSON.parse(sizeStock) : sizeStock;
      }
    } catch (parseError) {
      console.error('Error parsing JSON fields:', parseError);
      // Clean up uploaded files
      if (req.files) {
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
      return res.status(400).json({ 
        message: 'Invalid data format for sizes, colors, or sizeStock' 
      });
    }

    // Calculate total stock from sizeStock
    const totalStock = Object.values(parsedSizeStock).reduce((sum, stock) => sum + parseInt(stock || 0), 0);

    // Get image paths
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      originalPrice: parseFloat(originalPrice),
      category,
      subcategory,
      stock: totalStock,
      sizes: parsedSizes,
      colors: parsedColors,
      sizeStock: parsedSizeStock,
      isBestSeller: isBestSeller === 'true',
      images: images,
      supplier: req.user.id
    });

    await product.save();
    console.log('✅ Product created successfully:', product.name);
    
    res.status(201).json(product);
  } catch (error) {
    // Clean up uploaded files if error occurs
    if (req.files) {
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
    }
    console.error('❌ Product creation error:', error);
    res.status(500).json({ 
      message: 'Error creating product', 
      error: error.message
    });
  }
});

// Update product (Supplier only)
router.put('/:id', auth, uploadProductImages, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.supplier.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Parse JSON fields
    const {
      name,
      description,
      price,
      originalPrice,
      category,
      subcategory,
      stock,
      isBestSeller,
      sizes,
      colors,
      sizeStock
    } = req.body;

    // Parse sizes, colors, and sizeStock from JSON strings
    let parsedSizes = product.sizes;
    let parsedColors = product.colors;
    let parsedSizeStock = product.sizeStock;

    try {
      if (sizes) {
        parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
      }
      if (colors) {
        parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
      }
      if (sizeStock) {
        parsedSizeStock = typeof sizeStock === 'string' ? JSON.parse(sizeStock) : sizeStock;
      }
    } catch (parseError) {
      console.error('Error parsing JSON fields:', parseError);
      return res.status(400).json({ 
        message: 'Invalid data format for sizes, colors, or sizeStock' 
      });
    }

    // Calculate total stock from sizeStock
    const totalStock = Object.values(parsedSizeStock).reduce((sum, stock) => sum + parseInt(stock || 0), 0);

    const updateData = {
      name,
      description,
      price: parseFloat(price),
      originalPrice: parseFloat(originalPrice),
      category,
      subcategory,
      stock: totalStock,
      sizes: parsedSizes,
      colors: parsedColors,
      sizeStock: parsedSizeStock,
      isBestSeller: isBestSeller === 'true'
    };

    // Add new images if any
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      updateData.$push = { images: { $each: newImages } };
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('supplier', 'name email phone address logisticsName');

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      message: 'Error updating product', 
      error: error.message 
    });
  }
});

// Delete product (Supplier only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.supplier.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    // Delete associated images
    if (product.images && product.images.length > 0) {
      product.images.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;