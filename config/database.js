// const mysql = require('mysql2/promise');
//require('dotenv').config();

// Create connection pool with security configurations

//const pool = mysql.createPool({
  //host: process.env.DATABASE_HOST || 'localhost',
 // user: process.env.DATABASE_USER || 'root',
 // password: process.env.DATABASE_PASSWORD || '',
  //database: process.env.DATABASE_NAME || 'netriver_db',
  //waitForConnections: true,
  //connectionLimit: 10,
  //queueLimit: 0,
  //enableKeepAlive: true,
  //keepAliveInitialDelay: 0,
 // charset: 'utf8mb4'
//});

 const { Pool } = require('pg');
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
   });

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
  });

module.exports = pool;