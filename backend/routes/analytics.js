/* ============================================
 * Analytics Route — /api/analytics/track
 * Receives ALL browser data, sends to Discord
 * ============================================ */
const express = require('express');
const router = express.Router();

let geoip = null;
try { geoip = require('geoip-lite'); } catch (e) { console.warn('geoip-lite not installed'); }

const DISCORD_ANALYTICS_WEBHOOK = process.env.DISCORD_ANALYTICS_WEBHOOK || '';

/* ─── Parse User-Agent ─── */
function parseUserAgent(ua) {
    if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Desktop 🖥️' };
    let browser = 'Unknown', os = 'Unknown', device = 'Desktop 🖥️';

    if (ua.includes('Edg/'))            browser = 'Edge';
    else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
    else if (ua.includes('Chrome/'))    browser = 'Chrome';
    else if (ua.includes('Firefox/'))   browser = 'Firefox';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('MSIE') || ua.includes('Trident/')) browser = 'Internet Explorer';

    const vMatch = ua.match(/(Chrome|Firefox|Safari|Edg|OPR)\/(\d+)/);
    if (vMatch) browser += ` ${vMatch[2]}`;

    if (ua.includes('Windows NT 10.0'))       os = 'Windows 10/11';
    else if (ua.includes('Windows NT 6.3'))   os = 'Windows 8.1';
    else if (ua.includes('Windows NT 6.1'))   os = 'Windows 7';
    else if (ua.includes('Windows'))          os = 'Windows';
    else if (ua.includes('Mac OS X'))         os = 'macOS';
    else if (ua.includes('Android'))          os = 'Android';
    else if (ua.includes('iPhone'))           os = 'iOS (iPhone)';
    else if (ua.includes('iPad'))             os = 'iOS (iPad)';
    else if (ua.includes('Linux'))            os = 'Linux';
    else if (ua.includes('CrOS'))             os = 'ChromeOS';

    if (ua.includes('Mobile') || ua.includes('iPhone') || ua.includes('Android') && ua.includes('Mobile'))
        device = 'Mobile 📱';
    else if (ua.includes('iPad') || ua.includes('Tablet'))
        device = 'Tablet 📟';

    return { browser, os, device };
}

/* ─── Country flag emoji ─── */
function countryFlag(code) {
    if (!code || code.length !== 2) return '🌍';
    return code.toUpperCase().split('').map(c => String.fromCodePoint(0x1F1E0 + c.charCodeAt(0) - 65)).join('');
}

/* ─── Page label ─── */
function pageName(page) {
    if (!page) return '📄 Unknown';
    if (page.includes('cheats.script-kittens'))   return '🎮 Free Cheats';
    if (page.includes('profile.script-kittens'))  return '👤 Profile';
    if (page.includes('login.script-kittens'))    return '🔑 Login';
    if (page.includes('checkout'))                return '💳 Checkout';
    if (page.includes('script-kittens.com'))      return '🏠 Homepage';
    return `📄 ${page.slice(0, 50)}`;
}

/* ─── Bool display ─── */
function bool(v) { return v ? '✅ Yes' : '❌ No'; }

/* ─── Referrer label ─── */
function referrerLabel(ref) {
    if (!ref || ref === 'direct') return '📌 Direct';
    if (ref.includes('google'))   return '🔍 Google';
    if (ref.includes('discord'))  return '💜 Discord';
    if (ref.includes('reddit'))   return '🟠 Reddit';
    if (ref.includes('youtube'))  return '🔴 YouTube';
    if (ref.includes('twitter') || ref.includes('x.com')) return '🐦 Twitter/X';
    if (ref.includes('facebook')) return '🔵 Facebook';
    if (ref.includes('instagram')) return '📸 Instagram';
    if (ref.includes('tiktok'))   return '🎵 TikTok';
    return `🔗 ${ref.slice(0, 60)}`;
}

/* ─── Send embed to Discord ─── */
async function sendToDiscord(embed) {
    if (!DISCORD_ANALYTICS_WEBHOOK) return;
    try {
        await fetch(DISCORD_ANALYTICS_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] }),
        });
    } catch (err) {
        console.error('Analytics Discord webhook error:', err.message);
    }
}

