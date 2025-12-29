const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAuthenticated, isSeller, getSellerInfo } = require('../middleware/auth');
const { sanitizeInput, validateInput, isValidState, validStates } = require('../middleware/security');

// Order validation rules
const orderRules = {
  customer_name: { required: true, minLength: 2 },
  customer_email: { required: true, email: true },
  customer_phone: { required: true, phone: true },
  customer_address: { required: true, minLength: 10 },
  customer_state: { required: true },
  customer_city: { required: true, minLength: 2 }
};

// Create order from cart
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const data = req.body;
    const sessionId = req.sessionID;

    // Validate input
    const validationErrors = validateInput(data, orderRules);
    if (validationErrors.length > 0) {
      await connection.rollback();
      return res.status(400).json({ errors: validationErrors });
    }

    // Validate state
    if (!isValidState(data.customer_state)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Invalid Nigerian state' });
    }

    // Sanitize inputs
    const sanitizedData = {
      customer_name: sanitizeInput(data.customer_name),
      customer_email: sanitizeInput(data.customer_email.toLowerCase()),
      customer_phone: sanitizeInput(data.customer_phone),
      customer_address: sanitizeInput(data.customer_address),
      customer_state: sanitizeInput(data.customer_state),
      customer_city: sanitizeInput(data.customer_city)
    };

    // Get cart items
    const [cartItems] = await connection.execute(
      `SELECT c.id as cart_id, c.quantity, p.id as product_id, p.name, p.price, 
              p.stock_quantity, p.seller_id, p.status
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.session_id = ? AND p.status = 'active'`,
      [sessionId]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Check stock availability
    for (const item of cartItems) {
      if (item.quantity > item.stock_quantity) {
        await connection.rollback();
        return res.status(400).json({ 
          error: `Insufficient stock for ${item.name}` 
        });
      }
    }

    // Calculate totals
    let totalAmount = 0;
    const orderItems = [];

    for (const item of cartItems) {
      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;
      orderItems.push({
        product_id: item.product_id,
        product_name: item.name,
        quantity: item.quantity,
        price_per_unit: item.price,
        total_price: itemTotal,
        seller_id: item.seller_id
      });
    }

    // Get commission rate (10%)
    const commissionRate = 0.10;
    const commissionAmount = totalAmount * commissionRate;
    const sellerAmount = totalAmount - commissionAmount;

    // Generate order number
    const orderNumber = 'NR' + Date.now() + Math.floor(Math.random() * 1000);

    // Insert order
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, 
                          customer_address, customer_state, customer_city, total_amount, 
                          commission_amount, seller_amount, payment_status, order_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        sanitizedData.customer_name,
        sanitizedData.customer_email,
        sanitizedData.customer_phone,
        sanitizedData.customer_address,
        sanitizedData.customer_state,
        sanitizedData.customer_city,
        totalAmount,
        commissionAmount,
        sellerAmount,
        'pending',
        'pending'
      ]
    );

    const orderId = orderResult.insertId;

    // Insert order items and update stock
    for (const item of orderItems) {
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, 
                                  price_per_unit, total_price, seller_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.product_name,
          item.quantity,
          item.price_per_unit,
          item.total_price,
          item.seller_id
        ]
      );

      // Update product stock
      await connection.execute(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart
    await connection.execute(
      'DELETE FROM cart WHERE session_id = ?',
      [sessionId]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Order created successfully',
      orderNumber,
      orderId,
      totalAmount: totalAmount.toFixed(2),
      commissionAmount: commissionAmount.toFixed(2),
      sellerAmount: sellerAmount.toFixed(2)
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    connection.release();
  }
});

// Get order by order number (public)
router.get('/order/:orderNumber', async (req, res) => {
  try {
    const orderNumber = req.params.orderNumber;

    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE order_number = ?',
      [orderNumber]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Get order items
    const [items] = await db.execute(
      `SELECT oi.*, p.image_url, u.business_name as seller_name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN users u ON oi.seller_id = u.id
       WHERE oi.order_id = ?`,
      [order.id]
    );

    order.items = items;

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// Get seller's orders
router.get('/seller/my-orders', isAuthenticated, isSeller, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = `
      SELECT DISTINCT o.*, oi.quantity, oi.product_name
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE oi.seller_id = ?
    `;
    const params = [req.session.userId];

    if (status) {
      query += ' AND o.order_status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [orders] = await db.execute(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT o.id) as total
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE oi.seller_id = ?
    `;
    const countParams = [req.session.userId];

    if (status) {
      countQuery += ' AND o.order_status = ?';
      countParams.push(status);
    }

    const [countResult] = await db.execute(countQuery, countParams);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({ error: 'Failed to get seller orders' });
  }
});

// Update order status (seller only)
router.put('/:orderId/status', isAuthenticated, isSeller, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { orderStatus } = req.body;

    if (!orderStatus) {
      return res.status(400).json({ error: 'Order status is required' });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    // Check if order belongs to seller
    const [orders] = await db.execute(
      `SELECT o.id FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = ? AND oi.seller_id = ?`,
      [orderId, req.session.userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found or access denied' });
    }

    // Update order status
    await db.execute(
      'UPDATE orders SET order_status = ? WHERE id = ?',
      [orderStatus, orderId]
    );

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Update payment status (admin only)
router.put('/:orderId/payment', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { paymentStatus, paymentReference } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({ error: 'Payment status is required' });
    }

    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    // Update payment status
    await db.execute(
      'UPDATE orders SET payment_status = ?, payment_reference = ? WHERE id = ?',
      [paymentStatus, paymentReference || null, orderId]
    );

    res.json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

module.exports = router;