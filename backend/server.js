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

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://script-kittens.com';

/* ─── Security Middleware ─── */
app.use(helmet({
    contentSecurityPolicy: false, // Let frontend handle CSP
    crossOriginEmbedderPolicy: false,
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
        'https://api.script-kittens.com',    // API subdomain (self)
    ],
    credentials: true,                  // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
// Hostinger uses multiple proxy layers — trust all of them
app.set('trust proxy', true);

/* ─── API Routes ─── */
// Routes work with both /api/auth/* and /auth/* paths
// (api subdomain won't need the /api prefix but we support both)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/auth', authLimiter, authRoutes);
app.use('/api/oauth', apiLimiter, oauthRoutes);
app.use('/oauth', apiLimiter, oauthRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);
app.use('/analytics', apiLimiter, analyticsRoutes);

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
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║   Script Kittens API                         ║
║   Port: ${PORT}                                ║
║   Env:  ${process.env.NODE_ENV || 'development'}                         ║
║   CORS: *.script-kittens.com                 ║
╚══════════════════════════════════════════════╝
    `);
});

module.exports = app;
