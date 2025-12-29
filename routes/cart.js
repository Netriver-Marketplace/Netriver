const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAuthenticated, isSeller } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/security');

// Get cart (public, uses session ID)
router.get('/', async (req, res) => {
  try {
    const sessionId = req.sessionID || req.query.sessionId;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session required' });
    }

    const [cartItems] = await db.execute(
      `SELECT c.id as cart_id, c.quantity, p.id as product_id, p.name, p.description, 
              p.price, p.image_url, p.stock_quantity, p.status,
              u.business_name as seller_name, u.state as seller_state
       FROM cart c
       JOIN products p ON c.product_id = p.id
       JOIN users u ON p.seller_id = u.id
       WHERE c.session_id = ? AND p.status = 'active'`,
      [sessionId]
    );

    // Calculate total
    const total = cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);

    res.json({
      items: cartItems,
      total: total.toFixed(2),
      itemCount: cartItems.length
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
});

// Add item to cart (public)
router.post('/', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const sessionId = req.sessionID;

    // Validate input
    if (!productId || !quantity) {
      return res.status(400).json({ error: 'Product ID and quantity are required' });
    }

    if (quantity < 1 || quantity > 100) {
      return res.status(400).json({ error: 'Quantity must be between 1 and 100' });
    }

    // Check if product exists and is active
    const [products] = await db.execute(
      'SELECT id, stock_quantity, status FROM products WHERE id = ?',
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];

    if (product.status !== 'active') {
      return res.status(400).json({ error: 'Product is not available' });
    }

    if (product.stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Check if item already in cart
    const [existing] = await db.execute(
      'SELECT id, quantity FROM cart WHERE session_id = ? AND product_id = ?',
      [sessionId, productId]
    );

    if (existing.length > 0) {
      const newQuantity = existing[0].quantity + quantity;

      if (newQuantity > product.stock_quantity) {
        return res.status(400).json({ error: 'Requested quantity exceeds available stock' });
      }

      await db.execute(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [newQuantity, existing[0].id]
      );

      return res.json({ message: 'Cart updated successfully' });
    }

    // Add new item to cart
    await db.execute(
      'INSERT INTO cart (session_id, product_id, quantity) VALUES (?, ?, ?)',
      [sessionId, productId, quantity]
    );

    res.status(201).json({ message: 'Item added to cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Update cart item quantity (public)
router.put('/:id', async (req, res) => {
  try {
    const cartId = req.params.id;
    const { quantity } = req.body;
    const sessionId = req.sessionID;

    if (!quantity || quantity < 1 || quantity > 100) {
      return res.status(400).json({ error: 'Quantity must be between 1 and 100' });
    }

    // Check if cart item belongs to session
    const [cartItems] = await db.execute(
      `SELECT c.id, c.quantity, p.stock_quantity 
       FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.id = ? AND c.session_id = ?`,
      [cartId, sessionId]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const cartItem = cartItems[0];

    if (quantity > cartItem.stock_quantity) {
      return res.status(400).json({ error: 'Requested quantity exceeds available stock' });
    }

    // Update quantity
    await db.execute(
      'UPDATE cart SET quantity = ? WHERE id = ?',
      [quantity, cartId]
    );

    res.json({ message: 'Cart updated successfully' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Remove item from cart (public)
router.delete('/:id', async (req, res) => {
  try {
    const cartId = req.params.id;
    const sessionId = req.sessionID;

    // Check if cart item belongs to session
    const [cartItems] = await db.execute(
      'SELECT id FROM cart WHERE id = ? AND session_id = ?',
      [cartId, sessionId]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await db.execute(
      'DELETE FROM cart WHERE id = ?',
      [cartId]
    );

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// Clear cart (public)
router.delete('/', async (req, res) => {
  try {
    const sessionId = req.sessionID;

    await db.execute(
      'DELETE FROM cart WHERE session_id = ?',
      [sessionId]
    );

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// Get cart count (public)
router.get('/count/items', async (req, res) => {
  try {
    const sessionId = req.sessionID || req.query.sessionId;

    if (!sessionId) {
      return res.json({ count: 0 });
    }

    const [result] = await db.execute(
      'SELECT SUM(quantity) as total_items FROM cart WHERE session_id = ?',
      [sessionId]
    );

    res.json({ count: result[0].total_items || 0 });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({ error: 'Failed to get cart count' });
  }
});

module.exports = router;