/* ============================================
 * Auth Routes — /api/auth/*
 * Handles: check-email, register, login, me, logout
 * ============================================ */
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/connection');
const { authRequired, generateToken } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 12;

/* ─────────────────────────────────────────────
 *  POST /api/auth/check-email
 *  Body: { email }
 *  Returns: { exists: true/false }
 *  Used by frontend to decide login vs signup step
 * ───────────────────────────────────────────── */
router.post('/check-email', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email is required' });
        }

        const emailLower = email.toLowerCase().trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const [rows] = await pool.execute(
            'SELECT id FROM users WHERE email = ? LIMIT 1',
            [emailLower]
        );

        return res.json({ exists: rows.length > 0 });
    } catch (err) {
        console.error('check-email error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

/* ─────────────────────────────────────────────
 *  POST /api/auth/register
 *  Body: { email, username, password }
 *  Returns: { user, token }
 * ───────────────────────────────────────────── */
router.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;

        // Validate inputs
        if (!email || !username || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const emailLower = email.toLowerCase().trim();
        const usernameTrimmed = username.trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (usernameTrimmed.length < 3 || usernameTrimmed.length > 50) {
            return res.status(400).json({ error: 'Username must be 3-50 characters' });
        }

        if (!/^[a-zA-Z0-9_.-]+$/.test(usernameTrimmed)) {
            return res.status(400).json({ error: 'Username can only contain letters, numbers, dots, hyphens, and underscores' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Check if email already exists
        const [existingEmail] = await pool.execute(
            'SELECT id FROM users WHERE email = ? LIMIT 1',
            [emailLower]
        );
        if (existingEmail.length > 0) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        // Check if username already exists
        const [existingUsername] = await pool.execute(
            'SELECT id FROM users WHERE username = ? LIMIT 1',
            [usernameTrimmed]
        );
        if (existingUsername.length > 0) {
            return res.status(409).json({ error: 'This username is already taken' });
        }

        // Hash password & create user
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const userUuid = uuidv4();

        const [result] = await pool.execute(
            `INSERT INTO users (uuid, email, username, password, provider, is_verified, created_at)
             VALUES (?, ?, ?, ?, 'email', 0, NOW())`,
            [userUuid, emailLower, usernameTrimmed, hashedPassword]
        );

        const user = {
            id: result.insertId,
            uuid: userUuid,
            email: emailLower,
            username: usernameTrimmed,
            role: 'user',
        };

        // Generate JWT
        const token = generateToken(user);

        // Set HTTP-only cookie (shared across all subdomains)
        res.cookie('sk_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
            domain: '.script-kittens.com',
        });

        // Store session
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        await pool.execute(
            `INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
             VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
            [user.id, tokenHash, req.ip, (req.headers['user-agent'] || '').slice(0, 500)]
        );

        return res.status(201).json({
            message: 'Account created successfully',
            user: { uuid: user.uuid, email: user.email, username: user.username, role: user.role },
            token,
        });
    } catch (err) {
        console.error('register error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email or username already exists' });
        }
        return res.status(500).json({ error: 'Server error' });
    }
});

/* ─────────────────────────────────────────────
 *  POST /api/auth/login
 *  Body: { email, password }
 *  Returns: { user, token }
 * ───────────────────────────────────────────── */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const emailLower = email.toLowerCase().trim();

        // Find user
        const [rows] = await pool.execute(
            'SELECT id, uuid, email, username, password, role, provider FROM users WHERE email = ? LIMIT 1',
            [emailLower]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = rows[0];

        // Check if this is an OAuth-only account (no password set)
        if (!user.password) {
            return res.status(401).json({
                error: `This account was created with ${user.provider}. Please use ${user.provider} to sign in.`,
            });
        }

        // Verify password
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Update last_login
        await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

        // Generate JWT
        const token = generateToken(user);

        // Set HTTP-only cookie (shared across all subdomains)
        res.cookie('sk_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
            domain: '.script-kittens.com',
        });

        // Store session
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        await pool.execute(
            `INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
             VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
            [user.id, tokenHash, req.ip, (req.headers['user-agent'] || '').slice(0, 500)]
        );

        return res.json({
            message: 'Signed in successfully',
            user: { uuid: user.uuid, email: user.email, username: user.username, role: user.role },
            token,
        });
    } catch (err) {
        console.error('login error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

/* ─────────────────────────────────────────────
 *  GET /api/auth/me
 *  Returns current authenticated user info
 * ───────────────────────────────────────────── */
router.get('/me', authRequired, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT uuid, email, username, avatar_url, role, provider, is_verified, last_login, created_at FROM users WHERE id = ? LIMIT 1',
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json({ user: rows[0] });
    } catch (err) {
        console.error('me error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

/* ─────────────────────────────────────────────
 *  POST /api/auth/logout
 *  Clears the JWT cookie and invalidates session
 * ───────────────────────────────────────────── */
router.post('/logout', async (req, res) => {
    try {
        // Get token to invalidate session
        let token = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
        if (!token && req.cookies && req.cookies.sk_token) {
            token = req.cookies.sk_token;
        }

        if (token) {
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            await pool.execute('DELETE FROM sessions WHERE token_hash = ?', [tokenHash]);
        }

        // Clear cookie (must match domain used when setting)
        res.clearCookie('sk_token', { path: '/', domain: '.script-kittens.com' });

        return res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('logout error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
