const resendEmailService = require('./resendEmailService');

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Order confirmation email to customer
exports.sendOrderConfirmation = async (customerEmail, order, customerName) => {
  try {
    if (isProduction) {
      // Use Resend in production
      await resendEmailService.sendOrderConfirmation(customerEmail, order, customerName);
    } else {
      // Use nodemailer for local development
      console.log(`📧 [DEVELOPMENT] Order confirmation would be sent to: ${customerEmail}`);
      console.log(`📧 Order: ${order.orderNumber}, Customer: ${customerName}`);
      // You can keep your existing nodemailer code here for local development
    }
  } catch (error) {
    console.error('❌ Error in sendOrderConfirmation:', error.message);
  }
};

// Order notification to supplier
exports.sendSupplierNotification = async (supplierEmail, order, supplierName) => {
  try {
    if (isProduction) {
      await resendEmailService.sendSupplierNotification(supplierEmail, order, supplierName);
    } else {
      console.log(`📧 [DEVELOPMENT] Supplier notification would be sent to: ${supplierEmail}`);
      console.log(`📧 Order: ${order.orderNumber}, Supplier: ${supplierName}`);
    }
  } catch (error) {
    console.error('❌ Error in sendSupplierNotification:', error.message);
  }
};

// Cancel order notification to supplier
exports.sendCancelNotification = async (supplierEmail, order, supplierName, cancelReason) => {
  try {
    if (isProduction) {
      await resendEmailService.sendCancelNotification(supplierEmail, order, supplierName, cancelReason);
    } else {
      console.log(`📧 [DEVELOPMENT] Cancel notification would be sent to supplier: ${supplierEmail}`);
      console.log(`📧 Order: ${order.orderNumber}, Reason: ${cancelReason}`);
    }
  } catch (error) {
    console.error('❌ Error in sendCancelNotification:', error.message);
  }
};

// Return request notification to supplier
exports.sendReturnRequestNotification = async (supplierEmail, order, supplierName, returnReason, type) => {
  try {
    if (isProduction) {
      await resendEmailService.sendReturnRequestNotification(supplierEmail, order, supplierName, returnReason, type);
    } else {
      console.log(`📧 [DEVELOPMENT] ${type} request would be sent to supplier: ${supplierEmail}`);
      console.log(`📧 Order: ${order.orderNumber}, Type: ${type}`);
    }
  } catch (error) {
    console.error('❌ Error in sendReturnRequestNotification:', error.message);
  }
};

// Return status update notification to customer
exports.sendReturnStatusUpdate = async (customerEmail, order, customerName, item, newStatus, adminNotes = '') => {
  try {
    if (isProduction) {
      await resendEmailService.sendReturnStatusUpdate(customerEmail, order, customerName, item, newStatus, adminNotes);
    } else {
      console.log(`📧 [DEVELOPMENT] Return status update would be sent to customer: ${customerEmail}`);
      console.log(`📧 Order: ${order.orderNumber}, Status: ${newStatus}`);
    }
  } catch (error) {
    console.error('❌ Error in sendReturnStatusUpdate:', error.message);
  }
};

// Order status update email
exports.sendStatusUpdate = async (customerEmail, order, customerName, trackingInfo = null) => {
  try {
    if (isProduction) {
      await resendEmailService.sendStatusUpdate(customerEmail, order, customerName, trackingInfo);
    } else {
      console.log(`📧 [DEVELOPMENT] Status update would be sent to customer: ${customerEmail}`);
      console.log(`📧 Order: ${order.orderNumber}, Status: ${order.status}`);
    }
  } catch (error) {
    console.error('❌ Error in sendStatusUpdate:', error.message);
  }
};