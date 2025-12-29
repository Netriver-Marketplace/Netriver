# Viewing Registered Users - Complete Guide

## Three Ways to See Your Registered Users

### 🎯 Method 1: Admin Dashboard (Easiest & Recommended)

This is the most user-friendly way to view registered users with a beautiful interface.

**How to Access:**

1. **Open Your Admin Panel**
   - Go to: `https://your-app.onrender.com/admin`
   - Or from your site: Click "Admin" in the navigation menu

2. **Login with Admin Credentials**
   - Enter your admin email
   - Enter your admin password
   - Click "Login"

3. **View User Count on Dashboard**
   - You'll see a **"Registered Users"** card at the top
   - This shows the **total number** of registered sellers
   - The number updates in **real-time** as new users register

4. **View Detailed User List**
   - Click the **"Users"** tab in the admin panel
   - You'll see a complete table with all registered users
   - Each row shows:
     - **Business Name** - The seller's business
     - **Email** - Contact email
     - **Phone** - Contact phone number
     - **State** - Nigerian state (e.g., Lagos, Abuja)
     - **Registration Date** - When they signed up
     - **Verification Status** - ✅ Verified or ⚠️ Pending
     - **Status** - Active or Banned

5. **Search and Filter**
   - Use the search box to find specific users
   - Filter by verification status
   - Filter by account status
   - Sort by registration date

6. **User Actions**
   - Click "View" to see full user details
   - Click "Ban" to suspend a user's account
   - Click "Unban" to reactivate a user's account

**Example Dashboard View:**
```
┌─────────────────────────────────────────────┐
│           ADMIN DASHBOARD                   │
├─────────────────────────────────────────────┤
│                                             │
│  ┌────────────┐  ┌────────────┐           │
│  │ Registered │  │  Products  │           │
│  │   Users    │  │            │           │
│  │            │  │            │           │
│  │    25      │  │    147     │           │
│  └────────────┘  └────────────┘           │
│                                             │
│  ┌────────────┐  ┌────────────┐           │
│  │   Orders   │  │  Revenue   │           │
│  │            │  │            │           │
│  │   89       │  │ ₦1,250,000 │           │
│  └────────────┘  └────────────┘           │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Tabs: Dashboard | Users | Products   │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

### 📊 Method 2: Database Direct Access

If you prefer to query the database directly, you can get user counts and details.

**For MySQL Database:**

```sql
-- View total user count
SELECT COUNT(*) as total_users FROM users;

-- View all users with details
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

-- View only verified users
SELECT COUNT(*) as verified_users 
FROM users 
WHERE email_verified = TRUE;

-- View users registered today
SELECT COUNT(*) as new_users_today 
FROM users 
WHERE DATE(created_at) = CURDATE();

-- View users by state
SELECT 
    state,
    COUNT(*) as user_count
FROM users 
GROUP BY state 
ORDER BY user_count DESC;

-- View recent registrations (last 7 days)
SELECT 
    business_name,
    email,
    state,
    created_at
FROM users 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY created_at DESC;
```

**For PostgreSQL Database:**

```sql
-- View total user count
SELECT COUNT(*) as total_users FROM users;

-- View all users with details
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

-- View only verified users
SELECT COUNT(*) as verified_users 
FROM users 
WHERE email_verified = TRUE;

-- View users registered today
SELECT COUNT(*) as new_users_today 
FROM users 
WHERE DATE(created_at) = CURRENT_DATE;

-- View users by state
SELECT 
    state,
    COUNT(*) as user_count
FROM users 
GROUP BY state 
ORDER BY user_count DESC;

-- View recent registrations (last 7 days)
SELECT 
    business_name,
    email,
    state,
    created_at
FROM users 
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

**How to Access Database:**

**On Render (PostgreSQL):**
1. Go to your PostgreSQL service in Render dashboard
2. Click "Connect" → "External Connection"
3. Copy the connection string
4. Use PostgreSQL client to connect:
   ```bash
   psql "postgresql://user:password@host:5432/database"
   ```

**Local Development:**
```bash
# Connect to MySQL
mysql -u your_username -p your_database

# Connect to PostgreSQL
psql -U your_username -d your_database
```

---

### 🔌 Method 3: API Endpoints

You can programmatically access user data through API endpoints.

**Get Statistics (Quick Overview):**

```bash
curl https://your-app.onrender.com/api/admin/stats
```

**Response:**
```json
{
  "totalUsers": 25,
  "totalProducts": 147,
  "totalOrders": 89,
  "totalRevenue": 1250000
}
```

**Get All Users (Detailed List):**

