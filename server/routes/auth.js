const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
// const User = require('../models/User');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth'); // Add this import

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Customer Registration
router.post('/register/customer', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    console.log('Customer registration request:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, whatsapp, address, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser) {
      console.log('User already exists:', { email, phone });
      return res.status(400).json({ 
        message: 'User with this email or phone already exists' 
      });
    }

    const user = new User({
      name,
      email,
      phone,
      whatsapp: whatsapp || phone,
      address,
      password,
      role: 'customer'
    });

    await user.save();
    console.log('Customer registered successfully:', user.email);

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Customer registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Supplier Registration
// Supplier Registration
router.post('/register/supplier', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('logisticsName').trim().notEmpty().withMessage('Logistics company name is required')
], async (req, res) => {
  try {
    console.log('Supplier registration request received');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, whatsapp, address, logisticsName, password } = req.body;

    console.log('Checking for existing user...');
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser) {
      console.log('User already exists with email/phone:', { email, phone });
      return res.status(400).json({ 
        message: 'User with this email or phone already exists' 
      });
    }

    console.log('Creating new supplier user...');
    const user = new User({
      name,
      email,
      phone,
      whatsapp: whatsapp || phone,
      address,
      password,
      role: 'supplier',
      logisticsName
    });

    await user.save();
    console.log('Supplier registered successfully:', user.email);

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Supplier registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        logisticsName: user.logisticsName
      }
    });
  } catch (error) {
    console.error('Supplier registration error details:', error);
    
    if (error.code === 11000) {
      // MongoDB duplicate key error
      return res.status(400).json({ 
        message: 'User with this email or phone already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during registration', 
      error: error.message 
    });
  }
});
// Login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const token = generateToken(user._id);
    console.log('✅ Login successful:', email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'production' ? {} : error.message 
    });
  }
});

// Get profile (protected route)
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile (protected route)
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, alternateMobile, address, dateOfBirth, gender } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        alternateMobile,
        address,
        dateOfBirth,
        gender
      },
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;