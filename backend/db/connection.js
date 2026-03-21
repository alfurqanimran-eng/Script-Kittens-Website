/* ============================================
 * Database Connection Pool — MySQL2 (Hostinger)
 * ============================================ */
require('dotenv').config({ path: __dirname + '/../.env' });
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Hostinger requires SSL for remote connections
    ssl: { rejectUnauthorized: false },
    timezone: '+00:00',
});

// Quick health check
pool.getConnection()
    .then(conn => {
        console.log('✅ MySQL connected:', process.env.DB_HOST);
        conn.release();
    })
    .catch(err => {
        console.error('❌ MySQL connection failed:', err.message);
    });

module.exports = pool;
