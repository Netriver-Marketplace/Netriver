const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get admin statistics (for viewing registered users and platform stats)
router.get('/stats', async (req, res) => {
  try {
    // Get total registered users (sellers)
    const [userCount] = await db.execute(
      'SELECT COUNT(*) as total FROM users'
    );

    // Get active users
    const [activeUsers] = await db.execute(
      'SELECT COUNT(*) as total FROM users WHERE is_active = TRUE'
    );

    // Get total products
    const [productCount] = await db.execute(
      'SELECT COUNT(*) as total FROM products WHERE status = "active"'
    );

    // Get total orders
    const [orderCount] = await db.execute(
      'SELECT COUNT(*) as total FROM orders'
    );

    // Get paid orders
    const [paidOrders] = await db.execute(
      'SELECT COUNT(*) as total FROM orders WHERE payment_status = "paid"'
    );

    // Get total revenue (commission earned)
    const [revenue] = await db.execute(
      'SELECT SUM(commission_amount) as total FROM orders WHERE payment_status = "paid"'
    );

    // Get recent registrations
    const [recentUsers] = await db.execute(
      'SELECT id, business_name, email, created_at FROM users ORDER BY created_at DESC LIMIT 10'
    );

    // Get recent orders
    const [recentOrders] = await db.execute(
      `SELECT o.id, o.order_number, o.customer_name, o.total_amount, 
              o.commission_amount, o.payment_status, o.order_status, o.created_at
       FROM orders o
       ORDER BY o.created_at DESC LIMIT 10`
    );

    // Get top sellers by revenue
    const [topSellers] = await db.execute(
      `SELECT u.id, u.business_name, u.email, 
              SUM(oi.total_price) as total_sales,
              COUNT(DISTINCT o.id) as total_orders
       FROM users u
       JOIN products p ON u.id = p.seller_id
       JOIN order_items oi ON p.id = oi.product_id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.payment_status = 'paid'
       GROUP BY u.id, u.business_name, u.email
       ORDER BY total_sales DESC
       LIMIT 10`
    );

    res.json({
      statistics: {
        totalUsers: userCount[0].total,
        activeUsers: activeUsers[0].total,
        totalProducts: productCount[0].total,
        totalOrders: orderCount[0].total,
        paidOrders: paidOrders[0].total,
        totalRevenue: revenue[0].total || 0,
        commissionRate: 10 // 10% commission
      },
      recentUsers,
      recentOrders,
      topSellers
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to get admin statistics' });
  }
});

// Get all registered users (with pagination)
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const status = req.query.status; // 'active', 'inactive', or 'all'
    const search = req.query.search;

    let query = 'SELECT id, business_name, email, phone, state, city, is_active, created_at, last_login FROM users';
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push('is_active = ?');
      params.push(status === 'active');
    }

    if (search) {
      conditions.push('(business_name LIKE ? OR email LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [users] = await db.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    const countParams = [];

    if (status && status !== 'all') {
      countQuery += ' WHERE is_active = ?';
      countParams.push(status === 'active');
    }

    if (search) {
      if (countParams.length > 0) {
        countQuery += ' AND ';
      } else {
        countQuery += ' WHERE ';
      }
      countQuery += '(business_name LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern);
    }

    const [countResult] = await db.execute(countQuery, countParams);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user details
router.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const [users] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get user's products
    const [products] = await db.execute(
      'SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // Get user's sales stats
    const [salesStats] = await db.execute(
      `SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        SUM(oi.total_price) as total_sales,
        SUM(o.commission_amount) as total_commission
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.seller_id = ? AND o.payment_status = 'paid'`,
      [userId]
    );

    user.products = products;
    user.salesStats = salesStats[0] || {
      total_orders: 0,
      total_sales: 0,
      total_commission: 0
    };

    res.json(user);

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

// Update user status (activate/deactivate)
router.put('/users/:id/status', async (req, res) => {
  try {
    const userId = req.params.id;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean' });
    }

    await db.execute(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active, userId]
    );

    res.json({ message: `User ${is_active ? 'activated' : 'deactivated'} successfully` });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Get all orders (with filters)
router.get('/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const paymentStatus = req.query.paymentStatus;
    const orderStatus = req.query.orderStatus;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let query = 'SELECT * FROM orders';
    const params = [];
    const conditions = [];

    if (paymentStatus) {
      conditions.push('payment_status = ?');
      params.push(paymentStatus);
    }

    if (orderStatus) {
      conditions.push('order_status = ?');
      params.push(orderStatus);
    }

    if (startDate) {
      conditions.push('created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('created_at <= ?');
      params.push(endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [orders] = await db.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders';
    const countParams = [];

    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      countParams.push(...params.slice(0, -2)); // Exclude limit and offset
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
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Get revenue analytics
router.get('/analytics/revenue', async (req, res) => {
  try {
    const period = req.query.period || '30'; // default 30 days

    const [dailyRevenue] = await db.execute(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total_amount) as total_sales,
        SUM(commission_amount) as total_commission
       FROM orders
       WHERE payment_status = 'paid'
       AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [period]
    );

    const [totalRevenue] = await db.execute(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_sales,
        SUM(commission_amount) as total_commission
       FROM orders
       WHERE payment_status = 'paid'
       AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [period]
    );

    res.json({
      dailyRevenue,
      summary: totalRevenue[0] || {
        total_orders: 0,
        total_sales: 0,
        total_commission: 0
      }
    });

  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to get revenue analytics' });
  }
});

module.exports = router;