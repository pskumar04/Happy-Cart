require('dotenv').config();
const { sendOrderConfirmation } = require('./utils/emailService');

const testEmail = async () => {
  try {
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
      customer: { name: 'Test Customer' }
    };

    console.log('📧 Testing email configuration...');
    console.log('Email User:', process.env.EMAIL_USER);
    
    await sendOrderConfirmation(
      process.env.EMAIL_USER, // Send test to yourself
      mockOrder,
      'Test User'
    );
    
    console.log('✅ Test email sent successfully!');
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
  }
};

testEmail();