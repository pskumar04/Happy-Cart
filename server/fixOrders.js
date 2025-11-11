const mongoose = require('mongoose');
require('dotenv').config();

const fixOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Order = require('./models/Order');
    
    // Find all orders without orderNumber
    const orders = await Order.find({ orderNumber: { $exists: false } });
    console.log(`Found ${orders.length} orders without orderNumber`);

    // Add orderNumber to each order
    for (let order of orders) {
      order.orderNumber = 'HC' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
      await order.save();
      console.log(`Updated order ${order._id} with orderNumber: ${order.orderNumber}`);
    }

    console.log('All orders fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing orders:', error);
    process.exit(1);
  }
};

fixOrders();