const mongoose = require('mongoose');
require('dotenv').config();

const fixRatings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Product = require('./models/Product');
    const User = require('./models/User');

    // Update all products with empty comments in reviews
    await Product.updateMany(
      { 'ratings.reviews.comment': { $exists: false } },
      { $set: { 'ratings.reviews.$[].comment': '' } }
    );

    // Update all users with empty comments in supplier reviews
    await User.updateMany(
      { 'supplierRatings.reviews.comment': { $exists: false } },
      { $set: { 'supplierRatings.reviews.$[].comment': '' } }
    );

    console.log('Ratings fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing ratings:', error);
    process.exit(1);
  }
};

fixRatings();