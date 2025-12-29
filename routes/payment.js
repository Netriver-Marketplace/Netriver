const express = require('express');
const router = express.Router();
const db = require('../config/database');
const Paystack = require('paystack-sdk');
const { sanitizeInput, validateInput } = require('../middleware/security');

// Initialize Paystack
const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY || '');

// Initialize transaction
router.post('/initialize', async (req, res) => {
  try {
    const { orderNumber, email, amount } = req.body;

    // Validate input
    if (!orderNumber || !email || !amount) {
      return res.status(400).json({ error: 'Order number, email, and amount are required' });
    }

    // Sanitize inputs
    const sanitizedOrderNumber = sanitizeInput(orderNumber);
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    const sanitizedAmount = parseFloat(amount);

    if (sanitizedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Get order details
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE order_number = ?',
      [sanitizedOrderNumber]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Check if already paid
    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Order already paid' });
    }

    // Verify amount matches order
    if (Math.abs(sanitizedAmount - order.total_amount) > 0.01) {
      return res.status(400).json({ error: 'Amount does not match order total' });
    }

    // Initialize Paystack transaction
    const paymentData = {
      email: sanitizedEmail,
      amount: Math.round(sanitizedAmount * 100), // Convert to kobo
      metadata: {
        orderNumber: sanitizedOrderNumber,
        orderId: order.id
      },
      callback_url: `${req.protocol}://${req.get('host')}/api/payment/verify`,
      channels: ['card', 'bank_transfer', 'ussd', 'qr']
    };

    const response = await paystack.transaction.initialize(paymentData);

    if (!response.status) {
      console.error('Paystack initialization error:', response);
      return res.status(500).json({ error: 'Payment initialization failed' });
    }

    // Save reference to order
    await db.execute(
      'UPDATE orders SET payment_reference = ? WHERE id = ?',
      [response.data.reference, order.id]
    );

    res.json({
      message: 'Payment initialized successfully',
      authorizationUrl: response.data.authorization_url,
      reference: response.data.reference
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

// Verify payment
router.get('/verify', async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({ error: 'Reference is required' });
    }

    // Verify transaction with Paystack
    const response = await paystack.transaction.verify(reference);

    if (!response.status) {
      console.error('Paystack verification error:', response);
      return res.status(500).json({ error: 'Payment verification failed' });
    }

    const transaction = response.data;

    if (transaction.status !== 'success') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    // Get order from metadata
    const orderNumber = transaction.metadata.orderNumber;

    if (!orderNumber) {
      return res.status(400).json({ error: 'Invalid payment metadata' });
    }

    // Update order payment status
    await db.execute(
      `UPDATE orders SET payment_status = 'paid', payment_reference = ? 
       WHERE order_number = ?`,
      [reference, orderNumber]
    );

    // Get updated order
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE order_number = ?',
      [orderNumber]
    );

    if (orders.length > 0) {
      const order = orders[0];
      
      // Get order items
      const [items] = await db.execute(
        `SELECT oi.*, p.image_url 
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );

      order.items = items;

      return res.json({
        message: 'Payment verified successfully',
        order
      });
    }

    res.json({ message: 'Payment verified successfully' });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Payment webhook
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;

    // Verify webhook signature (recommended in production)
    // const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    //   .update(JSON.stringify(req.body))
    //   .digest('hex');

    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      const orderNumber = event.data.metadata?.orderNumber;

      if (orderNumber) {
        // Update order payment status
        await db.execute(
          `UPDATE orders SET payment_status = 'paid', payment_reference = ? 
           WHERE order_number = ? AND payment_status != 'paid'`,
          [reference, orderNumber]
        );
      }
    } else if (event.event === 'charge.failed') {
      const reference = event.data.reference;
      const orderNumber = event.data.metadata?.orderNumber;

      if (orderNumber) {
        // Update order payment status
        await db.execute(
          `UPDATE orders SET payment_status = 'failed' 
           WHERE order_number = ? AND payment_reference = ?`,
          [orderNumber, reference]
        );
      }
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get payment methods
router.get('/methods', (req, res) => {
  res.json({
    methods: [
      {
        id: 'paystack',
        name: 'Paystack',
        description: 'Secure payment via Paystack (Cards, Bank Transfer, USSD)',
        icon: 'paystack-icon',
        popular: true
      }
    ],
    supportedCurrencies: ['NGN'],
    supportedChannels: ['card', 'bank_transfer', 'ussd', 'qr']
  });
});

module.exports = router;