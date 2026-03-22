/* ============================================
 * Script Kittens — Frontend Analytics Tracker
 * 100% non-blocking — runs after page is idle
 * ============================================ */
(function () {
    'use strict';

    var API = 'https://api.script-kittens.com';

    /* ─── Session ID ─── */
    function getSessionId() {
        var sid = sessionStorage.getItem('sk_sid');
        if (!sid) {
            sid = 'sk_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now();
            sessionStorage.setItem('sk_sid', sid);
        }
        return sid;
    }

    /* ─── Logged-in user ─── */
    function getUser() {
        try {
            var raw = localStorage.getItem('sk_user');
            if (raw) { var u = JSON.parse(raw); if (u && u.username) return u; }
        } catch (e) {}
        var username = localStorage.getItem('userUsername');
        if (username) return { username: username, email: localStorage.getItem('userEmail'), role: localStorage.getItem('userRole') };
        return null;
    }

    /* ─── Quick sync data (zero lag) ─── */
    function getQuickData() {
        var gpu = 'Unknown', gpuVendor = 'Unknown';
        try {
            var c = document.createElement('canvas');
            var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
            if (gl) {
                var ext = gl.getExtension('WEBGL_debug_renderer_info');
                if (ext) {
                    gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'Unknown';
                    gpuVendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || 'Unknown';
                }
            }
        } catch (e) {}

        var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        return {
            page:       window.location.href,
            referrer:   document.referrer || 'direct',
            screen:     window.screen.width + 'x' + window.screen.height,
            viewport:   window.innerWidth + 'x' + window.innerHeight,
            colorDepth: window.screen.colorDepth + '-bit',
            pixelRatio: window.devicePixelRatio || 1,
            ram:        navigator.deviceMemory || null,
            cores:      navigator.hardwareConcurrency || null,
            gpu:        gpu,
            gpuVendor:  gpuVendor,
            netType:    conn ? (conn.effectiveType || 'Unknown') : 'Unknown',
            netSpeed:   conn && conn.downlink ? conn.downlink + ' Mbps' : 'Unknown',
            netRTT:     conn && conn.rtt ? conn.rtt + 'ms' : 'Unknown',
            dataSaver:  conn ? (conn.saveData || false) : false,
            language:   navigator.language || null,
            languages:  (navigator.languages || []).join(', '),
            timezone:   Intl.DateTimeFormat().resolvedOptions().timeZone || null,
            darkMode:   window.matchMedia('(prefers-color-scheme: dark)').matches,
            doNotTrack: navigator.doNotTrack === '1',
            cookiesEnabled: navigator.cookieEnabled,
            touchscreen: navigator.maxTouchPoints > 0,
            user:       getUser(),
            sessionId:  getSessionId(),
        };
    }

    /* ─── Slow async data (collected in background, sent separately) ─── */
    function collectSlowData() {
        var result = {};

        // Canvas fingerprint
        try {
            var c = document.createElement('canvas');
            c.width = 200; c.height = 40;
            var ctx = c.getContext('2d');
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(0, 0, 200, 40);
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.fillText('SK\u2665', 5, 25);
            var d = c.toDataURL();
            var h = 0;
            for (var i = 0; i < d.length; i++) { h = ((h << 5) - h) + d.charCodeAt(i); h |= 0; }
            result.fingerprint = 'fp_' + Math.abs(h).toString(16).toUpperCase();
        } catch (e) { result.fingerprint = null; }

        // Ad blocker
        try {
            var t = document.createElement('div');
            t.innerHTML = '&nbsp;';
            t.className = 'adsbox';
            t.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;';
            document.body.appendChild(t);
            result.adBlocker = t.offsetHeight === 0;
            document.body.removeChild(t);
        } catch (e) { result.adBlocker = null; }

        // Battery
        if (navigator.getBattery) {
            navigator.getBattery().then(function(b) {
                result.battery = { level: Math.round(b.level * 100) + '%', charging: b.charging };
                sendSlowData(result);
            }).catch(function() { sendSlowData(result); });
        } else {
            result.battery = null;
            sendSlowData(result);
        }
    }

    function sendSlowData(data) {
        // Don't send if there's nothing interesting
        if (!data.fingerprint && !data.battery && data.adBlocker === null) return;
        data.page = window.location.href;
        data.sessionId = getSessionId();
        data.slowData = true; // flag so backend knows to merge
        try {
            fetch(API + '/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                keepalive: true,
            });
        } catch (e) {}
    }

    /* ─── Scroll depth (passive, zero lag) ─── */
    var maxScroll = 0;
    window.addEventListener('scroll', function() {
        var total = document.body.scrollHeight - window.innerHeight;
        if (total > 0) {
            var d = Math.round((window.scrollY / total) * 100);
            if (d > maxScroll) maxScroll = Math.min(d, 100);
        }
    }, { passive: true });

    /* ─── Tab switches ─── */
    var tabSwitches = 0;
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) tabSwitches++;
    });

    /* ─── Time on page ─── */
    var pageLoadTime = Date.now();

    /* ─── Exit event ─── */
    window.addEventListener('beforeunload', function() {
        var time = Math.round((Date.now() - pageLoadTime) / 1000);
        if (time < 3) return;
        try {
            fetch(API + '/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page: window.location.href,
                    user: getUser(),
                    sessionId: getSessionId(),
                    exitEvent: true,
                    timeOnPage: time,
                    scrollDepth: maxScroll + '%',
                    tabSwitches: tabSwitches,
                }),
                keepalive: true,
            });
        } catch (e) {}
    });

    /* ─── Event tracker ─── */
    window.skTrackEvent = function(event, details) {
        try {
            fetch(API + '/analytics/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event: event, details: details || null, page: window.location.href, user: getUser() }),
                keepalive: true,
            });
        } catch (e) {}
    };

    /* ─── Auto-track data-track buttons ─── */
    document.addEventListener('click', function(e) {
        var el = e.target.closest('[data-track]');
        if (!el) return;
        window.skTrackEvent(el.getAttribute('data-track'), el.getAttribute('data-track-details') ? { info: el.getAttribute('data-track-details') } : null);
    });

    /* ─── Main: send quick data AFTER page is idle ─── */
    function run() {
        // Send quick data immediately (all sync, no lag)
        var data = getQuickData();
        try {
            fetch(API + '/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                keepalive: true,
            });
        } catch (e) {}

        // Collect slow data 3 seconds after page load (user won't notice)
        setTimeout(collectSlowData, 3000);
    }

    // Use requestIdleCallback if available, otherwise setTimeout
    if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(run, { timeout: 2000 });
    } else {
        setTimeout(run, 500);
    }

})();
