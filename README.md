# Netriver Marketplace

A secure online marketplace designed specifically for Nigeria, connecting sellers with buyers across the country.

## Features

### For Sellers
- **Business Registration**: Register with your business name, contact details, and location
- **Product Management**: Add, edit, and manage your product inventory
- **Order Processing**: View and manage customer orders
- **Sales Analytics**: Track your sales performance and earnings
- **10% Commission**: Platform takes only 10% commission on all sales
- **Secure Dashboard**: Access your business dashboard with your business name prominently displayed

### For Buyers
- **Wide Product Selection**: Browse products from verified sellers across Nigeria
- **Secure Payments**: Pay safely through Paystack (Cards, Bank Transfer, USSD, QR)
- **Shopping Cart**: Add items to cart and manage quantities
- **Order Tracking**: Track your order status from confirmation to delivery
- **Seller Information**: View seller details including location and ratings

### For Admin
- **User Management**: View and manage all registered sellers
- **Order Oversight**: Monitor all orders and payments
- **Revenue Analytics**: Track commission earnings and platform performance
- **User Statistics**: See how many users have registered on the platform

## Security Features

- **Password Hashing**: All passwords are securely hashed using bcrypt (12 rounds)
- **SQL Injection Protection**: Parameterized queries prevent SQL injection attacks
- **Brute Force Protection**: Rate limiting prevents brute force attacks on login
- **Input Validation**: All user inputs are validated and sanitized
- **Session Management**: Secure HTTP-only cookies for session handling
- **CSRF Protection**: Cross-site request forgery protection enabled
- **Helmet Security Headers**: Security headers for enhanced protection

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MySQL** database with mysql2
- **Express Session** for session management
- **Bcrypt** for password hashing
- **Paystack SDK** for payment processing

### Frontend
- **HTML5, CSS3, JavaScript** (vanilla)
- **Responsive Design** (mobile-first approach)
- **Dark & White Theme** toggle
- **Modern UI** with smooth transitions

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
```bash
git clone <repository-url>
cd netriver-marketplace
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=netriver_db
SESSION_SECRET=your_secure_session_secret_minimum_32_chars
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PORT=3000
NODE_ENV=development
```

4. **Set up the database**
```bash
# Create database and tables
mysql -u root -p < config/database_schema.sql
```

5. **Start the server**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

6. **Access the application**
- Open your browser and visit: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin`

## Project Structure

```
netriver-marketplace/
├── config/
│   ├── database.js           # Database connection
│   └── database_schema.sql   # Database schema
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── security.js          # Security utilities
├── public/
│   ├── css/
│   │   └── style.css        # Main stylesheet
│   ├── js/
│   │   ├── main.js          # Main JavaScript
│   │   └── dashboard.js     # Dashboard functionality
│   ├── about.html           # About page
│   ├── admin.html           # Admin panel
│   ├── cart.html            # Shopping cart
│   ├── contact.html         # Contact page
│   ├── dashboard.html       # Seller dashboard
│   ├── index.html           # Home page
│   ├── login.html           # Login page
│   ├── products.html        # Products listing
│   └── register.html        # Registration page
├── routes/
│   ├── admin.js             # Admin routes
│   ├── auth.js              # Authentication routes
│   ├── cart.js              # Cart routes
│   ├── index.js             # Page routes
│   ├── orders.js            # Order routes
│   ├── payment.js           # Payment routes
│   └── products.js          # Product routes
├── server.js                # Main server file
├── package.json             # Dependencies
├── .env.example             # Environment variables template
└── README.md                # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new seller
- `POST /api/auth/login` - Login seller
- `POST /api/auth/logout` - Logout seller
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/check` - Check authentication status
- `GET /api/auth/states` - Get Nigerian states

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (seller only)
- `PUT /api/products/:id` - Update product (seller only)
- `DELETE /api/products/:id` - Delete product (seller only)
- `GET /api/products/seller/my-products` - Get seller's products
- `GET /api/products/categories/list` - Get categories

### Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart
- `DELETE /api/cart` - Clear cart
- `GET /api/cart/count/items` - Get cart item count

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/order/:orderNumber` - Get order by number
- `GET /api/orders/seller/my-orders` - Get seller's orders
- `PUT /api/orders/:orderId/status` - Update order status

### Payment
- `POST /api/payment/initialize` - Initialize payment
- `GET /api/payment/verify` - Verify payment
- `POST /api/payment/webhook` - Payment webhook
- `GET /api/payment/methods` - Get payment methods

