# Netriver Deployment Guide

This guide will help you deploy Netriver to various hosting platforms and get your marketplace online!

## Prerequisites

- Node.js installed on your local machine
- Git installed
- MySQL database access
- Gmail account (for email verification)

## Step 1: Get Gmail App Password for Email Verification

Since Netriver includes email verification, you need to set up Gmail to send emails:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Create a new app password named "Netriver"
   - Copy this password (you'll need it for `.env`)

## Step 2: Configure Environment Variables

Create a `.env` file in your project root:

```env
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_mysql_password
DATABASE_NAME=netriver_db
SESSION_SECRET=your_secure_session_secret_minimum_32_characters_long
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password-here
EMAIL_FROM=noreply@netriver.ng
EMAIL_FROM_NAME=Netriver

PORT=3000
NODE_ENV=development
```

## Step 3: Get Paystack Test Keys

1. Sign up at [paystack.co](https://paystack.co)
2. Go to Settings → API Keys
3. Copy the **Public Test Key** and **Secret Test Key**
4. Add the secret key to your `.env` file

## Step 4: Set Up Database

### Local MySQL Setup:

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE netriver_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Exit MySQL
exit;

# Run schema
mysql -u root -p netriver_db < config/database_schema.sql
```

## Step 5: Test Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
# http://localhost:3000
```

## Step 6: Deploy to Hosting Platforms

### Option A: Deploy to Render (Recommended - Free)

**Why Render?**
- Free tier available
- Easy to set up
- Automatic deployments from GitHub
- Built-in database

**Steps:**

1. **Create Render Account:**
   - Go to [render.com](https://render.com)
   - Sign up (free account)

2. **Create GitHub Repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/netriver.git
   git push -u origin main
   ```

3. **Create PostgreSQL Database on Render:**
   - Go to Render Dashboard → New → PostgreSQL
   - Name: `netriver-db`
   - Choose free tier
   - Click "Create Database"
   - Wait for database to be ready
   - Copy the **Internal Database URL** (you'll need this)

4. **Update Code for PostgreSQL:**
   
   Update `config/database.js`:
   ```javascript
   // For PostgreSQL deployment, use this instead:
   const { Pool } = require('pg');
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
   });
   ```

5. **Create Web Service:**
   - Go to Render Dashboard → New → Web Service
   - Connect your GitHub repository
   - Configure settings:
     - Name: `netriver-marketplace`
     - Region: choose nearest to Nigeria
     - Branch: `main`
     - Runtime: `Node`
     - Build Command: `npm install`
     - Start Command: `node server.js`
   
6. **Add Environment Variables:**
   In the web service settings, add these environment variables:
   ```
   DATABASE_URL=your_render_postgresql_url
   SESSION_SECRET=your_secure_session_secret_minimum_32_characters
   PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-gmail-app-password
   EMAIL_FROM=noreply@netriver.ng
   EMAIL_FROM_NAME=Netriver
   NODE_ENV=production
   PORT=3000
   ```

7. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your app will be available at `https://netriver-marketplace.onrender.com`

8. **Run Database Schema:**
   - Access your database via Render's shell or use pgAdmin
   - Run the SQL from `config/database_schema.sql`

### Option B: Deploy to Railway

**Steps:**

1. **Create Railway Account:**
   - Go to [railway.app](https://railway.app)
   - Sign up

2. **Create Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add Database:**
   - Click "+" → Add Database
   - Select MySQL or PostgreSQL
   - Railway will provide connection URL

4. **Add Environment Variables:**
   - Go to project settings → Variables
   - Add all environment variables from your `.env` file

5. **Deploy:**
   - Railway will auto-deploy
   - Get your URL from Railway dashboard

### Option C: Deploy to Heroku

**Steps:**

1. **Install Heroku CLI:**
   ```bash
   npm install -g heroku
   ```

2. **Login:**
   ```bash
   heroku login
   ```

3. **Create App:**
   ```bash
   heroku create netriver-marketplace
   ```

4. **Add PostgreSQL:**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

5. **Set Environment Variables:**
   ```bash
   heroku config:set SESSION_SECRET=your_secure_secret
   heroku config:set PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxx
   heroku config:set EMAIL_USER=your-email@gmail.com
   heroku config:set EMAIL_PASSWORD=your-app-password
   heroku config:set EMAIL_FROM=noreply@netriver.ng
   heroku config:set EMAIL_FROM_NAME=Netriver
   heroku config:set NODE_ENV=production
   ```

6. **Deploy:**
   ```bash
   git push heroku main
   ```

7. **Run Database Schema:**
   ```bash
   heroku pg:psql < config/database_schema.sql
   ```

## Step 7: Configure Paystack for Production

After deployment, get your live keys:

1. Go to Paystack Dashboard → API Keys
2. Copy **Public Live Key** and **Secret Live Key**
3. Update environment variables on your hosting platform:
   ```
   PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx
   PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxx
   ```
4. Update frontend code to use public key (if needed)

## Step 8: Access Your Admin Dashboard

Once deployed:

1. Navigate to `https://your-domain.com/admin`
2. View total registered users
3. Monitor orders and revenue
4. Manage sellers

## Running Locally from VS Code

**Yes, it will work perfectly from VS Code!** Here's how:

1. **Open Project:**
   - Open VS Code
   - File → Open Folder → Select your Netriver project

2. **Install Dependencies:**
   - Open terminal in VS Code (Ctrl + `)
   - Run: `npm install`

3. **Configure Environment:**
   - Create `.env` file
   - Add your database credentials and API keys

4. **Start MySQL:**
   - Start your MySQL server
   - Create database: `netriver_db`

5. **Run Database Schema:**
   - In terminal: `mysql -u root -p netriver_db < config/database_schema.sql`

6. **Start Server:**
   - Run: `npm run dev` (for development with auto-reload)
   - Or: `npm start` (for production mode)

7. **Access Application:**
   - Open browser: `http://localhost:3000`
   - Admin panel: `http://localhost:3000/admin`

8. **Hot Reload:**
   - With `npm run dev`, changes auto-reload
   - Perfect for development and testing

## Viewing Registered Users

### Method 1: Admin Dashboard (Easiest)

1. Go to `/admin` in your browser
2. Look at the "Registered Users" statistic card
3. Click on the "Users" tab to see detailed list

### Method 2: Direct Database Query

```bash
# Connect to MySQL
mysql -u root -p netriver_db

# Run query
SELECT COUNT(*) as total_users FROM users;

# See all users with details
SELECT id, business_name, email, state, city, created_at, email_verified FROM users;
```

### Method 3: API Endpoint

```bash
# Get user count and stats
curl http://localhost:3000/api/admin/stats

# Get list of users
curl http://localhost:3000/api/admin/users
```

## Troubleshooting

### Email Verification Not Working

**Problem:** Emails not sending

**Solutions:**
1. Check Gmail app password is correct
2. Ensure 2-factor authentication is enabled
3. Check spam/junk folder
4. Verify EMAIL_USER and EMAIL_PASSWORD in `.env`
5. Test email service with a simple script

### Database Connection Issues

**Problem:** Can't connect to database

**Solutions:**
1. Check MySQL is running
2. Verify DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD
3. Ensure database exists
4. Check firewall settings

### Deployment Issues

**Problem:** Deployment fails

**Solutions:**
1. Check build logs for errors
2. Verify all environment variables are set
3. Ensure package.json has correct scripts
4. Check database schema is compatible

## Security Checklist

Before going live:

- [ ] Change SESSION_SECRET to a strong random string
- [ ] Use Paystack live keys (not test keys)
- [ ] Enable HTTPS (automatic on most platforms)
- [ ] Set NODE_ENV=production
- [ ] Update EMAIL_FROM with your domain
- [ ] Test email verification end-to-end
- [ ] Test payment flow with live keys
- [ ] Set up database backups
- [ ] Monitor error logs
- [ ] Set up monitoring/alerts

## Scaling Considerations

When you grow:

1. **Database:** Upgrade to managed database service
2. **CDN:** Use Cloudflare for static assets
3. **Load Balancing:** Add multiple server instances
4. **Caching:** Implement Redis for session storage
5. **Monitoring:** Set up uptime monitoring
6. **Backups:** Automated daily database backups

## Support

For deployment issues:
- Email: admin@netriver.ng
- Phone: +234 800 000 0000

## Next Steps

1. ✅ Deploy to hosting platform
2. ✅ Test all features
3. ✅ Add your first products
4. ✅ Start selling!

Your Netriver marketplace is now live and ready to connect Nigerian sellers with buyers! 🚀