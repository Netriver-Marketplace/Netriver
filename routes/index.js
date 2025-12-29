const express = require('express');
const router = express.Router();
const path = require('path');

// Serve HTML pages
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

router.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/about.html'));
});

router.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/contact.html'));
});

router.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/products.html'));
});

router.get('/product/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/product-detail.html'));
});

router.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/cart.html'));
});

router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/register.html'));
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

router.get('/verify', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/verify.html'));
});

router.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

router.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

module.exports = router;