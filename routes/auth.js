const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { validateInput, sanitizeInput, hashPassword, comparePassword, logLoginAttempt, checkLoginAttempts, isValidState, validStates, validatePhone, validateEmail } = require('../middleware/security');

// Registration validation rules
const registrationRules = {
  business_name: { required: true, minLength: 3, maxLength: 255 },
  email: { required: true, email: true },
  password: { required: true, minLength: 8 },
  phone: { required: true, phone: true },
  business_address: { required: true, minLength: 10 },
  state: { required: true },
  city: { required: true, minLength: 2 }
};

// Register new seller
router.post('/register', async (req, res) => {
  try {
    const data = req.body;
    
    // Validate input
    const validationErrors = validateInput(data, registrationRules);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }
    
    // Validate state
    if (!isValidState(data.state)) {
      return res.status(400).json({ error: 'Invalid Nigerian state' });
    }
    
    // Sanitize inputs
    const sanitizedData = {
      business_name: sanitizeInput(data.business_name),
      email: sanitizeInput(data.email.toLowerCase()),
      phone: sanitizeInput(data.phone),
      business_address: sanitizeInput(data.business_address),
      state: sanitizeInput(data.state),
      city: sanitizeInput(data.city),
      business_description: data.business_description ? sanitizeInput(data.business_description) : null
    };
    
    // Check if business name already exists
    const [existingBusiness] = await db.execute(
      'SELECT id FROM users WHERE business_name = ?',
      [sanitizedData.business_name]
    );
    
    if (existingBusiness.length > 0) {
      return res.status(400).json({ error: 'Business name already registered' });
    }
    
    // Check if email already exists
    const [existingEmail] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [sanitizedData.email]
    );
    
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(data.password);
    
    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    // Insert new user with email verification
    const [result] = await db.execute(
      `INSERT INTO users (business_name, email, password_hash, phone, business_address, state, city, 
                         business_description, verification_code, verification_code_expires)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sanitizedData.business_name,
        sanitizedData.email,
        hashedPassword,
        sanitizedData.phone,
        sanitizedData.business_address,
        sanitizedData.state,
        sanitizedData.city,
        sanitizedData.business_description,
        verificationCode,
        verificationCodeExpires
      ]
    );
    
    // Send verification email
    const emailService = require('../config/email');
    await emailService.sendVerificationEmail(sanitizedData.email, sanitizedData.business_name, verificationCode);
    
    // Don't set session yet - user must verify email first
    res.status(201).json({
      message: 'Registration successful. Please check your email for verification code.',
      userId: result.insertId,
      email: sanitizedData.email,
      requiresVerification: true
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login seller
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    
    // Check for too many failed attempts
    const tooManyAttempts = await checkLoginAttempts(sanitizedEmail, ipAddress);
    if (tooManyAttempts) {
      return res.status(429).json({ 
        error: 'Too many failed login attempts. Please try again after 15 minutes.' 
      });
    }
    
    // Find user
    const [users] = await db.execute(
      'SELECT id, business_name, email, password_hash, is_active, email_verified FROM users WHERE email = ?',
      [sanitizedEmail]
    );
    
    if (users.length === 0) {
      await logLoginAttempt(sanitizedEmail, ipAddress, false);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = users[0];
    
    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account has been deactivated' });
    }
    
    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in. Check your email for verification code.',
        requiresVerification: true,
        email: user.email
      });
    }
    
    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    
    if (!isValidPassword) {
      await logLoginAttempt(sanitizedEmail, ipAddress, false);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Update last login
    await db.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );
    
    // Log successful login
    await logLoginAttempt(sanitizedEmail, ipAddress, true);
    
    // Set session
    req.session.userId = user.id;
    req.session.userRole = 'seller';
    req.session.businessName = user.business_name;
    
    res.json({
      message: 'Login successful',
      userId: user.id,
      businessName: user.business_name
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user info
router.get('/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const [users] = await db.execute(
      'SELECT id, business_name, email, phone, business_address, state, city, business_description, created_at FROM users WHERE id = ?',
      [req.session.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Check authentication status
router.get('/check', (req, res) => {
  const isAuthenticated = !!req.session.userId;
  res.json({
    authenticated: isAuthenticated,
    userId: req.session.userId || null,
    businessName: req.session.businessName || null
  });
});

// Get Nigerian states
router.get('/states', (req, res) => {
  res.json({ states: validStates });
});

// Verify email with code
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    // Validate input
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    const sanitizedCode = sanitizeInput(code);

    // Find user with matching email
    const [users] = await db.execute(
      'SELECT id, business_name, email, verification_code, verification_code_expires FROM users WHERE email = ?',
      [sanitizedEmail]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Check verification code
    if (user.verification_code !== sanitizedCode) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Check if code has expired
    if (new Date() > new Date(user.verification_code_expires)) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    // Mark email as verified
    await db.execute(
      `UPDATE users SET email_verified = TRUE, verification_code = NULL, verification_code_expires = NULL 
       WHERE id = ?`,
      [user.id]
    );

    // Send welcome email
    const emailService = require('../config/email');
    await emailService.sendWelcomeEmail(user.email, user.business_name);

    // Set session after verification
    req.session.userId = user.id;
    req.session.userRole = 'seller';
    req.session.businessName = user.business_name;

    res.json({
      message: 'Email verified successfully! Welcome to Netriver!',
      userId: user.id,
      businessName: user.business_name
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// Resend verification code
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const sanitizedEmail = sanitizeInput(email.toLowerCase());

    // Find user
    const [users] = await db.execute(
      'SELECT id, business_name, email, email_verified FROM users WHERE email = ?',
      [sanitizedEmail]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new verification code
    const newVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newVerificationCodeExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Update user with new verification code
    await db.execute(
      `UPDATE users SET verification_code = ?, verification_code_expires = ? 
       WHERE id = ?`,
      [newVerificationCode, newVerificationCodeExpires, user.id]
    );

    // Send new verification email
    const emailService = require('../config/email');
    await emailService.sendVerificationEmail(user.email, user.business_name, newVerificationCode);

    res.json({
      message: 'New verification code sent to your email',
      email: user.email
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

module.exports = router;