/* ═══════════════════════════════════════════════ */
/*  POST /api/analytics/track                      */
/*  Main page-view tracker                         */
/* ═══════════════════════════════════════════════ */
router.post('/track', async (req, res) => {
    try {
        const ip =
            req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers['x-real-ip'] ||
            req.socket?.remoteAddress ||
            req.ip;

        const geo    = geoip ? geoip.lookup(ip) : null;
        const ua     = req.headers['user-agent'] || '';
        const parsed = parseUserAgent(ua);

        const {
            page, referrer, exitEvent, slowData,
            // Display
            screen, viewport, colorDepth, pixelRatio,
            // Hardware
            ram, cores, gpu, gpuVendor,
            // Network
            netType, netSpeed, netRTT, dataSaver,
            // Battery
            battery,
            // Locale
            language, languages, timezone,
            // Preferences
            darkMode, reducedMotion, highContrast,
            doNotTrack, cookiesEnabled, touchscreen,
            // Fingerprint + VPN
            fingerprint, rtcLocalIP,
            // Ad blocker
            adBlocker,
            // Exit event fields
            timeOnPage, scrollDepth, tabSwitches,
            // User
            user, sessionId,
        } = req.body;

        // ── Slow data (fingerprint, battery, adblocker) — skip Discord embed ──
        if (slowData) {
            // Just silently acknowledge — data already in the main embed or not critical
            return res.json({ ok: true });
        }

        // ── Exit event (time on page, scroll depth) ──
        if (exitEvent) {
            const mins = Math.floor((timeOnPage || 0) / 60);
            const secs = (timeOnPage || 0) % 60;
            const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
            const userStr = user ? `${user.username} (${user.email})` : 'Guest';

            const embed = {
                title: '📊 Page Exit — Script Kittens',
                color: 0x1a1a2e,
                fields: [
                    { name: '📄 Page',         value: pageName(page),            inline: true },
                    { name: '👤 User',         value: userStr,                   inline: true },
                    { name: '⏱️ Time on Page', value: timeStr,                   inline: true },
                    { name: '📜 Scroll Depth', value: scrollDepth || '0%',       inline: true },
                    { name: '🔄 Tab Switches', value: String(tabSwitches || 0),  inline: true },
                ],
                footer: { text: `Session: ${sessionId || 'N/A'} • Script Kittens Analytics` },
                timestamp: new Date().toISOString(),
            };
            sendToDiscord(embed).catch(() => {});
            return res.json({ ok: true });
        }

        // ── Full page view ──
        const flag     = geo ? countryFlag(geo.country) : '🌍';
        const location = geo ? `${flag} ${geo.city || 'Unknown'}, ${geo.country || '??'}` : `${flag} Unknown`;
        const isp      = geo?.org || 'Unknown';
        const timeStr  = new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' });
        const isLoggedIn = !!user;
        const userStr  = isLoggedIn
            ? `✅ ${user.username} (${user.email}) — ${user.role || 'user'}`
            : '❌ Guest';

        // VPN detection: if rtcLocalIP differs from server-side IP
        const vpnDetected = rtcLocalIP && !rtcLocalIP.includes(ip) && rtcLocalIP !== ip;
        const vpnStr = rtcLocalIP
            ? (vpnDetected ? `⚠️ Possible VPN — Local IP: ${rtcLocalIP}` : `✅ No VPN — ${rtcLocalIP}`)
            : '❓ Unknown';

        const batStr = battery
            ? `${battery.level} ${battery.charging ? '⚡ Charging' : '🔋 On battery'}`
            : 'Unknown';

        const embed = {
            title: `👁️ Page Visit — Script Kittens`,
            color: isLoggedIn ? 0xdc2626 : 0x2b2b2b,
            fields: [
                // Who + Where
                { name: '📄 Page',            value: pageName(page),         inline: true },
                { name: '🔗 Referrer',        value: referrerLabel(referrer), inline: true },
                { name: '👤 User',            value: userStr,                inline: false },

                // Location
                { name: '🌐 Server IP',       value: `\`${ip}\``,            inline: true },
                { name: '📍 Location',        value: location,               inline: true },
                { name: '🏢 ISP',             value: isp,                    inline: true },
                { name: '🕵️ VPN/Proxy',      value: vpnStr,                 inline: false },

                // Device
                { name: '🖥️ Device',         value: parsed.device,          inline: true },
                { name: '💻 OS',              value: parsed.os,              inline: true },
                { name: '🌐 Browser',         value: parsed.browser,         inline: true },

                // Display
                { name: '📐 Screen',          value: screen || 'Unknown',    inline: true },
                { name: '🪟 Viewport',        value: viewport || 'Unknown',  inline: true },
                { name: '🎨 Color Depth',     value: colorDepth || 'Unknown',inline: true },
                { name: '🔍 Pixel Ratio',     value: String(pixelRatio || 1),inline: true },

                // Hardware
                { name: '🧠 RAM',             value: ram ? `${ram}GB` : 'Unknown',     inline: true },
                { name: '⚙️ CPU Cores',       value: cores ? `${cores} cores` : 'Unknown', inline: true },
                { name: '🎮 GPU',             value: (gpu || 'Unknown').slice(0, 50),  inline: false },
                { name: '🏭 GPU Vendor',      value: (gpuVendor || 'Unknown').slice(0, 50), inline: true },

                // Network
                { name: '📶 Network Type',    value: netType || 'Unknown',   inline: true },
                { name: '⚡ Speed',           value: netSpeed || 'Unknown',  inline: true },
                { name: '📡 Ping',            value: netRTT || 'Unknown',    inline: true },
                { name: '💾 Data Saver',      value: bool(dataSaver),        inline: true },

                // Battery
                { name: '🔋 Battery',         value: batStr,                 inline: true },

                // Locale
                { name: '🌍 Language',        value: language || 'Unknown',  inline: true },
                { name: '🗺️ Timezone',        value: timezone || 'Unknown',  inline: true },

                // Preferences
                { name: '🌙 Dark Mode',       value: bool(darkMode),         inline: true },
                { name: '🚫 Ad Blocker',      value: bool(adBlocker),        inline: true },
                { name: '👆 Touchscreen',     value: bool(touchscreen),      inline: true },
                { name: '🛡️ Do Not Track',   value: bool(doNotTrack),       inline: true },
                { name: '🍪 Cookies',         value: bool(cookiesEnabled),   inline: true },

                // Identity
                { name: '🔑 Device Fingerprint', value: fingerprint || 'Unknown', inline: true },
                { name: '⏰ Time (PKT)',       value: timeStr,                inline: true },
            ],
            footer: { text: `Session: ${sessionId || 'N/A'} • Script Kittens Analytics` },
            timestamp: new Date().toISOString(),
        };

        sendToDiscord(embed).catch(() => {});
        return res.json({ ok: true });
    } catch (err) {
        console.error('Analytics track error:', err);
        return res.json({ ok: false });
    }
});

