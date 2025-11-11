const nodemailer = require('nodemailer');

// Create transporter (using Gmail as example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS  // Your app password
  }
});

// Test email configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Cancel order notification to supplier
exports.sendCancelNotification = async (supplierEmail, order, supplierName, cancelReason) => {
  try {
    const mailOptions = {
      from: `"Happy Cart" <${process.env.EMAIL_USER}>`,
      to: supplierEmail,
      subject: `❌ Order Cancelled - ${order.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Order Cancelled</h1>
              <p>A customer has cancelled their order</p>
            </div>
            <div class="content">
              <h2>Hello ${supplierName},</h2>
              
              <div class="alert">
                <strong>Important:</strong> Order #${order.orderNumber} has been cancelled by the customer.
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Customer:</strong> ${order.customer?.name || 'N/A'}</p>
                <p><strong>Cancellation Reason:</strong> ${cancelReason || 'No reason provided'}</p>
                <p><strong>Order Total:</strong> $${order.totalAmount}</p>
                
                <h4>Cancelled Items:</h4>
                ${order.items.map(item => `
                  <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                    <div>
                      <strong>${item.product?.name || 'Product'}</strong><br>
                      <small>Quantity: ${item.quantity}</small>
                    </div>
                    <div>$${(item.product?.price * item.quantity).toFixed(2)}</div>
                  </div>
                `).join('')}
              </div>
              
              <p>Please update your inventory accordingly.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Cancel notification email sent to:', supplierEmail);
  } catch (error) {
    console.error('❌ Error sending cancel notification email:', error);
    throw error;
  }
};

// Return request notification to supplier
exports.sendReturnRequestNotification = async (supplierEmail, order, supplierName, returnReason, type) => {
  try {
    const mailOptions = {
      from: `"Happy Cart" <${process.env.EMAIL_USER}>`,
      to: supplierEmail,
      subject: `📦 ${type === 'return' ? 'Return' : 'Exchange'} Request - ${order.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .action-required { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 ${type === 'return' ? 'Return' : 'Exchange'} Request</h1>
              <p>Customer has requested a ${type === 'return' ? 'return' : 'exchange'}</p>
            </div>
            <div class="content">
              <h2>Hello ${supplierName},</h2>
              
              <div class="action-required">
                <strong>Action Required:</strong> A customer has requested a ${type} for their order. Please review and take appropriate action.
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Request Details</h3>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Customer:</strong> ${order.customer?.name || 'N/A'}</p>
                <p><strong>Request Type:</strong> ${type === 'return' ? 'Return' : 'Exchange'}</p>
                <p><strong>Reason:</strong> ${returnReason || 'No reason provided'}</p>
                
                <h4>Items:</h4>
                ${order.items.map(item => `
                  <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                    <div>
                      <strong>${item.product?.name || 'Product'}</strong><br>
                      <small>Quantity: ${item.quantity} | Size: ${item.size || 'N/A'} | Color: ${item.color || 'N/A'}</small>
                    </div>
                    <div>$${(item.product?.price * item.quantity).toFixed(2)}</div>
                  </div>
                `).join('')}
              </div>
              
              <p>Please login to your supplier dashboard to manage this request.</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="http://localhost:3000/supplier-dashboard" style="background: #f39c12; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Go to Supplier Dashboard
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Return request notification email sent to:', supplierEmail);
  } catch (error) {
    console.error('❌ Error sending return request notification email:', error);
    throw error;
  }
};

// Order confirmation email to customer
exports.sendOrderConfirmation = async (customerEmail, order, customerName) => {
  try {
    const mailOptions = {
      from: `"Happy Cart" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `🎉 Order Confirmation - ${order.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .total { font-size: 1.2em; font-weight: bold; color: #27ae60; }
            .status { display: inline-block; padding: 5px 15px; background: #3498db; color: white; border-radius: 20px; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Thank You for Your Order!</h1>
              <p>Your order has been confirmed and is being processed</p>
            </div>
            <div class="content">
              <h2>Hello ${customerName},</h2>
              <p>We're excited to let you know that we've received your order and it's being prepared for shipment.</p>
              
              <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span class="status">${order.status}</span></p>
                
                <h4>Items Ordered:</h4>
                ${order.items.map(item => `
                  <div class="item">
                    <div>
                      <strong>${item.product?.name || 'Product'}</strong><br>
                      <small>Quantity: ${item.quantity} | Size: ${item.size || 'N/A'} | Color: ${item.color || 'N/A'}</small>
                    </div>
                    <div>$${(item.product?.price * item.quantity).toFixed(2)}</div>
                  </div>
                `).join('')}
                
                <div style="text-align: right; margin-top: 20px; border-top: 2px solid #667eea; padding-top: 10px;">
                  <p class="total">Total Amount: $${order.totalAmount}</p>
                </div>
              </div>
              
              <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4>📦 Shipping Information</h4>
                <p><strong>Expected Delivery:</strong> ${order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString() : '5-7 business days'}</p>
                <p>You can track your order status anytime from your account.</p>
              </div>
              
              <p>Thank you for shopping with Happy Cart! If you have any questions, please contact our support team.</p>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 0.9em;">
                  Happy Cart Team<br>
                  <a href="mailto:support@happycart.com" style="color: #667eea;">support@happycart.com</a>
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Order confirmation email sent to:', customerEmail);
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error);
    throw error;
  }
};

// Order notification to supplier
exports.sendSupplierNotification = async (supplierEmail, order, supplierName) => {
  try {
    const mailOptions = {
      from: `"Happy Cart" <${process.env.EMAIL_USER}>`,
      to: supplierEmail,
      subject: `📦 New Order Received - ${order.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .urgent { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 New Order Alert!</h1>
              <p>You have received a new order</p>
            </div>
            <div class="content">
              <h2>Hello ${supplierName},</h2>
              <p>You have received a new order that requires your attention.</p>
              
              <div class="urgent">
                <strong>⚠️ Action Required:</strong> Please process this order within 24 hours.
              </div>
              
              <div class="order-details">
                <h3>Order Information</h3>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Customer:</strong> ${order.customer?.name || 'N/A'}</p>
                <p><strong>Customer Email:</strong> ${order.customer?.email || 'N/A'}</p>
                
                <h4>Products to Ship:</h4>
                ${order.items.map(item => `
                  <div class="item">
                    <div>
                      <strong>${item.product?.name || 'Product'}</strong><br>
                      <small>Quantity: ${item.quantity} | Price: $${item.product?.price || 0}</small>
                    </div>
                    <div>$${(item.product?.price * item.quantity).toFixed(2)}</div>
                  </div>
                `).join('')}
                
                <div style="text-align: right; margin-top: 20px; border-top: 2px solid #f5576c; padding-top: 10px;">
                  <p><strong>Order Total: $${order.totalAmount}</strong></p>
                </div>
              </div>
              
              <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4>🚀 Next Steps</h4>
                <ol>
                  <li>Prepare the items for shipment</li>
                  <li>Update order status in your supplier dashboard</li>
                  <li>Ship the order within 2 business days</li>
                  <li>Update tracking information</li>
                </ol>
              </div>
              
              <p>Please login to your supplier dashboard to manage this order.</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="http://localhost:3000/supplier-dashboard" style="background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Go to Supplier Dashboard
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Supplier notification email sent to:', supplierEmail);
  } catch (error) {
    console.error('❌ Error sending supplier notification email:', error);
    throw error;
  }
};

// Return status update notification to customer
exports.sendReturnStatusUpdate = async (customerEmail, order, customerName, item, newStatus, adminNotes = '') => {
  try {
    const statusMessages = {
      return_approved: 'Your return request has been approved',
      return_rejected: 'Your return request has been rejected',
      exchange_approved: 'Your exchange request has been approved',
      exchange_rejected: 'Your exchange request has been rejected',
      refund_processed: 'Your refund has been processed',
      completed: 'Your return/exchange has been completed'
    };

    const mailOptions = {
      from: `"Happy Cart" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `📦 Return Request Update - ${order.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .status-update { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Return Request Update</h1>
              <p>Your return/exchange request status has been updated</p>
            </div>
            <div class="content">
              <h2>Hello ${customerName},</h2>
              
              <div class="status-update">
                <h3 style="color: #667eea; margin-bottom: 10px;">
                  ${statusMessages[newStatus] || 'Your return request status has been updated'}
                </h3>
                <div style="font-size: 3em; margin: 20px 0;">
                  ${newStatus.includes('approved') ? '✅' : newStatus.includes('rejected') ? '❌' : '📦'}
                </div>
                <p style="font-size: 1.1em;">
                  <strong>Order:</strong> #${order.orderNumber}<br>
                  <strong>Product:</strong> ${item.product?.name || 'Product'}<br>
                  <strong>New Status:</strong> ${newStatus.replace('_', ' ')}
                </p>
                ${adminNotes ? `
                  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <h4>Supplier Notes:</h4>
                    <p>${adminNotes}</p>
                  </div>
                ` : ''}
              </div>
              
              <p>You can view your order details anytime from your account.</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="http://localhost:3000/my-orders" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  View My Orders
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Return status update email sent to:', customerEmail);
  } catch (error) {
    console.error('❌ Error sending return status update email:', error);
    throw error;
  }
};

// Order status update email
// Enhanced status update email with more details
exports.sendStatusUpdate = async (customerEmail, order, customerName, trackingInfo = null) => {
  try {
    const statusMessages = {
      confirmed: {
        subject: '✅ Order Confirmed - Ready for Processing',
        message: 'has been confirmed and is being processed',
        icon: '✅'
      },
      packed: {
        subject: '📦 Order Packed - Ready for Shipment', 
        message: 'has been packed and is ready for shipment',
        icon: '📦'
      },
      shipped: {
        subject: '🚚 Order Shipped - On Its Way!',
        message: 'has been shipped and is on its way to you',
        icon: '🚚'
      },
      delivered: {
        subject: '🎉 Order Delivered - Enjoy Your Purchase!',
        message: 'has been delivered successfully',
        icon: '🎉'
      }
    };

    const statusData = statusMessages[order.status] || {
      subject: `Order ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`,
      message: 'status has been updated',
      icon: '📦'
    };

    const mailOptions = {
      from: `"Happy Cart" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `${statusData.icon} ${statusData.subject} - ${order.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .status-card { background: white; padding: 25px; border-radius: 10px; margin: 20px 0; text-align: center; border-left: 4px solid #667eea; }
            .tracking-info { background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .next-steps { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${statusData.icon} Order Update</h1>
              <p>Your order status has been updated</p>
            </div>
            <div class="content">
              <h2>Hello ${customerName},</h2>
              
              <div class="status-card">
                <div style="font-size: 3em; margin-bottom: 15px;">${statusData.icon}</div>
                <h3 style="color: #667eea; margin-bottom: 10px;">
                  Order #${order.orderNumber} ${statusData.message}
                </h3>
                <p style="font-size: 1.1em; font-weight: bold;">
                  Current Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </p>
                ${order.status === 'shipped' && trackingInfo ? `
                  <div class="tracking-info">
                    <h4>🚚 Tracking Information</h4>
                    <p><strong>Tracking Number:</strong> ${trackingInfo.number}</p>
                    <p><strong>Carrier:</strong> ${trackingInfo.carrier}</p>
                    <p><strong>Estimated Delivery:</strong> ${trackingInfo.estimatedDelivery}</p>
                  </div>
                ` : ''}
              </div>
              
              <div class="order-details">
                <h4>Order Summary</h4>
                ${order.items.map(item => `
                  <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                    <div>
                      <strong>${item.product?.name || 'Product'}</strong><br>
                      <small>Quantity: ${item.quantity} | $${item.product?.price || item.price} each</small>
                    </div>
                    <div>$${(item.quantity * (item.product?.price || item.price)).toFixed(2)}</div>
                  </div>
                `).join('')}
                <div style="text-align: right; margin-top: 15px; border-top: 2px solid #667eea; padding-top: 10px;">
                  <p style="font-size: 1.2em; font-weight: bold; color: #27ae60;">
                    Total Amount: $${order.totalAmount}
                  </p>
                </div>
              </div>

              ${order.status === 'delivered' ? `
                <div class="next-steps">
                  <h4>📝 Next Steps</h4>
                  <p>We hope you love your purchase! You can:</p>
                  <ul>
                    <li>Rate the products you received</li>
                    <li>Rate the supplier service</li>
                    <li>Request return/exchange if needed</li>
                    <li>Contact support for any issues</li>
                  </ul>
                </div>
              ` : ''}
              
              <p>You can track your order progress anytime from your account dashboard.</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="http://localhost:3000/my-orders" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  View My Orders
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Status update email sent to:', customerEmail);
  } catch (error) {
    console.error('❌ Error sending status update email:', error);
    throw error;
  }
};