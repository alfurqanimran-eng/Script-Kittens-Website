/* ============================================
 * JWT Auth Middleware
 * ============================================ */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;

/**
 * Verifies the JWT from either:
 * 1. Authorization: Bearer <token>
 * 2. Cookie: sk_token=<token>
 *
 * Attaches req.user = { id, uuid, email, username, role }
 */
function authRequired(req, res, next) {
    let token = null;

    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
    }

    // Fallback to cookie
    if (!token && req.cookies && req.cookies.sk_token) {
        token = req.cookies.sk_token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired, please login again' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
}

/**
 * Optional auth — doesn't block if no token, just attaches user if present
 */
function authOptional(req, res, next) {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
    }
    if (!token && req.cookies && req.cookies.sk_token) {
        token = req.cookies.sk_token;
    }

    if (token) {
        try {
            req.user = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            req.user = null;
        }
    }
    next();
}

/**
 * Admin-only middleware (must be used AFTER authRequired)
 */
function adminRequired(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

/**
 * Generate a JWT for a user record
 */
function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            uuid: user.uuid,
            email: user.email,
            username: user.username,
            role: user.role,
        },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

module.exports = { authRequired, authOptional, adminRequired, generateToken };
