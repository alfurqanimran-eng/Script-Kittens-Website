/* ============================================
 * OAuth Routes — /oauth/*
 * Handles: Google, Discord, GitHub OAuth2 flows
 *
 * Flow:
 * 1. Frontend redirects to GET https://api.script-kittens.com/oauth/:provider
 * 2. We redirect to provider's auth page
 * 3. Provider redirects back to GET https://api.script-kittens.com/oauth/:provider/callback
 * 4. We exchange code for token, get user info, create/login user
 * 5. Redirect to login.script-kittens.com with JWT in URL
 * ============================================ */
const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/connection');
const { generateToken } = require('../middleware/auth');
const authRouter = require('./auth');

const router = express.Router();
const notifyDiscordLogin = authRouter.notifyDiscordLogin;

/* ─── Get real client IP (handles Hostinger multi-proxy) ─── */
function getRealIP(req) {
    return (
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.headers['cf-connecting-ip'] ||
        req.socket?.remoteAddress ||
        req.ip ||
        'Unknown'
    );
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://script-kittens.com';
const BACKEND_URL = process.env.BACKEND_URL || 'https://api.script-kittens.com';
const LOGIN_URL = process.env.LOGIN_URL || 'https://login.script-kittens.com';

/* ─── Helper: HTTPS fetch (built-in Node 18+) ─── */
async function fetchJSON(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json();
}

/* ─── Helper: Find or create OAuth user ─── */
async function findOrCreateOAuthUser(provider, providerProfile) {
    const { id: providerId, email, username, avatar } = providerProfile;

    // 1. Check if user exists with this EXACT provider + provider_id
    const [existing] = await pool.execute(
        'SELECT id, uuid, email, username, avatar_url, role FROM users WHERE provider = ? AND provider_id = ? LIMIT 1',
        [provider, String(providerId)]
    );

    if (existing.length > 0) {
        // Update avatar + last_login every time they login (so avatar stays fresh)
        await pool.execute(
            'UPDATE users SET avatar_url = ?, last_login = NOW() WHERE id = ?',
            [avatar || existing[0].avatar_url, existing[0].id]
        );
        existing[0].provider = provider;
        existing[0].avatar_url = avatar || existing[0].avatar_url;
        return existing[0];
    }

    // 2. Check if email already exists (same person, different OAuth provider)
    if (email) {
        const [emailUser] = await pool.execute(
            'SELECT id, uuid, email, username, avatar_url, role, provider, provider_id FROM users WHERE email = ? LIMIT 1',
            [email.toLowerCase()]
        );

        if (emailUser.length > 0) {
            // DON'T overwrite their original provider — just update avatar + last_login
            // The user keeps their original provider/provider_id for consistency
            // But always refresh avatar to whichever provider they're currently using
            await pool.execute(
                'UPDATE users SET avatar_url = ?, is_verified = 1, last_login = NOW() WHERE id = ?',
                [avatar || emailUser[0].avatar_url, emailUser[0].id]
            );
            emailUser[0].provider = provider; // for Discord notification (which method they used this time)
            emailUser[0].avatar_url = avatar || emailUser[0].avatar_url;
            return emailUser[0];
        }
    }

    // 3. Create brand new user
    const userUuid = uuidv4();
    let finalUsername = username || email?.split('@')[0] || `user_${Date.now()}`;

    const [usernameCheck] = await pool.execute(
        'SELECT id FROM users WHERE username = ? LIMIT 1',
        [finalUsername]
    );
    if (usernameCheck.length > 0) {
        finalUsername = `${finalUsername}_${Math.random().toString(36).slice(2, 6)}`;
    }

    const [result] = await pool.execute(
        `INSERT INTO users (uuid, email, username, password, avatar_url, provider, provider_id, is_verified, created_at, last_login)
         VALUES (?, ?, ?, NULL, ?, ?, ?, 1, NOW(), NOW())`,
        [userUuid, email?.toLowerCase() || null, finalUsername, avatar, provider, String(providerId)]
    );

    return {
        id: result.insertId,
        uuid: userUuid,
        email: email?.toLowerCase(),
        username: finalUsername,
        avatar_url: avatar,
        role: 'user',
        provider: provider,
    };
}

/* ─── Helper: Set cookie and redirect to login subdomain ─── */
function loginAndRedirect(res, req, user) {
    const token = generateToken(user);

    // Set HTTP-only cookie on .script-kittens.com (shared across all subdomains)
    res.cookie('sk_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
        domain: '.script-kittens.com',   // <-- shared across all subdomains
    });

    // Store session
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    pool.execute(
        `INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
         VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
        [user.id, tokenHash, getRealIP(req), (req.headers['user-agent'] || '').slice(0, 500)]
    ).catch(err => console.error('Session save error:', err));

    // Notify Discord about OAuth login
    const provider = user.provider || 'oauth';
    if (notifyDiscordLogin) notifyDiscordLogin(user, provider, getRealIP(req), req);

    // Redirect to login page with token (login page JS will grab it and redirect to home)
    return res.redirect(`${LOGIN_URL}?auth=success&token=${token}`);
}

/* ═══════════════════════════════════════════════ */
/*  GOOGLE OAUTH                                   */
/* ═══════════════════════════════════════════════ */

router.get('/google', (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: `${BACKEND_URL}/oauth/google/callback`,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/google/callback', async (req, res) => {
    try {
        const { code, error } = req.query;
        if (error || !code) {
            return res.redirect(`${LOGIN_URL}?auth=error&message=${encodeURIComponent(error || 'No code received')}`);
        }

        const redirectUri = `${BACKEND_URL}/oauth/google/callback`;

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });
        const tokens = await tokenRes.json();

        if (tokens.error) {
            throw new Error(tokens.error_description || tokens.error);
        }

        const userInfo = await fetchJSON('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const user = await findOrCreateOAuthUser('google', {
            id: userInfo.id,
            email: userInfo.email,
            username: userInfo.name?.replace(/\s+/g, '_').toLowerCase(),
            avatar: userInfo.picture,
        });

        return loginAndRedirect(res, req, user);
    } catch (err) {
        console.error('Google OAuth error:', err);
        return res.redirect(`${LOGIN_URL}?auth=error&message=${encodeURIComponent('Google login failed')}`);
    }
});

/* ═══════════════════════════════════════════════ */
/*  DISCORD OAUTH                                  */
/* ═══════════════════════════════════════════════ */

router.get('/discord', (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        redirect_uri: `${BACKEND_URL}/oauth/discord/callback`,
        response_type: 'code',
        scope: 'identify email',
    });
    res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

router.get('/discord/callback', async (req, res) => {
    try {
        const { code, error } = req.query;
        if (error || !code) {
            return res.redirect(`${LOGIN_URL}?auth=error&message=${encodeURIComponent(error || 'No code received')}`);
        }

        const redirectUri = `${BACKEND_URL}/oauth/discord/callback`;

        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });
        const tokens = await tokenRes.json();

        if (tokens.error) {
            throw new Error(tokens.error_description || tokens.error);
        }

        const userInfo = await fetchJSON('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const avatarUrl = userInfo.avatar
            ? `https://cdn.discordapp.com/avatars/${userInfo.id}/${userInfo.avatar}.png`
            : null;

        const user = await findOrCreateOAuthUser('discord', {
            id: userInfo.id,
            email: userInfo.email,
            username: userInfo.username,
            avatar: avatarUrl,
        });

        return loginAndRedirect(res, req, user);
    } catch (err) {
        console.error('Discord OAuth error:', err);
        return res.redirect(`${LOGIN_URL}?auth=error&message=${encodeURIComponent('Discord login failed')}`);
    }
});

