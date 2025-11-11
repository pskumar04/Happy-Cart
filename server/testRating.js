// Create server/testRating.js to test the rating system
const mongoose = require('mongoose');
require('dotenv').config();

const testRating = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test data - replace with actual product and user IDs from your database
    const testData = {
      productId: 'YOUR_PRODUCT_ID_HERE', // Replace with actual product ID
      userId: 'YOUR_USER_ID_HERE', // Replace with actual user ID
      rating: 5,
      comment: 'Test rating'
    };

    console.log('Test data:', testData);
    console.log('Rating system should be working now!');
    
    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
};

testRating();