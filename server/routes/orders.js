const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { sendOrderConfirmation, sendSupplierNotification, sendCancelNotification, sendReturnRequestNotification } = require('../utils/emailService'); 
const { sendStatusUpdate } = require('../utils/emailService');


const router = express.Router();

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    
    console.log('Creating order with data:', {
      itemsCount: items?.length,
      shippingAddress: !!shippingAddress,
      paymentMethod
    });

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain items' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    let totalAmount = 0;
    const orderItems = [];
    const supplierSet = new Set(); // Track unique suppliers

    // Process each item and verify products
    for (let item of items) {
      const product = await Product.findById(item.product).populate('supplier');
      
      if (!product) {
        return res.status(400).json({ message: `Product ${item.product} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      // Calculate supplier earnings (40% of product price as profit for supplier)
      const supplierEarnings = (product.price * 0.4) * item.quantity;

      orderItems.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price,
        size: item.size || null,
        color: item.color || null,
        supplierEarnings: supplierEarnings
      });

      // Add supplier to set for notifications
      if (product.supplier) {
        supplierSet.add(product.supplier._id.toString());
      }
    }

    // Add tax and shipping (store breakdown for frontend)
    const subtotal = totalAmount;
    const tax = subtotal * 0.18;
    const shipping = 0; // Free shipping
    const finalTotal = subtotal + tax + shipping;

    // Create order with tax breakdown
    const order = new Order({
      customer: req.user.id,
      items: orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'card',
      subtotal: subtotal, // Store subtotal
      tax: tax, // Store tax amount
      shipping: shipping, // Store shipping
      totalAmount: finalTotal,
      orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      tracking: [
        {
          status: 'pending',
          description: 'Order has been placed and is awaiting confirmation',
          timestamp: new Date()
        }
      ]
    });

    await order.save();
    
    // Update product stock - BOTH general stock and size-specific stock
    for (let item of items) {
      const product = await Product.findById(item.product);
      
      if (product) {
        // Reduce general stock
        product.stock = Math.max(0, product.stock - item.quantity);
        
        // Reduce size-specific stock if size is provided
        if (item.size && product.sizeStock) {
          try {
            let sizeStock = {};
            
            // Parse sizeStock if it's a string
            if (typeof product.sizeStock === 'string') {
              sizeStock = JSON.parse(product.sizeStock);
            } else {
              sizeStock = { ...product.sizeStock };
            }
            
            // Reduce stock for the specific size
            if (sizeStock[item.size] !== undefined) {
              sizeStock[item.size] = Math.max(0, sizeStock[item.size] - item.quantity);
              product.sizeStock = sizeStock;
            }
            
            console.log(`Reduced size stock for ${product.name}, size ${item.size} by ${item.quantity}`);
          } catch (sizeStockError) {
            console.error('Error updating size stock:', sizeStockError);
            // Continue even if size stock update fails
          }
        }
        
        await product.save();
        console.log(`✅ Stock updated for ${product.name}: -${item.quantity}`);
      }
    }

    // Populate the order with product details before sending response
    const populatedOrder = await Order.findById(order._id)
      .populate('items.product')
      .populate('customer', 'name email');

    console.log('✅ Order created successfully:', order._id);

    // Send email notifications
    try {
      // Send confirmation to customer
      await sendOrderConfirmation(
        req.user.email, 
        populatedOrder, 
        req.user.name
      );

      // Send notifications to all suppliers involved
      for (let supplierId of supplierSet) {
        const supplier = await User.findById(supplierId);
        if (supplier && supplier.email) {
          await sendSupplierNotification(
            supplier.email,
            populatedOrder,
            supplier.name
          );
        }
      }
    } catch (emailError) {
      console.error('❌ Email notification failed:', emailError);
      // Don't fail the order if email fails
    }

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      message: 'Server error creating order',
      error: error.message 
    });
  }
});

router.put('/:orderId/cancel', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { cancelReason } = req.body;

    const order = await Order.findById(orderId)
      .populate('items.product')
      .populate('customer', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const newTrackingEntry = {
      status: newStatus,
      description: `Order has been ${newStatus}`,
      timestamp: new Date()
    };

    // order.status = 'cancelled';
    order.status = newStatus;
    order.cancelReason = cancelReason;
    order.cancelledAt = new Date();

    await order.save();

    // Send cancel notification to all suppliers
    const supplierSet = new Set();
    order.items.forEach(item => {
      if (item.product && item.product.supplier) {
        supplierSet.add(item.product.supplier.toString());
      }
    });

    for (let supplierId of supplierSet) {
      const supplier = await User.findById(supplierId);
      if (supplier && supplier.email) {
        await sendCancelNotification(
          supplier.email,
          order,
          supplier.name,
          cancelReason
        );
      }
    }

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update return request route to send notifications
router.put('/:orderId/return-request', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemId, type, reason } = req.body;

    const order = await Order.findById(orderId)
      .populate('items.product')
      .populate('customer', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update item status
    const item = order.items.id(itemId);
    if (item) {
      item.itemStatus = type === 'return' ? 'return_requested' : 'exchange_requested';
      if (type === 'return') {
        item.returnReason = reason;
      } else {
        item.exchangeReason = reason;
      }
    }

    await order.save();

    // Send return request notification to supplier
    const itemWithSupplier = order.items.find(item => item._id.toString() === itemId);
    if (itemWithSupplier && itemWithSupplier.product && itemWithSupplier.product.supplier) {
      const supplier = await User.findById(itemWithSupplier.product.supplier);
      if (supplier && supplier.email) {
        await sendReturnRequestNotification(
          supplier.email,
          order,
          supplier.name,
          reason,
          type
        );
      }
    }

    res.json({ message: `${type} request submitted successfully`, order });
  } catch (error) {
    console.error('Error processing return request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Get supplier earnings summary
router.get('/supplier/earnings', auth, async (req, res) => {
  try {
    // Get all orders that contain products from this supplier
    const earningsData = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $match: {
          'productInfo.supplier': req.user.id
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$items.supplierEarnings' },
          totalOrders: { $sum: 1 },
          pendingEarnings: {
            $sum: {
              $cond: [
                { $in: ['$status', ['pending', 'confirmed', 'packed', 'shipped']] },
                '$items.supplierEarnings',
                0
              ]
            }
          },
          availableEarnings: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'delivered'] },
                '$items.supplierEarnings',
                0
              ]
            }
          }
        }
      }
    ]);

    // Get monthly earnings
    const monthlyEarnings = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $match: {
          'productInfo.supplier': req.user.id,
          'status': 'delivered'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          earnings: { $sum: '$items.supplierEarnings' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    const result = {
      summary: earningsData[0] || {
        totalEarnings: 0,
        totalOrders: 0,
        pendingEarnings: 0,
        availableEarnings: 0
      },
      monthlyEarnings
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching supplier earnings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .populate('items.product', 'name images price')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// In the createOrder route, make sure it's working properly
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, totalAmount } = req.body;

    console.log('Creating order for user:', req.user.id);
    console.log('Order items:', items);

    // Verify stock availability
    for (let item of items) {
      const product = await Product.findById(item.product);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product?.name || 'product'}` 
        });
      }
    }

    // Update stock and create order
    for (let item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    const order = new Order({
      customer: req.user.id,
      items,
      shippingAddress,
      totalAmount,
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    await order.save();
    await order.populate('items.product', 'name images price');
    await order.populate('customer', 'name email phone');

    console.log('Order created successfully:', order.orderNumber);

    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get supplier orders
router.get('/supplier-orders', auth, async (req, res) => {
  try {
    if (req.user.role !== 'supplier') {
      return res.status(403).json({ message: 'Only suppliers can access these orders' });
    }

    // Get supplier's product IDs
    const supplierProducts = await Product.find({ supplier: req.user.id }).select('_id');
    const productIds = supplierProducts.map(p => p._id);

    const orders = await Order.find({
      'items.product': { $in: productIds }
    })
      .populate('customer', 'name email phone')
      .populate('items.product', 'name images price supplier')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Get supplier earnings summary
// Get supplier earnings summary - FIXED VERSION
router.get('/supplier/earnings-summary', auth, async (req, res) => {
  try {
    const supplierId = req.user.id;
    
    // Get all orders with this supplier's products
    const orders = await Order.find()
      .populate('items.product')
      .populate('customer', 'name')
      .exec();

    // Filter orders that contain this supplier's products
    const supplierOrders = orders.filter(order => 
      order.items.some(item => 
        item.product && item.product.supplier && 
        item.product.supplier.toString() === supplierId
      )
    );

    let totalEarnings = 0;
    let availableEarnings = 0;
    let pendingEarnings = 0;
    let totalOrders = supplierOrders.length;

    supplierOrders.forEach(order => {
      const orderEarnings = order.items
        .filter(item => 
          item.product && item.product.supplier && 
          item.product.supplier.toString() === supplierId
        )
        .reduce((sum, item) => {
          // Only count earnings for non-cancelled orders
          if (order.status !== 'cancelled') {
            // Use supplierEarnings if available, otherwise calculate
            const earnings = item.supplierEarnings || 
                           (item.product.price - (item.product.supplierCost || item.product.price * 0.6)) * item.quantity;
            return sum + earnings;
          }
          return sum; // No earnings for cancelled orders
        }, 0);

      totalEarnings += orderEarnings;

      if (order.status === 'delivered') {
        availableEarnings += orderEarnings;
      } else if (order.status !== 'cancelled') {
        pendingEarnings += orderEarnings;
      }
    });

    // Get monthly earnings for chart
    const monthlyEarnings = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $match: {
          'productInfo.supplier': req.user.id,
          'status': 'delivered'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          earnings: { 
            $sum: { 
              $ifNull: [
                '$items.supplierEarnings',
                { $multiply: ['$productInfo.price', 0.4, '$items.quantity'] }
              ]
            } 
          },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    res.json({
      summary: {
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        availableEarnings: Math.round(availableEarnings * 100) / 100,
        pendingEarnings: Math.round(pendingEarnings * 100) / 100,
        totalOrders
      },
      monthlyEarnings
    });
  } catch (error) {
    console.error('Error fetching earnings summary:', error);
    res.status(500).json({ message: 'Server error fetching earnings' });
  }
});

// Update order status
// Update order status with validation
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('items.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate status progression
    const statusFlow = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
    const currentIndex = statusFlow.indexOf(order.status);
    const newIndex = statusFlow.indexOf(status);

    // Cannot go backwards
    if (newIndex < currentIndex) {
      return res.status(400).json({ 
        message: `Cannot change status from ${order.status} to ${status}. Order progression must be sequential.` 
      });
    }

    // Must move step by step (unless it's the supplier's own order)
    if (newIndex > currentIndex + 1 && req.user.role === 'supplier') {
      const nextStatus = statusFlow[currentIndex + 1];
      return res.status(400).json({ 
        message: `Please mark the order as ${nextStatus} first before moving to ${status}.` 
      });
    }

    // Cannot change delivered orders
    if (order.status === 'delivered') {
      return res.status(400).json({ 
        message: 'This order has been delivered and cannot be modified.' 
      });
    }

    // Helper function for status descriptions
    const getStatusDescription = (status) => {
      const descriptions = {
        pending: 'Your order has been received and is being processed.',
        confirmed: 'Your order has been confirmed and is being prepared for shipment.',
        packed: 'Your order has been packed and is ready for shipping.',
        shipped: 'Your order has been shipped and is on its way to you.',
        delivered: 'Your order has been delivered successfully.',
        cancelled: 'Your order has been cancelled.'
      };
      return descriptions[status] || `Order status updated to ${status}`;
    };

    // Initialize tracking array if it doesn't exist
    if (!order.tracking) {
      order.tracking = [];
    }

    // Add to tracking - FIXED: Use proper object instead of undefined trackingEntry
    const trackingEntry = {
      status: status,
      description: getStatusDescription(status),
      timestamp: new Date()
    };
    
    order.tracking.push(trackingEntry);
    order.status = status;
    
    // If order is delivered, update delivery timestamp
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    await order.save();
    await order.populate('customer', 'name email phone');
    await order.populate('items.product', 'name images price');

    // Send status update email to customer
    try {
      if (['confirmed', 'packed', 'shipped', 'delivered'].includes(status)) {
        let trackingInfo = null;
        
        // Only add tracking info for shipped status if available
        if (status === 'shipped') {
          // You can add tracking number logic here if needed
          // For now, we'll use a placeholder or leave it null
          trackingInfo = {
            number: `TRK${order.orderNumber}${Date.now().toString().slice(-6)}`,
            carrier: 'Standard Shipping',
            estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
          };
        }

        await sendStatusUpdate(
          order.customer.email,
          order,
          order.customer.name,
          trackingInfo
        );
        
        console.log(`✅ Enhanced notification sent for order ${order.orderNumber} status: ${status}`);
      }
    } catch (emailError) {
      console.error('❌ Status update email failed:', emailError);
      // Don't fail the status update if email fails
    }

    res.json({
      success: true,
      message: `Order status updated to ${status} successfully`,
      order: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error updating order status',
      error: error.message 
    });
  }
});

// Test email route (remove in production)
// Test email route (remove in production)
router.post('/test-email', auth, async (req, res) => {
  try {
    const { sendOrderConfirmation, sendSupplierNotification } = require('../utils/emailService');
    
    // Create a mock order for testing
    const mockOrder = {
      orderNumber: 'TEST-12345',
      status: 'pending',
      totalAmount: 99.99,
      createdAt: new Date(),
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      items: [
        {
          product: { name: 'Test Product', price: 49.99 },
          quantity: 2,
          size: 'M',
          color: 'Blue'
        }
      ],
      customer: { name: 'Test Customer', email: 'test@example.com' }
    };

    // Test customer email
    await sendOrderConfirmation(req.user.email, mockOrder, req.user.name);
    
    // Test supplier email (if user is supplier)
    if (req.user.role === 'supplier') {
      await sendSupplierNotification(req.user.email, mockOrder, req.user.name);
    }

    res.json({ message: 'Test emails sent successfully!' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ message: 'Test email failed', error: error.message });
  }
});

// In your orders routes (backend)

// In your orders routes (backend)

// Update item status (for returns/exchanges)
router.put('/:orderId/items/:itemId', auth, async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const updateData = req.body;

    const order = await Order.findOneAndUpdate(
      { _id: orderId, 'items._id': itemId },
      { $set: updateData },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order or item not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel order
router.put('/:orderId/status', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, cancelReason } = req.body;

    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        status,
        cancelReason,
        cancelledAt: status === 'cancelled' ? new Date() : undefined
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// routes/orders.js - Add these routes

// Get return/exchange requests for supplier
router.get('/supplier/return-requests', auth, async (req, res) => {
  try {
    if (req.user.role !== 'supplier') {
      return res.status(403).json({ message: 'Only suppliers can access these requests' });
    }

    // Find all orders where supplier's products have return/exchange requests
    const orders = await Order.find()
      .populate('customer', 'name email')
      .populate('items.product')
      .sort({ createdAt: -1 });

    // Filter orders to find return/exchange requests for this supplier
    const returnRequests = orders.filter(order => 
      order.items.some(item => 
        item.product && 
        item.product.supplier && 
        item.product.supplier.toString() === req.user.id &&
        ['return_requested', 'exchange_requested', 'return_approved', 'exchange_approved', 'return_rejected', 'exchange_rejected'].includes(item.itemStatus)
      )
    ).map(order => {
      // Find the specific items that belong to this supplier and have return requests
      const supplierItems = order.items.filter(item => 
        item.product && 
        item.product.supplier && 
        item.product.supplier.toString() === req.user.id &&
        ['return_requested', 'exchange_requested', 'return_approved', 'exchange_approved', 'return_rejected', 'exchange_rejected'].includes(item.itemStatus)
      );

      // Return one entry per item (in case multiple items from same order)
      return supplierItems.map(item => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customer: order.customer,
        items: {
          _id: item._id,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          itemStatus: item.itemStatus,
          returnReason: item.returnReason,
          exchangeReason: item.exchangeReason,
          returnNotes: item.returnNotes,
          exchangeNotes: item.exchangeNotes,
          adminNotes: item.adminNotes,
          returnRequestDate: item.returnRequestDate,
          exchangeRequestDate: item.exchangeRequestDate,
          statusUpdateDate: item.statusUpdateDate
        },
        productInfo: {
          name: item.product?.name || 'Unknown Product',
          images: item.product?.images || [],
          price: item.product?.price || 0
        }
      }));
    }).flat(); // Flatten the array of arrays

    console.log(`Found ${returnRequests.length} return requests for supplier ${req.user.id}`);
    res.json(returnRequests);
  } catch (error) {
    console.error('Error fetching return requests:', error);
    res.status(500).json({ message: 'Server error fetching return requests' });
  }
});

// Update return/exchange status
// Update return/exchange status - WITH EMAIL NOTIFICATION
router.put('/update-item-status/:orderId/:itemId', auth, async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status, adminNotes } = req.body;

    const order = await Order.findById(orderId)
      .populate('customer', 'name email')
      .populate('items.product');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Find the specific item
    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Order item not found' });
    }

    // Update the specific item status
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId, 'items._id': itemId },
      {
        $set: {
          'items.$.itemStatus': status,
          'items.$.adminNotes': adminNotes,
          'items.$.statusUpdateDate': new Date()
        }
      },
      { new: true }
    ).populate('customer', 'name email')
     .populate('items.product');

    // Send email notification to customer
    try {
      if (order.customer && order.customer.email) {
        await sendReturnStatusUpdate(
          order.customer.email,
          order,
          order.customer.name,
          item,
          status,
          adminNotes
        );
      }
    } catch (emailError) {
      console.error('❌ Return status email failed:', emailError);
      // Don't fail the request if email fails
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating item status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to get status description
function getStatusDescription(status) {
  const descriptions = {
    pending: 'Order has been placed',
    confirmed: 'Order has been confirmed',
    packed: 'Items have been packed',
    shipped: 'Order has been shipped',
    delivered: 'Order has been delivered'
  };
  return descriptions[status] || 'Status updated';
}

module.exports = router;