/* ═══════════════════════════════════════════════ */
/*  GITHUB OAUTH                                   */
/* ═══════════════════════════════════════════════ */

router.get('/github', (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: `${BACKEND_URL}/oauth/github/callback`,
        scope: 'user:email',
    });
    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/github/callback', async (req, res) => {
    try {
        const { code, error } = req.query;
        if (error || !code) {
            return res.redirect(`${LOGIN_URL}?auth=error&message=${encodeURIComponent(error || 'No code received')}`);
        }

        const tokenRes = await fetchJSON('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                code,
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
            }),
        });

        if (tokenRes.error) {
            throw new Error(tokenRes.error_description || tokenRes.error);
        }

        const userInfo = await fetchJSON('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${tokenRes.access_token}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'ScriptKittens-App',
            },
        });

        let email = userInfo.email;
        if (!email) {
            const emails = await fetchJSON('https://api.github.com/user/emails', {
                headers: {
                    Authorization: `Bearer ${tokenRes.access_token}`,
                    Accept: 'application/vnd.github.v3+json',
                    'User-Agent': 'ScriptKittens-App',
                },
            });
            const primary = emails.find(e => e.primary) || emails[0];
            email = primary?.email;
        }

        const user = await findOrCreateOAuthUser('github', {
            id: userInfo.id,
            email: email,
            username: userInfo.login,
            avatar: userInfo.avatar_url,
        });

        return loginAndRedirect(res, req, user);
    } catch (err) {
        console.error('GitHub OAuth error:', err);
        return res.redirect(`${LOGIN_URL}?auth=error&message=${encodeURIComponent('GitHub login failed')}`);
    }
});

module.exports = router;
