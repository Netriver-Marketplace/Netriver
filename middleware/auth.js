const db = require('../config/database');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
};

// Middleware to check if user is seller
const isSeller = (req, res, next) => {
  if (req.session.userId && req.session.userRole === 'seller') {
    return next();
  }
  return res.status(403).json({ error: 'Seller access required' });
};

// Middleware to get seller info
const getSellerInfo = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const [users] = await db.execute(
      'SELECT id, business_name, email, phone, business_address, state, city, business_description FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.seller = users[0];
    next();
  } catch (error) {
    console.error('Error getting seller info:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Middleware to validate product ownership
const validateProductOwnership = async (req, res, next) => {
  try {
    const productId = req.params.id || req.body.productId;
    
    const [products] = await db.execute(
      'SELECT seller_id FROM products WHERE id = ?',
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (products[0].seller_id !== req.session.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  } catch (error) {
    console.error('Error validating product ownership:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  isAuthenticated,
  isSeller,
  getSellerInfo,
  validateProductOwnership
};