const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAuthenticated, isSeller, getSellerInfo, validateProductOwnership } = require('../middleware/auth');
const { sanitizeInput, validateInput } = require('../middleware/security');

// Product validation rules
const productRules = {
  name: { required: true, minLength: 3, maxLength: 255 },
  description: { required: true, minLength: 10 },
  price: { required: true },
  category: { required: true },
  stock_quantity: { required: true }
};

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const category = req.query.category;
    const search = req.query.search;
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;

    let query = `
      SELECT p.*, u.business_name as seller_name, u.state as seller_state
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'active'
    `;
    const params = [];

    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      const searchPattern = `%${sanitizeInput(search)}%`;
      params.push(searchPattern, searchPattern);
    }

    if (minPrice) {
      query += ' AND p.price >= ?';
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      query += ' AND p.price <= ?';
      params.push(parseFloat(maxPrice));
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [products] = await db.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE p.status = "active"';
    const countParams = [];

    if (category) {
      countQuery += ' AND p.category = ?';
      countParams.push(category);
    }

    if (search) {
      countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      const searchPattern = `%${sanitizeInput(search)}%`;
      countParams.push(searchPattern, searchPattern);
    }

    if (minPrice) {
      countQuery += ' AND p.price >= ?';
      countParams.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      countQuery += ' AND p.price <= ?';
      countParams.push(parseFloat(maxPrice));
    }

    const [countResult] = await db.execute(countQuery, countParams);

    res.json({
      products,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Get single product (public)
router.get('/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    const [products] = await db.execute(
      `SELECT p.*, u.business_name as seller_name, u.phone as seller_phone, 
              u.business_address as seller_address, u.state as seller_state, u.city as seller_city
       FROM products p
       JOIN users u ON p.seller_id = u.id
       WHERE p.id = ? AND p.status = 'active'`,
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(products[0]);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// Create product (seller only)
router.post('/', isAuthenticated, isSeller, async (req, res) => {
  try {
    const data = req.body;

    // Validate input
    const validationErrors = validateInput(data, productRules);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(data.name),
      description: sanitizeInput(data.description),
      price: parseFloat(data.price),
      category: sanitizeInput(data.category),
      stock_quantity: parseInt(data.stock_quantity),
      image_url: data.image_url ? sanitizeInput(data.image_url) : null
    };

    // Validate price
    if (sanitizedData.price <= 0) {
      return res.status(400).json({ error: 'Price must be greater than 0' });
    }

    // Validate stock quantity
    if (sanitizedData.stock_quantity < 0) {
      return res.status(400).json({ error: 'Stock quantity cannot be negative' });
    }

    // Insert product
    const [result] = await db.execute(
      `INSERT INTO products (seller_id, name, description, price, category, stock_quantity, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.session.userId,
        sanitizedData.name,
        sanitizedData.description,
        sanitizedData.price,
        sanitizedData.category,
        sanitizedData.stock_quantity,
        sanitizedData.image_url,
        sanitizedData.stock_quantity > 0 ? 'active' : 'sold_out'
      ]
    );

    res.status(201).json({
      message: 'Product created successfully',
      productId: result.insertId
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (seller only, owner only)
router.put('/:id', isAuthenticated, isSeller, validateProductOwnership, async (req, res) => {
  try {
    const productId = req.params.id;
    const data = req.body;

    // Sanitize inputs
    const sanitizedData = {
      name: data.name ? sanitizeInput(data.name) : undefined,
      description: data.description ? sanitizeInput(data.description) : undefined,
      price: data.price ? parseFloat(data.price) : undefined,
      category: data.category ? sanitizeInput(data.category) : undefined,
      stock_quantity: data.stock_quantity !== undefined ? parseInt(data.stock_quantity) : undefined,
      image_url: data.image_url !== undefined ? (data.image_url ? sanitizeInput(data.image_url) : null) : undefined
    };

    // Validate price if provided
    if (sanitizedData.price !== undefined && sanitizedData.price <= 0) {
      return res.status(400).json({ error: 'Price must be greater than 0' });
    }

    // Validate stock quantity if provided
    if (sanitizedData.stock_quantity !== undefined && sanitizedData.stock_quantity < 0) {
      return res.status(400).json({ error: 'Stock quantity cannot be negative' });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateParams = [];

    if (sanitizedData.name !== undefined) {
      updateFields.push('name = ?');
      updateParams.push(sanitizedData.name);
    }
    if (sanitizedData.description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(sanitizedData.description);
    }
    if (sanitizedData.price !== undefined) {
      updateFields.push('price = ?');
      updateParams.push(sanitizedData.price);
    }
    if (sanitizedData.category !== undefined) {
      updateFields.push('category = ?');
      updateParams.push(sanitizedData.category);
    }
    if (sanitizedData.stock_quantity !== undefined) {
      updateFields.push('stock_quantity = ?');
      updateParams.push(sanitizedData.stock_quantity);
      
      // Update status based on stock
      if (sanitizedData.stock_quantity === 0) {
        updateFields.push('status = ?');
        updateParams.push('sold_out');
      } else if (sanitizedData.stock_quantity > 0) {
        updateFields.push('status = ?');
        updateParams.push('active');
      }
    }
    if (sanitizedData.image_url !== undefined) {
      updateFields.push('image_url = ?');
      updateParams.push(sanitizedData.image_url);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateParams.push(productId);

    await db.execute(
      `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (seller only, owner only)
router.delete('/:id', isAuthenticated, isSeller, validateProductOwnership, async (req, res) => {
  try {
    const productId = req.params.id;

    await db.execute(
      'UPDATE products SET status = "inactive" WHERE id = ?',
      [productId]
    );

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get seller's products
router.get('/seller/my-products', isAuthenticated, isSeller, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [products] = await db.execute(
      'SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.session.userId, limit, offset]
    );

    const [countResult] = await db.execute(
      'SELECT COUNT(*) as total FROM products WHERE seller_id = ?',
      [req.session.userId]
    );

    res.json({
      products,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({ error: 'Failed to get seller products' });
  }
});

// Get categories
router.get('/categories/list', async (req, res) => {
  try {
    const [categories] = await db.execute(
      'SELECT DISTINCT category FROM products WHERE status = "active" ORDER BY category'
    );

    res.json({ categories: categories.map(c => c.category) });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

module.exports = router;