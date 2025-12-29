const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify email transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Send verification email
const sendVerificationEmail = async (email, businessName, verificationCode) => {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Netriver'}" <${process.env.EMAIL_FROM || 'noreply@netriver.ng'}>`,
      to: email,
      subject: 'Verify Your Netriver Seller Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification - Netriver</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
              color: #00d4ff;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 2em;
            }
            .content {
              background-color: #f5f5f5;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .verification-code {
              background-color: #00d4ff;
              color: white;
              font-size: 2.5em;
              font-weight: bold;
              padding: 20px;
              text-align: center;
              border-radius: 5px;
              margin: 20px 0;
              letter-spacing: 5px;
            }
            .info-box {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 0.9em;
            }
            .button {
              display: inline-block;
              padding: 15px 30px;
              background-color: #00d4ff;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌊 Netriver</h1>
            <p>Your Trusted Nigerian Marketplace</p>
          </div>
          
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Dear ${businessName},</p>
            <p>Thank you for registering as a seller on Netriver! To complete your registration and start selling, please verify your email address.</p>
            
            <p>Your verification code is:</p>
            <div class="verification-code">${verificationCode}</div>
            
            <div class="info-box">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This code will expire in 30 minutes</li>
                <li>Enter this code on the verification page to activate your account</li>
                <li>Do not share this code with anyone</li>
              </ul>
            </div>
            
            <p>If you didn't create an account on Netriver, please ignore this email.</p>
            
            <p>Need help? Contact us at:</p>
            <p>
              📧 Email: admin@netriver.ng<br>
              📞 Phone: +234 800 000 0000
            </p>
          </div>
          
          <div class="footer">
            <p>© 2024 Netriver. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email after verification
const sendWelcomeEmail = async (email, businessName) => {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Netriver'}" <${process.env.EMAIL_FROM || 'noreply@netriver.ng'}>`,
      to: email,
      subject: 'Welcome to Netriver! Your Seller Account is Active',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Netriver</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
              color: #00d4ff;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 2em;
            }
            .content {
              background-color: #f5f5f5;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .success-box {
              background-color: #d4edda;
              border-left: 4px solid #28a745;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .next-steps {
              background-color: #fff;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .next-steps h3 {
              color: #00d4ff;
              margin-top: 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 0.9em;
            }
            .button {
              display: inline-block;
              padding: 15px 30px;
              background-color: #00d4ff;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌊 Netriver</h1>
            <p>Your Trusted Nigerian Marketplace</p>
          </div>
          
          <div class="content">
            <h2>🎉 Welcome to Netriver!</h2>
            
            <div class="success-box">
              <strong>Your email has been verified successfully!</strong><br>
              Your seller account for <strong>${businessName}</strong> is now active.
            </div>
            
            <p>You can now start selling your products to customers across Nigeria. Here's what you can do next:</p>
            
            <div class="next-steps">
              <h3>📋 Your Next Steps:</h3>
              <ol>
                <li><strong>Login to Your Dashboard</strong> - Access your seller dashboard to manage your business</li>
                <li><strong>Add Your First Product</strong> - List your products with photos and descriptions</li>
                <li><strong>Set Competitive Prices</strong> - Remember, we only charge 10% commission!</li>
                <li><strong>Start Selling</strong> - Reach customers across all 36 Nigerian states</li>
              </ol>
            </div>
            
            <p>With Netriver, you get:</p>
            <ul>
              <li>✅ 10% commission (you keep 90%)</li>
              <li>✅ Secure payments via Paystack</li>
              <li>✅ Nationwide delivery across Nigeria</li>
              <li>✅ Real-time sales analytics</li>
              <li>✅ 24/7 platform access</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="http://localhost:3000/dashboard" class="button">Go to Your Dashboard</a>
            </p>
            
            <p>Need help getting started? Contact our support team:</p>
            <p>
              📧 Email: admin@netriver.ng<br>
              📞 Phone: +234 800 000 0000
            </p>
          </div>
          
          <div class="footer">
            <p>© 2024 Netriver. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  transporter
};