```bash
curl https://your-app.onrender.com/api/admin/users
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "business_name": "TechStore Nigeria",
      "email": "techstore@example.com",
      "phone": "+2348012345678",
      "state": "Lagos",
      "email_verified": true,
      "is_admin": false,
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "business_name": "Fashion Hub",
      "email": "fashion@example.com",
      "phone": "+2348023456789",
      "state": "Abuja",
      "email_verified": true,
      "is_admin": false,
      "created_at": "2024-01-16T14:20:00.000Z"
    }
  ]
}
```

**Authentication Required:**
These API endpoints require admin authentication. Include the JWT token:

```bash
# First login to get token
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}'

# Then use the token in subsequent requests
curl https://your-app.onrender.com/api/admin/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Comparison: Which Method Should You Use?

| Method | Best For | Pros | Cons |
|--------|----------|------|------|
| **Admin Dashboard** | Daily monitoring | Visual, easy, real-time, search/filter | Requires login |
| **Database Query** | Deep analysis, exports | Full control, custom queries, bulk operations | Technical, requires DB access |
| **API Endpoints** | Integrations, automation | Programmatic access, can be automated | Requires authentication, coding knowledge |

---

## Quick Reference: User Count Dashboard

### URL
```
https://your-app.onrender.com/admin
```

### What You'll See

**Dashboard Cards:**
- 📊 **Registered Users**: Total sellers registered
- 📦 **Products**: Total products listed
- 🛒 **Orders**: Total orders placed
- 💰 **Revenue**: Total revenue (Naira)

**Users Tab Shows:**
- Business name
- Email address
- Phone number
- State (Nigerian state)
- Registration date
- Verification status
- Account status

---

## Real-World Use Cases

### Use Case 1: Daily Monitoring
**Method:** Admin Dashboard
**When:** Every day
**Purpose:** Quick check on new registrations

1. Open `/admin`
2. Look at "Registered Users" count
3. Click "Users" tab to see recent signups
4. Check verification status of new users

### Use Case 2: Weekly Report
**Method:** Database Query
**When:** End of week
**Purpose:** Generate detailed analytics report

```sql
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_users,
    SUM(CASE WHEN email_verified = TRUE THEN 1 ELSE 0 END) as verified_users
FROM users 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Use Case 3: Automated Alerts
**Method:** API Endpoints
**When:** Continuous monitoring
**Purpose:** Get notified when user count changes

```javascript
// Example: Check user count every hour
setInterval(async () => {
  const response = await fetch('https://your-app.onrender.com/api/admin/stats', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  console.log(`Current users: ${data.totalUsers}`);
  
  // Send alert if needed
  if (data.totalUsers > threshold) {
    sendAlert(`User count reached: ${data.totalUsers}`);
  }
}, 3600000); // Every hour
```

---

## Tips & Best Practices

### ✅ Best Practices
1. **Check daily** - Monitor new registrations regularly
2. **Verify emails** - Ensure users complete email verification
3. **Review suspicious activity** - Check for multiple accounts from same IP
4. **Keep database backed up** - Regular backups of user data
5. **Monitor growth trends** - Track registration patterns over time

### ⚠️ Security Tips
1. **Protect admin credentials** - Never share admin password
2. **Use strong passwords** - Minimum 12 characters, mixed case
3. **Enable 2FA** - If available, enable two-factor authentication
4. **Limit admin access** - Only give admin access to trusted team members
5. **Audit logs** - Regularly review admin activity logs

### 📈 Analytics Tips
1. **Track growth rate** - Compare week-over-week registrations
2. **Monitor verification rates** - Ensure users complete verification
3. **Analyze geographic distribution** - Which states have most sellers
4. **Identify peak times** - When do most users register
5. **Set goals** - Track progress toward user acquisition goals

---

## Troubleshooting

### Issue: Can't access admin panel
**Solution:**
- Check admin credentials
- Ensure you're using correct URL
- Verify admin account exists in database
- Check if admin account is banned

### Issue: User count not updating
**Solution:**
- Refresh the page
- Check database connection
- Verify new registrations are being saved
- Check for caching issues

### Issue: Database query fails
**Solution:**
- Verify database credentials
- Check if database is running
- Ensure you have proper permissions
- Check SQL syntax for errors

### Issue: API returns 401 Unauthorized
**Solution:**
- Verify JWT token is valid
- Check if token has expired
- Ensure you're logged in as admin
- Regenerate token if needed

---

## Summary

### Recommended Approach:
1. **Daily Use**: Admin Dashboard - Quick, visual, easy
2. **Weekly/Monthly**: Database Queries - Deep analysis, exports
3. **Integrations**: API Endpoints - Automation, custom tools

### Quick Access:
- **Dashboard**: `https://your-app.onrender.com/admin`
- **User Count**: Displayed on admin dashboard
- **User List**: Click "Users" tab in admin panel

---

**You now have complete knowledge of how to view and monitor registered users in your Netriver marketplace! 🎉**