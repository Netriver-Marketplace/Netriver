# Netriver Marketplace - Deployment Checklist

## Pre-Deployment Checklist

### ✅ Account Setup
- [ ] Create Render account at https://render.com
- [ ] Create GitHub account at https://github.com
- [ ] Create Paystack account at https://paystack.co
- [ ] Enable Gmail App Password for email verification

### ✅ Get Your Keys
- [ ] Copy Paystack Public Key (`pk_test_...`)
- [ ] Copy Paystack Secret Key (`sk_test_...`)
- [ ] Generate Gmail App Password
- [ ] Note your Gmail address

### ✅ Database Setup
Choose ONE option:

**Option A: Render PostgreSQL (Recommended - Free)**
- [ ] Create PostgreSQL database on Render
- [ ] Note database credentials
- [ ] Note internal/external connection strings

**Option B: External MySQL/PostgreSQL**
- [ ] Create database on external service
- [ ] Note host, port, username, password, database name

---

## Deployment Steps

### Step 1: Prepare Your Code
```bash
# Navigate to project directory
cd /workspace

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Ready for Render deployment"
```

### Step 2: Push to GitHub
- [ ] Create new repository on GitHub
- [ ] Name it: `netriver-marketplace`
- [ ] Make it PUBLIC (required for free Render tier)
- [ ] Copy repository URL
- [ ] Add remote: `git remote add origin https://github.com/YOUR_USERNAME/netriver-marketplace.git`
- [ ] Push code: `git push -u origin main`

### Step 3: Create Database on Render (if using Render PostgreSQL)
- [ ] Go to Render Dashboard
- [ ] Click "New" → "PostgreSQL"
- [ ] Name: `netriver-db`
- [ ] Select region (Oregon recommended)
- [ ] Choose "Free" plan
- [ ] Click "Create Database"
- [ ] Wait for database to be ready (2-3 minutes)
- [ ] Copy the "Internal Database URL"

### Step 4: Deploy Web Service to Render
- [ ] Go to Render Dashboard
- [ ] Click "New" → "Web Service"
- [ ] Click "Connect GitHub" (if not connected)
- [ ] Select `netriver-marketplace` repository
- [ ] Click "Connect"
- [ ] Fill in:
  - **Name**: `netriver-marketplace`
  - **Region**: Oregon (or your database region)
  - **Branch**: `main`
  - **Runtime**: Node
  - **Build Command**: `npm install`
  - **Start Command**: `node server.js`

### Step 5: Set Environment Variables
- [ ] Click "Advanced" → "Add Environment Variable"
- [ ] Add ALL required variables:

**Required Variables:**
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3000`

**Database (Choose ONE set):**

*Using Render PostgreSQL:*
- [ ] `DATABASE_URL` = (paste from PostgreSQL dashboard)

*Using MySQL:*
- [ ] `DB_HOST` = your database host
- [ ] `DB_PORT` = `3306` (or your port)
- [ ] `DB_USER` = your database username
- [ ] `DB_PASSWORD` = your database password
- [ ] `DB_NAME` = `netriver_db`

**Payment:**
- [ ] `PAYSTACK_PUBLIC_KEY` = `pk_test_...`
- [ ] `PAYSTACK_SECRET_KEY` = `sk_test_...`

**Email:**
- [ ] `EMAIL_USER` = `your-email@gmail.com`
- [ ] `EMAIL_PASSWORD` = `your-app-password`

**Security (Auto-generated):**
- [ ] `JWT_SECRET` = (click "Generate")
- [ ] `SESSION_SECRET` = (click "Generate")

- [ ] Click "Create Web Service"

### Step 6: Wait for Deployment
- [ ] Watch deployment logs
- [ ] Wait for "Live" status (2-5 minutes)
- [ ] Copy your application URL (e.g., `https://netriver-marketplace.onrender.com`)

---

## Post-Deployment Testing

### ✅ Basic Functionality
- [ ] Open application URL in browser
- [ ] Homepage loads correctly
- [ ] Navigation menu works
- [ ] Dark/Light theme toggle works
- [ ] About page loads
- [ ] Contact page loads

### ✅ User Registration & Email Verification
- [ ] Register as new seller
- [ ] Receive verification email
- [ ] Enter verification code
- [ ] Receive welcome email
- [ ] Can login with verified account

### ✅ Dashboard & Products
- [ ] Seller dashboard loads
- [ ] Can add new product
- [ ] Can edit existing product
- [ ] Can delete product
- [ ] Product images upload correctly

### ✅ Shopping Cart & Orders
- [ ] Can add product to cart
- [ ] Cart displays correctly
- [ ] Can update quantity
- [ ] Can remove item from cart
- [ ] Checkout works

