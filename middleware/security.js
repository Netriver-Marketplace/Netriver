const bcrypt = require('bcrypt');
const db = require('../config/database');

// Input validation helper
const validateInput = (data, rules) => {
  const errors = [];
  
  for (const field in rules) {
    const value = data[field];
    const rule = rules[field];
    
    if (rule.required && (!value || value.trim() === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    
    if (value && rule.minLength && value.length < rule.minLength) {
      errors.push(`${field} must be at least ${rule.minLength} characters`);
    }
    
    if (value && rule.maxLength && value.length > rule.maxLength) {
      errors.push(`${field} must not exceed ${rule.maxLength} characters`);
    }
    
    if (value && rule.email && !validateEmail(value)) {
      errors.push(`${field} must be a valid email`);
    }
    
    if (value && rule.phone && !validatePhone(value)) {
      errors.push(`${field} must be a valid phone number`);
    }
  }
  
  return errors;
};

// Email validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (Nigeria)
const validatePhone = (phone) => {
  // Accept formats: +234XXXXXXXXXX, 0XXXXXXXXXX
  const phoneRegex = /^(\+234|0)[789]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Hash password
const hashPassword = async (password) => {
  try {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Password hashing failed');
  }
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  try {
    const match = await bcrypt.compare(password, hashedPassword);
    return match;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Log login attempt
const logLoginAttempt = async (email, ipAddress, success) => {
  try {
    await db.execute(
      'INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)',
      [email, ipAddress, success]
    );
    
    // Clean up old login attempts (older than 30 days)
    await db.execute(
      'DELETE FROM login_attempts WHERE attempt_time < DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
  } catch (error) {
    console.error('Error logging login attempt:', error);
  }
};

// Check for too many failed login attempts
const checkLoginAttempts = async (email, ipAddress) => {
  try {
    const [attempts] = await db.execute(
      `SELECT COUNT(*) as count FROM login_attempts 
       WHERE email = ? AND ip_address = ? AND success = FALSE 
       AND attempt_time > DATE_SUB(NOW(), INTERVAL 15 MINUTE)`,
      [email, ipAddress]
    );
    
    return attempts[0].count >= 5; // More than 5 failed attempts in 15 minutes
  } catch (error) {
    console.error('Error checking login attempts:', error);
    return false;
  }
};

// Validate Nigerian states
const validStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun',
  'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
];

const isValidState = (state) => {
  return validStates.includes(state);
};

// Generate secure random string
const generateSecureToken = (length = 32) => {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
};

module.exports = {
  validateInput,
  validateEmail,
  validatePhone,
  sanitizeInput,
  hashPassword,
  comparePassword,
  logLoginAttempt,
  checkLoginAttempts,
  isValidState,
  generateSecureToken,
  validStates
};