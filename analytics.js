/* ============================================
 * Script Kittens — Frontend Analytics Tracker
 * Collects EVERYTHING possible from browser
 * Sends to backend → Discord
 * ============================================ */
(function () {
    'use strict';

    const API = 'https://api.script-kittens.com';

    /* ─── Session ID ─── */
    function getSessionId() {
        let sid = sessionStorage.getItem('sk_sid');
        if (!sid) {
            sid = 'sk_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now();
            sessionStorage.setItem('sk_sid', sid);
        }
        return sid;
    }

    /* ─── Logged-in user from localStorage ─── */
    function getUser() {
        try {
            const raw = localStorage.getItem('sk_user');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        const username = localStorage.getItem('userUsername');
        const email    = localStorage.getItem('userEmail');
        const role     = localStorage.getItem('userRole');
        if (username) return { username, email, role };
        return null;
    }

    /* ─── GPU Info via WebGL ─── */
    function getGPU() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return { gpu: 'Unknown', gpuVendor: 'Unknown' };
            const ext = gl.getExtension('WEBGL_debug_renderer_info');
            if (!ext) return { gpu: 'WebGL (no debug info)', gpuVendor: 'Unknown' };
            return {
                gpu:       gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'Unknown',
                gpuVendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)   || 'Unknown',
            };
        } catch (e) {
            return { gpu: 'Error', gpuVendor: 'Error' };
        }
    }

    /* ─── Canvas Fingerprint (unique per device/GPU combo) ─── */
    function getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 280; canvas.height = 60;
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(0, 0, 280, 60);
            ctx.fillStyle = '#ffffff';
            ctx.fillText('Script Kittens \uD83D\uDC31 \u2665 0xDEADBEEF', 5, 5);
            ctx.fillStyle = 'rgba(100,200,255,0.5)';
            ctx.fillText('Script Kittens \uD83D\uDC31 \u2665 0xDEADBEEF', 5, 30);
            const data = canvas.toDataURL();
            // Hash it to a short ID
            let hash = 0;
            for (let i = 0; i < data.length; i++) {
                hash = ((hash << 5) - hash) + data.charCodeAt(i);
                hash |= 0;
            }
            return 'fp_' + Math.abs(hash).toString(16).toUpperCase();
        } catch (e) {
            return 'fp_error';
        }
    }

    /* ─── Network Info ─── */
    function getNetwork() {
        try {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (!conn) return { netType: 'Unknown', netSpeed: 'Unknown', netRTT: 'Unknown', dataSaver: false };
            return {
                netType:   conn.effectiveType || 'Unknown',    // "4g", "3g", "2g"
                netSpeed:  conn.downlink ? `${conn.downlink} Mbps` : 'Unknown',
                netRTT:    conn.rtt ? `${conn.rtt}ms` : 'Unknown',
                dataSaver: conn.saveData || false,
            };
        } catch (e) {
            return { netType: 'Error', netSpeed: 'Error', netRTT: 'Error', dataSaver: false };
        }
    }

    /* ─── Battery Status ─── */
    async function getBattery() {
        try {
            if (!navigator.getBattery) return null;
            const b = await navigator.getBattery();
            return {
                level:    Math.round(b.level * 100) + '%',
                charging: b.charging,
            };
        } catch (e) {
            return null;
        }
    }

    /* ─── Ad Blocker Detection ─── */
    function detectAdBlocker() {
        try {
            const test = document.createElement('div');
            test.innerHTML = '&nbsp;';
            test.className = 'adsbox pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads';
            test.style.cssText = 'position:absolute;top:-1000px;left:-1000px;width:1px;height:1px;';
            document.body.appendChild(test);
            const blocked = test.offsetHeight === 0 || test.offsetParent === null;
            document.body.removeChild(test);
            return blocked;
        } catch (e) {
            return null;
        }
    }

    /* ─── VPN / Proxy Detection via WebRTC ─── */
    function getRealIP() {
        return new Promise((resolve) => {
            try {
                const pc = new RTCPeerConnection({ iceServers: [] });
                const ips = new Set();
                pc.createDataChannel('');
                pc.createOffer().then(o => pc.setLocalDescription(o)).catch(() => resolve(null));
                pc.onicecandidate = (e) => {
                    if (!e || !e.candidate) {
                        pc.close();
                        resolve(ips.size > 0 ? [...ips].join(', ') : null);
                        return;
                    }
                    const match = e.candidate.candidate.match(/(\d{1,3}(?:\.\d{1,3}){3})/g);
                    if (match) match.forEach(ip => {
                        if (!ip.startsWith('0.') && !ip.startsWith('127.')) ips.add(ip);
                    });
                };
                // Timeout after 2s
                setTimeout(() => { pc.close(); resolve(ips.size > 0 ? [...ips].join(', ') : null); }, 2000);
            } catch (e) {
                resolve(null);
            }
        });
    }

    /* ─── Dark mode / display preferences ─── */
    function getPreferences() {
        return {
            darkMode:        window.matchMedia('(prefers-color-scheme: dark)').matches,
            reducedMotion:   window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            highContrast:    window.matchMedia('(prefers-contrast: high)').matches,
            doNotTrack:      navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes',
            cookiesEnabled:  navigator.cookieEnabled,
            touchscreen:     navigator.maxTouchPoints > 0,
            pdfViewer:       navigator.pdfViewerEnabled || false,
        };
    }

    /* ─── Tab focus tracking ─── */
    let tabSwitches = 0;
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) tabSwitches++;
    });

    /* ─── Scroll depth tracking ─── */
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
        const depth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        if (depth > maxScroll) maxScroll = Math.min(depth, 100);
    }, { passive: true });

    /* ─── Time on page ─── */
    const pageLoadTime = Date.now();

    /* ─── Referrer ─── */
    function getReferrer() {
        const ref = document.referrer;
        if (!ref) return 'direct';
        return ref;
    }

    /* ─── Send to backend ─── */
    async function sendData(payload) {
        try {
            await fetch(`${API}/analytics/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true,
            });
        } catch (e) {}
    }

    /* ─── Main collector ─── */
    async function trackPageView() {
        const gpuInfo   = getGPU();
        const netInfo   = getNetwork();
        const prefs     = getPreferences();
        const fpId      = getCanvasFingerprint();
        const adBlocked = detectAdBlocker();
        const battery   = await getBattery();
        const rtcIP     = await getRealIP();

        const payload = {
            // Page
            page:      window.location.href,
            referrer:  getReferrer(),

            // Display
            screen:       `${window.screen.width}x${window.screen.height}`,
            viewport:     `${window.innerWidth}x${window.innerHeight}`,
            colorDepth:   window.screen.colorDepth + '-bit',
            pixelRatio:   window.devicePixelRatio || 1,

            // Hardware
            ram:          navigator.deviceMemory || null,
            cores:        navigator.hardwareConcurrency || null,
            gpu:          gpuInfo.gpu,
            gpuVendor:    gpuInfo.gpuVendor,

            // Network
            netType:      netInfo.netType,
            netSpeed:     netInfo.netSpeed,
            netRTT:       netInfo.netRTT,
            dataSaver:    netInfo.dataSaver,

            // Battery
            battery:      battery,

            // Location/Locale
            language:     navigator.language || null,
            languages:    (navigator.languages || []).join(', '),
            timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone || null,

            // Preferences
            darkMode:        prefs.darkMode,
            reducedMotion:   prefs.reducedMotion,
            highContrast:    prefs.highContrast,
            doNotTrack:      prefs.doNotTrack,
            cookiesEnabled:  prefs.cookiesEnabled,
            touchscreen:     prefs.touchscreen,

            // Fingerprint + VPN
            fingerprint:  fpId,
            rtcLocalIP:   rtcIP,

            // Ad blocker
            adBlocker:    adBlocked,

            // Session
            user:         getUser(),
            sessionId:    getSessionId(),
        };

        await sendData(payload);

        // Send time-on-page + scroll when leaving
        // Only send if they were on page for more than 3 seconds (skip redirects/bounces)
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Math.round((Date.now() - pageLoadTime) / 1000);
            if (timeOnPage < 3) return; // skip instant redirects
            fetch(`${API}/analytics/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page:        window.location.href,
                    user:        getUser(),
                    sessionId:   getSessionId(),
                    exitEvent:   true,
                    timeOnPage:  timeOnPage,
                    scrollDepth: maxScroll + '%',
                    tabSwitches: tabSwitches,
                }),
                keepalive: true,
            });
        });
    }

    /* ─── Event tracker (call anywhere) ─── */
    window.skTrackEvent = async function (event, details) {
        try {
            await fetch(`${API}/analytics/event`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event,
                    details: details || null,
                    page:    window.location.href,
                    user:    getUser(),
                }),
                keepalive: true,
            });
        } catch (e) {}
    };

    /* ─── Auto-track data-track buttons ─── */
    function autoTrackClicks() {
        document.addEventListener('click', function (e) {
            const el = e.target.closest('[data-track]');
            if (!el) return;
            const event   = el.getAttribute('data-track');
            const details = el.getAttribute('data-track-details');
            window.skTrackEvent(event, details ? { info: details } : null);
        });
    }

    /* ─── Run ─── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { trackPageView(); autoTrackClicks(); });
    } else {
        trackPageView();
        autoTrackClicks();
    }

})();