### Admin
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/analytics/revenue` - Get revenue analytics

## Deployment

### GitHub Deployment

This project is designed to work seamlessly with GitHub for version control and hosting. All features including servers, registration, and login will continue to work properly when deployed.

#### Options for Deployment:

1. **Static Hosting (GitHub Pages)**
   - Only frontend files will be hosted
   - Backend API must be hosted separately (e.g., Render, Heroku, Railway)
   - Update API URLs in JavaScript files

2. **Full Stack Deployment (Recommended)**
   - Deploy entire application to platforms like:
     - **Render**: Full Node.js deployment
     - **Heroku**: Full Node.js deployment
     - **Railway**: Full Node.js deployment
     - **DigitalOcean**: VPS deployment
   - Store code in GitHub for version control

#### Deployment Steps:

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Deploy Backend** (choose one platform):

**Render Deployment:**
- Create account at render.com
- Connect your GitHub repository
- Configure environment variables
- Deploy

**Heroku Deployment:**
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create netriver-marketplace

# Set environment variables
heroku config:set DATABASE_HOST=your-host
heroku config:set DATABASE_USER=your-user
heroku config:set DATABASE_PASSWORD=your-password
heroku config:set DATABASE_NAME=your-database
heroku config:set SESSION_SECRET=your-secret
heroku config:set PAYSTACK_SECRET_KEY=your-paystack-key

# Deploy
git push heroku main
```

3. **Configure Database**
- Set up MySQL database on your hosting platform
- Run the database schema
- Update environment variables

4. **Verify Deployment**
- Test all features
- Check registration and login
- Test payment integration
- Verify admin panel

## Database Schema

### Users Table
- `id` - Primary key
- `business_name` - Unique business name (shown on dashboard)
- `email` - Unique email address
- `password_hash` - Bcrypt hashed password
- `phone` - Phone number
- `business_address` - Full business address
- `state` - Nigerian state
- `city` - City
- `business_description` - Business description
- `created_at` - Registration timestamp
- `last_login` - Last login timestamp
- `is_active` - Account status

### Products Table
- `id` - Primary key
- `seller_id` - Foreign key to users
- `name` - Product name
- `description` - Product description
- `price` - Product price
- `category` - Product category
- `stock_quantity` - Available stock
- `image_url` - Product image URL
- `status` - Product status (active/inactive/sold_out)
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

### Orders Table
- `id` - Primary key
- `order_number` - Unique order number
- `customer_name` - Customer name
- `customer_email` - Customer email
- `customer_phone` - Customer phone
- `customer_address` - Customer address
- `customer_state` - Customer state
- `customer_city` - Customer city
- `total_amount` - Total order amount
- `commission_amount` - Platform commission (10%)
- `seller_amount` - Seller earnings (90%)
- `payment_status` - Payment status
- `order_status` - Order status
- `payment_reference` - Payment reference
- `created_at` - Order timestamp
- `updated_at` - Update timestamp

### Order Items Table
- `id` - Primary key
- `order_id` - Foreign key to orders
- `product_id` - Foreign key to products
- `product_name` - Product name
- `quantity` - Quantity ordered
- `price_per_unit` - Price per unit
- `total_price` - Total price
- `seller_id` - Foreign key to users

### Cart Table
- `id` - Primary key
- `session_id` - Session identifier
- `product_id` - Foreign key to products
- `quantity` - Quantity
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

## Nigerian States Supported

All 36 states plus Federal Capital Territory:
Abia, Adamawa, Akwa Ibom, Anambra, Bauchi, Bayelsa, Benue, Borno, Cross River, Delta, Ebonyi, Edo, Ekiti, Enugu, FCT, Gombe, Imo, Jigawa, Kaduna, Kano, Katsina, Kebbi, Kogi, Kwara, Lagos, Nasarawa, Niger, Ogun, Ondo, Osun, Oyo, Plateau, Rivers, Sokoto, Taraba, Yobe, Zamfara

## Payment Integration

Netriver uses **Paystack** for secure payment processing:

- **Cards**: Visa, Mastercard, Verve
- **Bank Transfer**: Direct bank transfer
- **USSD**: Dial USSD codes for payment
- **QR Code**: Scan QR code for payment

### Setting Up Paystack

1. Sign up at [paystack.co](https://paystack.co)
2. Get your API keys from the dashboard
3. Add `PAYSTACK_SECRET_KEY` to your `.env` file
4. Update your Paystack webhook URL in the dashboard

## Security Best Practices

1. **Always use HTTPS** in production
2. **Keep dependencies updated**
3. **Use strong session secrets** (minimum 32 characters)
4. **Regularly backup your database**
5. **Monitor login attempts** for suspicious activity
6. **Keep Paystack keys secure**
7. **Use environment variables** for sensitive data
8. **Implement rate limiting** on all public endpoints
9. **Validate and sanitize** all user inputs
10. **Use parameterized queries** to prevent SQL injection

## Troubleshooting

### Common Issues

**Database Connection Failed**
- Check MySQL is running
- Verify database credentials in `.env`
- Ensure database exists

**Session Not Working**
- Check `SESSION_SECRET` is set in `.env`
- Verify cookie settings
- Check browser cookie settings

**Payment Failed**
- Verify Paystack secret key
- Check Paystack account is active
- Ensure payment callbacks are configured

**Images Not Loading**
- Check image URLs are accessible
- Verify CORS settings if using external images
- Use placeholder images if needed

## Support

For support and issues:
- Email: admin@netriver.ng
- Phone: +234 800 000 0000

## License

This project is proprietary software. All rights reserved.

## Credits

Developed for the Nigerian market with focus on security, reliability, and user experience.