/* ═══════════════════════════════════════════════ */
/*  POST /api/analytics/event                      */
/*  Track specific actions (buy clicks, downloads) */
/* ═══════════════════════════════════════════════ */
router.post('/event', async (req, res) => {
    try {
        if (!DISCORD_ANALYTICS_WEBHOOK) return res.json({ ok: true });

        const ip =
            req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
        const geo   = geoip ? geoip.lookup(ip) : null;
        const flag  = geo ? countryFlag(geo.country) : '🌍';
        const loc   = geo ? `${flag} ${geo.city || ''}, ${geo.country || ''}` : `${flag} Unknown`;

        const { event, details, user, page } = req.body;

        const eventLabels = {
            'buy_click':      '💰 Buy Button Clicked',
            'checkout_start': '🛒 Checkout Started',
            'purchase':       '✅ PURCHASE COMPLETED',
            'signup':         '🎉 New Signup',
            'login':          '🔑 Login',
            'logout':         '👋 Logout',
            'download':       '📥 Download',
            'discord_click':  '💜 Discord Link Clicked',
            'cheat_view':     '👀 Cheat Viewed',
            'product_view':   '🎮 Product Viewed',
        };

        const title   = eventLabels[event] || `⚡ Event: ${event}`;
        const timeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' });
        const userStr = user ? `${user.username} (${user.email})` : 'Guest';
        const color   = event === 'purchase' ? 0x00ff00 : event.includes('buy') ? 0xffa500 : 0xdc2626;

        const embed = {
            title,
            color,
            fields: [
                { name: '📄 Page',      value: pageName(page), inline: true },
                { name: '👤 User',      value: userStr,        inline: true },
                { name: '📍 Location', value: loc,             inline: true },
                { name: '⏰ Time (PKT)', value: timeStr,        inline: true },
            ],
            timestamp: new Date().toISOString(),
            footer: { text: 'Script Kittens Event Tracker' },
        };

        if (details) {
            embed.fields.push({
                name: '📋 Details',
                value: typeof details === 'object'
                    ? JSON.stringify(details, null, 2).slice(0, 1000)
                    : String(details).slice(0, 1000),
                inline: false,
            });
        }

        await fetch(DISCORD_ANALYTICS_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] }),
        });

        return res.json({ ok: true });
    } catch (err) {
        console.error('Analytics event error:', err);
        return res.json({ ok: false });
    }
});

module.exports = router;
