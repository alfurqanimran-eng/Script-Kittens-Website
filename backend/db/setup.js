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

-- ═══════════════════════════════════════════════
--  VAULT PLATFORM TABLES
-- ═══════════════════════════════════════════════

-- Core content table
CREATE TABLE IF NOT EXISTS vault_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    uuid            VARCHAR(36) NOT NULL UNIQUE,
    user_id         INT NOT NULL,
    title           VARCHAR(200) NOT NULL,
    slug            VARCHAR(220) NOT NULL UNIQUE,
    description     TEXT DEFAULT NULL,
    type            ENUM('code','script','project','tool') NOT NULL,
    game            VARCHAR(50) DEFAULT 'other',
    language        VARCHAR(30) DEFAULT 'other',
    tags            JSON DEFAULT NULL,
    code_content    LONGTEXT DEFAULT NULL,
    thumbnail_url   VARCHAR(500) DEFAULT NULL,
    is_premium      TINYINT(1) DEFAULT 0,
    status          ENUM('pending','approved','rejected') DEFAULT 'approved',
    download_count  INT DEFAULT 0,
    vote_score      INT DEFAULT 0,
    view_count      INT DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_vault_user (user_id),
    INDEX idx_vault_type (type),
    INDEX idx_vault_game (game),
    INDEX idx_vault_status (status),
    INDEX idx_vault_premium (is_premium),
    INDEX idx_vault_created (created_at),
    INDEX idx_vault_votes (vote_score),
    INDEX idx_vault_downloads (download_count),
    FULLTEXT idx_vault_search (title, description),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Files attached to vault items
CREATE TABLE IF NOT EXISTS vault_files (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    item_id     INT NOT NULL,
    filename    VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path   VARCHAR(500) NOT NULL,
    file_size   BIGINT DEFAULT 0,
    mime_type   VARCHAR(100) DEFAULT NULL,
    file_type   ENUM('source','archive','executable','image') NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_vf_item (item_id),
    FOREIGN KEY (item_id) REFERENCES vault_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Download tracking (login required to download)
CREATE TABLE IF NOT EXISTS vault_downloads (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    item_id     INT NOT NULL,
    user_id     INT NOT NULL,
    ip_address  VARCHAR(45) DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_vd_item (item_id),
    INDEX idx_vd_user (user_id),
    FOREIGN KEY (item_id) REFERENCES vault_items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Upvote / downvote (1 per user per item)
CREATE TABLE IF NOT EXISTS vault_votes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    item_id     INT NOT NULL,
    user_id     INT NOT NULL,
    vote        TINYINT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_vote (item_id, user_id),
    INDEX idx_vv_item (item_id),
    FOREIGN KEY (item_id) REFERENCES vault_items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report malicious/broken content
CREATE TABLE IF NOT EXISTS vault_reports (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    item_id     INT NOT NULL,
    user_id     INT NOT NULL,
    reason      ENUM('malware','broken','stolen','inappropriate','other') NOT NULL,
    details     TEXT DEFAULT NULL,
    status      ENUM('pending','resolved','dismissed') DEFAULT 'pending',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_vr_item (item_id),
    INDEX idx_vr_status (status),
    FOREIGN KEY (item_id) REFERENCES vault_items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function runSetup() {
    try {
        console.log('🔧 Running database setup...');
        const statements = SCHEMA.split(';').filter(s => s.trim().length > 10);
        for (const stmt of statements) {
            const clean = stmt.replace(/--[^\n]*/g, '').trim(); // strip inline comments
            if (clean.length > 10) await pool.execute(clean);
        }
        console.log('✅ Database tables verified/created!');
    } catch (err) {
        console.error('❌ Database setup failed:', err.message);
    }
}

// If run directly (node db/setup.js), execute and exit
if (require.main === module) {
    runSetup().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { runSetup };