### ✅ Payment Processing
- [ ] Paystack payment page loads
- [ ] Can select payment method (Card, Bank, USSD, QR)
- [ ] Payment processes successfully
- [ ] Order created after payment
- [ ] 10% commission calculated correctly

### ✅ Admin Panel
- [ ] Can access admin panel
- [ ] Can view registered users count
- [ ] Can view user list
- [ ] Can view products
- [ ] Can view orders

---

## Viewing Registered Users

### ✅ Method 1: Admin Dashboard (Recommended)
1. Navigate to: `https://your-app.onrender.com/admin`
2. Login with admin credentials
3. View "Registered Users" count on dashboard
4. Click "Users" tab for detailed list

### ✅ Method 2: Database Query
```sql
-- For MySQL:
SELECT COUNT(*) as total_users FROM users;

-- For PostgreSQL:
SELECT COUNT(*) as total_users FROM users;
```

### ✅ Method 3: API Endpoint
```bash
curl https://your-app.onrender.com/api/admin/stats
```

---

## Going Live Checklist

### ✅ Production Settings
- [ ] Switch Paystack to live mode
- [ ] Update Paystack keys to live keys (`pk_live_`, `sk_live_`)
- [ ] Update Render environment variables with live keys
- [ ] Add your domain to Paystack allowed domains
- [ ] Test live payment with small amount

### ✅ Security
- [ ] Change default admin password
- [ ] Verify all environment variables are set
- [ ] Check HTTPS is enabled (automatic on Render)
- [ ] Test rate limiting
- [ ] Verify session management

### ✅ Performance
- [ ] Monitor page load times
- [ ] Check database query performance
- [ ] Test concurrent users
- [ ] Verify image optimization

### ✅ Monitoring
- [ ] Set up error logging
- [ ] Monitor Render logs regularly
- [ ] Set up uptime monitoring
- [ ] Configure alerts for failures

---

## Common Issues & Solutions

### Issue: Deployment Fails
**Solution:**
- Check Render logs for specific error
- Verify `package.json` has all dependencies
- Ensure `startCommand` is correct
- Check environment variables

### Issue: Database Connection Error
**Solution:**
- Verify database credentials
- Check if database is in same region
- Ensure database is running
- Test connection string

### Issue: Email Verification Not Working
**Solution:**
- Verify Gmail App Password
- Check `EMAIL_USER` and `EMAIL_PASSWORD`
- Review Render logs for email errors
- Test email service locally first

### Issue: Payment Fails
**Solution:**
- Verify Paystack keys
- Check callback URL in Paystack dashboard
- Ensure domain is in allowed domains
- Test with different payment methods

### Issue: App Sleeps (Free Tier)
**Solution:**
- This is normal on free tier
- First request after sleep takes 30-50 seconds
- Consider upgrading to paid ($7/month) for always-on
- Set up cron job to keep awake if needed

---

## Maintenance Tasks

### Weekly
- [ ] Check Render logs for errors
- [ ] Monitor user registrations
- [ ] Review payment transactions
- [ ] Check email deliverability

### Monthly
- [ ] Backup database
- [ ] Review security settings
- [ ] Update dependencies: `npm update`
- [ ] Review performance metrics

### Quarterly
- [ ] Audit user accounts
- [ ] Review Paystack settings
- [ ] Optimize database queries
- [ ] Review and update documentation

---

## Support Resources

### Documentation
- [Render Docs](https://render.com/docs)
- [Paystack Docs](https://paystack.com/docs)
- [Node.js Docs](https://nodejs.org/docs)
- [Express.js Docs](https://expressjs.com)

### Project Files
- `README.md` - Complete project documentation
- `DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
- `RENDER_DEPLOYMENT_GUIDE.md` - Render-specific guide

### Helpful Commands
```bash
# Test locally before deploying
npm run dev

# Check dependencies
npm list

# Update dependencies
npm update

# Run database schema
mysql -u user -p database < config/database_schema.sql
```

---

## Success! 🎉

Once you've completed all the above:

✅ Your Netriver marketplace is live
✅ Sellers can register and verify email
✅ Products can be added and managed
✅ Payments work via Paystack
✅ You can monitor registered users
✅ 10% commission is automatically calculated
✅ Everything is secure and responsive

**Your marketplace is ready for sellers and customers! 🚀**

---

## Quick Reference: User Count Dashboard

**URL:** `https://your-app.onrender.com/admin`

**What You'll See:**
- Total registered users (sellers)
- Total products listed
- Total orders placed
- Total revenue generated

**Users Tab Shows:**
- Business name
- Email address
- Phone number
- State (Nigerian state)
- Registration date
- Verification status
- Account status (active/banned)

---

**Need Help?**
1. Check the detailed guides in your project
2. Review Render logs
3. Consult the troubleshooting section above
4. Check official documentation

Good luck with your deployment! 🚀