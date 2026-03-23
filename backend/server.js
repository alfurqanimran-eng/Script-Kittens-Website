/* ============================================
 * Script Kittens — Express Server
 * ============================================ */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');
const analyticsRoutes = require('./routes/analytics');
const vaultRoutes = require('./routes/vault');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://script-kittens.com';

/* ─── Security Middleware ─── */
app.use(helmet({
    contentSecurityPolicy: false, // Let frontend handle CSP
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images/files to load on cheats subdomain
}));

app.use(cors({
    origin: [
        FRONTEND_URL,
        'http://localhost:8766',             // Local dev server
        'http://127.0.0.1:8766',
        'https://script-kittens.com',
        'https://www.script-kittens.com',
        'https://login.script-kittens.com',  // Login subdomain
        'https://cheats.script-kittens.com', // Cheats subdomain
        'https://profile.script-kittens.com',// Profile subdomain
        'https://admin.script-kittens.com',  // Admin subdomain
        'https://api.script-kittens.com',    // API subdomain (self)
    ],
    credentials: true,                  // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
}));

/* ─── Body Parsers ─── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

/* ─── Rate Limiting ─── */
// General API rate limit
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,                   // 100 requests per window
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict limit for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 20,                    // 20 attempts per window
    message: { error: 'Too many login attempts, please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/* ─── Trust Proxy (for Hostinger / reverse proxy) ─── */
// Trust exactly 1 proxy hop (Hostinger's reverse proxy)
// Using `true` allows IP spoofing via X-Forwarded-For headers
app.set('trust proxy', 1);

/* ─── API Routes ─── */
// Routes work with both /api/auth/* and /auth/* paths
// (api subdomain won't need the /api prefix but we support both)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/auth', authLimiter, authRoutes);
app.use('/api/oauth', apiLimiter, oauthRoutes);
app.use('/oauth', apiLimiter, oauthRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);
app.use('/analytics', apiLimiter, analyticsRoutes);

/* ─── Vault Routes ─── */
app.use('/api/vault', apiLimiter, vaultRoutes);
app.use('/vault', apiLimiter, vaultRoutes);

/* ─── Admin Routes ─── */
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/admin', apiLimiter, adminRoutes);

/* ─── Serve uploaded files ─── */
// Add CORS headers for static uploads (images need to load cross-origin on cheats subdomain)
app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(__dirname, 'uploads')));

/* ─── Health Check ─── */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Script Kittens API',
        timestamp: new Date().toISOString(),
    });
});
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Script Kittens API',
        timestamp: new Date().toISOString(),
    });
});

/* ─── 404 for everything else ─── */
app.use('*', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
});

/* ─── Global Error Handler ─── */
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

/* ─── Start Server ─── */
app.listen(PORT, async () => {
    console.log(`
╔══════════════════════════════════════════════╗
║   Script Kittens API                         ║
║   Port: ${PORT}                                ║
║   Env:  ${process.env.NODE_ENV || 'development'}                         ║
║   CORS: *.script-kittens.com                 ║
╚══════════════════════════════════════════════╝
    `);

    // Auto-run DB setup — all statements use IF NOT EXISTS so it's safe every restart
    try {
        const { runSetup } = require('./db/setup');
        await runSetup();
    } catch (e) {
        console.error('⚠️ DB auto-setup error:', e.message);
    }
});

module.exports = app;
