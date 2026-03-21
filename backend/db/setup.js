/* ============================================
 * Database Setup — Creates tables if they don't exist
 * Run: node db/setup.js
 * ============================================ */
const pool = require('./connection');

const SCHEMA = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    uuid        VARCHAR(36) NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    username    VARCHAR(50) NOT NULL UNIQUE,
    password    VARCHAR(255) DEFAULT NULL,        -- null for OAuth-only users
    avatar_url  VARCHAR(500) DEFAULT NULL,
    role        ENUM('user','premium','admin') DEFAULT 'user',
    provider    VARCHAR(20) DEFAULT 'email',      -- email, google, discord, github
    provider_id VARCHAR(255) DEFAULT NULL,        -- OAuth provider's user ID
    is_verified TINYINT(1) DEFAULT 0,
    last_login  DATETIME DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_provider (provider, provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table (for tracking active JWTs / refresh tokens)
CREATE TABLE IF NOT EXISTS sessions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    token_hash  VARCHAR(64) NOT NULL,             -- SHA-256 of JWT
    ip_address  VARCHAR(45) DEFAULT NULL,
    user_agent  VARCHAR(500) DEFAULT NULL,
    expires_at  DATETIME NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    token       VARCHAR(64) NOT NULL UNIQUE,
    expires_at  DATETIME NOT NULL,
    used        TINYINT(1) DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_token (token),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function setup() {
    try {
        console.log('🔧 Running database setup...');
        // Split by semicolons and run each statement
        const statements = SCHEMA.split(';').filter(s => s.trim().length > 5);
        for (const stmt of statements) {
            await pool.execute(stmt);
        }
        console.log('✅ Database tables created successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database setup failed:', err.message);
        process.exit(1);
    }
}

setup();
