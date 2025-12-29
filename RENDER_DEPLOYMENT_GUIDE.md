# Netriver Marketplace - Render Deployment Guide

## Overview
This guide will walk you through deploying your Netriver marketplace to Render, a free cloud hosting platform.

---

## Prerequisites

### 1. Create Required Accounts
- **Render Account**: [https://render.com](https://render.com) - Free account
- **GitHub Account**: [https://github.com](https://github.com) - Free account
- **Paystack Account**: [https://paystack.co](https://paystack.co) - For payments
- **Gmail Account**: With App Password enabled (for email verification)

### 2. Get Paystack Keys
1. Log in to [Paystack Dashboard](https://dashboard.paystack.co)
2. Go to **Settings → API Keys**
3. Copy your **Public Key** (starts with `pk_test_` or `pk_live_`)
4. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

---

## Step 1: Prepare Your Project for Deployment

### 1.1 Update server.js for Render
Your `server.js` is already configured for Render with the dynamic port:
```javascript
const PORT = process.env.PORT || 3000;
```

### 1.2 Create render.yaml File
Create `render.yaml` in your project root:

```yaml
services:
  - type: web
    name: netriver-marketplace
    env: node
    region: oregon
    plan: free
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: DB_HOST
        value: your-mysql-host
      - key: DB_USER
        value: your-db-user
      - key: DB_PASSWORD
        value: your-db-password
      - key: DB_NAME
        value: netriver_db
      - key: JWT_SECRET
        generateValue: true
      - key: SESSION_SECRET
        generateValue: true
      - key: PAYSTACK_PUBLIC_KEY
        value: pk_test_your_key_here
      - key: PAYSTACK_SECRET_KEY
        value: sk_test_your_key_here
      - key: EMAIL_USER
        value: your-email@gmail.com
      - key: EMAIL_PASSWORD
        value: your-app-password
```

### 1.3 Ensure .gitignore is Complete
Your `.gitignore` should include:
```
node_modules/
.env
*.log
.DS_Store
uploads/
```

---

## Step 2: Set Up Database

### Option 1: Use Render PostgreSQL (Recommended - Free)

Render offers free PostgreSQL databases:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **+ New** → **PostgreSQL**
3. Fill in:
   - **Database Name**: `netriver_db`
   - **User**: `netriver_user` (or your preferred name)
   - **Region**: Same as your web service
   - **Plan**: Free
4. Click **Create Database**

5. **Important**: After creation, Render will provide:
   - Internal Database URL
   - External Database URL
   - Database credentials

6. **Update your database configuration** for PostgreSQL:
   - You'll need to install `pg` package: `npm install pg`
   - Modify `config/database.js` to use PostgreSQL
   - Create a PostgreSQL version of your schema

### Option 2: Use Remote MySQL (Requires External Service)

1. Use a free MySQL hosting service like:
   - [PlanetScale](https://planetscale.com) - Free tier available
   - [Supabase](https://supabase.com) - Free PostgreSQL (better option)
   - [Railway](https://railway.app) - Free MySQL/PostgreSQL

2. Get your database credentials:
   - Host
   - Port
   - Username
   - Password
   - Database name

3. Add these to your Render environment variables

---

## Step 3: Push to GitHub

### 3.1 Initialize Git Repository
```bash
cd /workspace
git init
```

### 3.2 Create .gitignore (if not exists)
```bash
cat > .gitignore << 'EOF'
node_modules/
.env
*.log
.DS_Store
uploads/
EOF
```

### 3.3 Stage and Commit Files
```bash
git add .
git commit -m "Initial commit - Netriver Marketplace"
```

### 3.4 Create GitHub Repository
1. Go to [GitHub](https://github.com)
2. Click **+** → **New repository**
3. Name it: `netriver-marketplace`
4. Make it **Public** (free tier requirement)
5. Don't initialize with README
6. Click **Create repository**

### 3.5 Push to GitHub
```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/netriver-marketplace.git
git branch -M main
git push -u origin main
```

---

## Step 4: Deploy to Render

### 4.1 Connect Render to GitHub
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **+ New** → **Web Service**
3. Click **Connect GitHub** (if not connected)
4. Authorize Render to access your repositories
5. Find `netriver-marketplace` and click **Connect**

### 4.2 Configure Web Service
Fill in the following:

**Basic Settings:**
- **Name**: `netriver-marketplace`
- **Region**: Oregon (or closest to your users)
- **Branch**: `main`
- **Root Directory**: Leave empty (default)
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

**Environment Variables:**
Click **Advanced** → **Add Environment Variable**

Add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `3000` | Render port |
| `DB_HOST` | Your DB host | From your database service |
| `DB_USER` | Your DB user | From your database service |
| `DB_PASSWORD` | Your DB password | From your database service |
| `DB_NAME` | `netriver_db` | Database name |
| `JWT_SECRET` | Generate random | Click "Generate" |
| `SESSION_SECRET` | Generate random | Click "Generate" |
| `PAYSTACK_PUBLIC_KEY` | `pk_test_...` | Your Paystack public key |
| `PAYSTACK_SECRET_KEY` | `sk_test_...` | Your Paystack secret key |
| `EMAIL_USER` | `your-email@gmail.com` | Your Gmail |
| `EMAIL_PASSWORD` | `your-app-password` | Gmail App Password |

**Important**: If using Render PostgreSQL:
- Instead of separate DB_HOST, DB_USER, etc., add:
  - `DATABASE_URL`: (Get from Render PostgreSQL dashboard)

### 4.3 Deploy
1. Click **Create Web Service**
2. Wait for deployment (usually 2-5 minutes)
3. You'll see logs showing the build process

### 4.4 Verify Deployment
1. Once deployed, Render will provide a URL like: `https://netriver-marketplace.onrender.com`
2. Click the URL to visit your site
3. Test:
   - Registration page loads
   - Can register a new seller
   - Email verification works
   - Dashboard accessible
   - Products can be added

---

## Step 5: Post-Deployment Setup

### 5.1 Set Up Custom Domain (Optional)
1. In Render dashboard, click your service
2. Go to **Custom Domains**
3. Add your domain (e.g., `netriver.com`)
4. Update your domain's DNS records as instructed

### 5.2 Enable Paystack Live Mode
1. Go to [Paystack Dashboard](https://dashboard.paystack.co)
2. Navigate to your site settings
3. Add your deployed URL to allowed domains
4. Switch from Test to Live mode
5. Update your Render environment variables with live keys

### 5.3 Monitor Your App
- **Logs**: View real-time logs in Render dashboard
- **Metrics**: Monitor CPU, memory, and response times
- **Deploys**: View deployment history

---

## Viewing Registered Users

You can view registered users in THREE ways:

### Method 1: Admin Dashboard (Easiest)

1. **Access Admin Panel**
   - Navigate to: `https://your-app.onrender.com/admin`
   - Login with your admin credentials
   - You'll see a dashboard with statistics

2. **View User Count**
   - Look for the **"Registered Users"** card on the dashboard
   - This shows the total number of registered sellers
   - Updated in real-time

3. **View Detailed User List**
   - Click the **"Users"** tab in the admin panel
   - You'll see a complete list with:
     - Business names
     - Email addresses
     - Registration dates
     - Verification status
     - Account status (active/banned)

### Method 2: Database Direct Access

If you have database access:

**For MySQL:**
```sql
-- View total count
SELECT COUNT(*) as total_users FROM users;

-- View all users
SELECT 
    id,
    business_name,
    email,
    phone,
    state,
    email_verified,
    is_admin,
    created_at
FROM users 
ORDER BY created_at DESC;
```

**For PostgreSQL:**
```sql
-- View total count
SELECT COUNT(*) as total_users FROM users;

-- View all users
SELECT 
    id,
    business_name,
    email,
    phone,
    state,
    email_verified,
    is_admin,
    created_at
FROM users 
ORDER BY created_at DESC;
```

### Method 3: API Endpoints

**Get Statistics:**
```bash
curl https://your-app.onrender.com/api/admin/stats
```

Response:
```json
{
  "totalUsers": 15,
  "totalProducts": 45,
  "totalOrders": 32,
  "totalRevenue": 125000
}
```

**Get All Users:**
```bash
curl https://your-app.onrender.com/api/admin/users
```

---

## Troubleshooting

### Common Issues

**1. Deployment Fails**
- Check the logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

**2. Database Connection Error**
- Verify database credentials
- Check if database is in the same region
- Ensure database is running and accessible

**3. Email Verification Not Working**
- Verify Gmail App Password is correct
- Check that `EMAIL_USER` and `EMAIL_PASSWORD` are set
- Check Render logs for email errors

**4. Payment Issues**
- Verify Paystack keys are correct
- Ensure callback URL is set in Paystack dashboard
- Check that your domain is added to allowed domains

**5. App Goes to Sleep (Free Tier)**
- Render free tier apps spin down after 15 minutes of inactivity
- First request after waking up takes 30-50 seconds
- Consider upgrading to paid plan for always-on service

---

## Cost Summary

### Free Tier (Current)
- **Web Service**: Free
- **PostgreSQL**: Free (512MB storage)
- **Monthly Cost**: $0
- **Limitations**: Spins down after inactivity

### Paid Tier (Optional)
- **Web Service**: $7/month (always-on)
- **PostgreSQL**: $7/month (1GB storage)
- **Monthly Cost**: $14/month
- **Benefits**: Always-on, better performance, more storage

---

## Security Checklist

Before going live, ensure:

- [ ] Changed default admin password
- [ ] Using Paystack live keys (not test keys)
- [ ] Email verification is working
- [ ] All environment variables are set
- [ ] HTTPS is enabled (automatic on Render)
- [ ] Database is not publicly accessible
- [ ] Rate limiting is active
- [ ] CORS is configured correctly
- [ ] Session secrets are strong

---

## Maintenance

### Regular Tasks

**Weekly:**
- Check logs for errors
- Monitor user registrations
- Review payment transactions

**Monthly:**
- Backup database
- Review security settings
- Update dependencies

**Quarterly:**
- Review and update Paystack settings
- Audit user accounts
- Performance optimization

---

## Support

If you encounter issues:

1. **Render Documentation**: [https://render.com/docs](https://render.com/docs)
2. **Paystack Documentation**: [https://paystack.com/docs](https://paystack.com/docs)
3. **Project README**: Check `README.md` in your project
4. **Deployment Guide**: Check `DEPLOYMENT_GUIDE.md` in your project

---

## Next Steps

1. ✅ Follow this guide to deploy
2. ✅ Test all features after deployment
3. ✅ Set up monitoring
4. ✅ Promote your marketplace
5. ✅ Start onboarding sellers!

---

**Your Netriver marketplace is now ready to go live! 🚀**