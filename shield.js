/* ============================================
 * SCRIPT KITTENS — SHIELD v2.0
 * Anti-Rip | Anti-Copy | Anti-DevTools
 * Military-grade content protection
 * ============================================
 * Include this FIRST on every page:
 * <script src="shield.js"></script>
 * ============================================ */
(function() {
    'use strict';

    // ── Config ──
    var API = 'https://api.script-kittens.com';
    var SITE_NAME = 'Script Kittens';

    // ══════════════════════════════════════════
    //  1. BLOCK RIGHT-CLICK CONTEXT MENU
    // ══════════════════════════════════════════
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showWarning();
        return false;
    }, true);

    // ══════════════════════════════════════════
    //  2. BLOCK ALL KEYBOARD SHORTCUTS
    // ══════════════════════════════════════════
    var blockedKeys = {
        'F12': true,         // DevTools
        'F11': false,        // Fullscreen (allow)
    };

    document.addEventListener('keydown', function(e) {
        var blocked = false;

        // F12 — DevTools
        if (e.key === 'F12' || e.keyCode === 123) blocked = true;

        // Ctrl/Cmd combos
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 's': blocked = true; break;  // Save page
                case 'u': blocked = true; break;  // View source
                case 'p': blocked = true; break;  // Print
                case 'c': if (!isInput(e.target)) blocked = true; break; // Copy (allow in inputs)
                case 'a': if (!isInput(e.target)) blocked = true; break; // Select all (allow in inputs)
                case 'j': blocked = true; break;  // Console (Chrome)
            }
        }

        // Ctrl+Shift combos
        if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
            switch (e.key.toLowerCase()) {
                case 'i': blocked = true; break;  // Inspector
                case 'j': blocked = true; break;  // Console
                case 'c': blocked = true; break;  // Inspector (Element picker)
                case 'k': blocked = true; break;  // Console (Firefox)
                case 'm': blocked = true; break;  // Responsive mode
                case 's': blocked = true; break;  // Screenshot
            }
        }

        if (blocked) {
            e.preventDefault();
            e.stopPropagation();
            showWarning();
            return false;
        }
    }, true);

    // ══════════════════════════════════════════
    //  3. BLOCK TEXT SELECTION (except inputs)
    // ══════════════════════════════════════════
    document.addEventListener('selectstart', function(e) {
        if (isInput(e.target)) return true;
        e.preventDefault();
        return false;
    });

    // ══════════════════════════════════════════
    //  4. BLOCK COPY/CUT/PASTE (except inputs)
    // ══════════════════════════════════════════
    document.addEventListener('copy', function(e) {
        if (isInput(e.target)) return true;
        e.preventDefault();
        // Overwrite clipboard with warning
        if (e.clipboardData) {
            e.clipboardData.setData('text/plain', '© ' + SITE_NAME + ' — Content is protected.');
        }
        return false;
    });
    document.addEventListener('cut', function(e) {
        if (isInput(e.target)) return true;
        e.preventDefault();
        return false;
    });

    // ══════════════════════════════════════════
    //  5. BLOCK DRAG (images, links, text)
    // ══════════════════════════════════════════
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });
    document.addEventListener('drop', function(e) {
        e.preventDefault();
        return false;
    });

    // ══════════════════════════════════════════
    //  6. BLOCK PRINT (Ctrl+P & window.print)
    // ══════════════════════════════════════════
    window.addEventListener('beforeprint', function() {
        // Add a style that hides everything during print
        var s = document.createElement('style');
        s.id = 'sk-no-print';
        s.textContent = '* { display: none !important; }';
        document.head.appendChild(s);
    });
    window.addEventListener('afterprint', function() {
        var s = document.getElementById('sk-no-print');
        if (s) s.remove();
    });

    // ══════════════════════════════════════════
    //  7. DEVTOOLS DETECTION (multiple methods)
    // ══════════════════════════════════════════
    var devtoolsOpen = false;
    var devtoolsAlerted = false;

    // Method 1: Window size difference (detects docked devtools)
    function checkSizeDiff() {
        var widthThreshold = window.outerWidth - window.innerWidth > 160;
        var heightThreshold = window.outerHeight - window.innerHeight > 160;
        if (widthThreshold || heightThreshold) {
            onDevToolsOpen('size');
        }
    }

    // Method 2: debugger statement timing
    function checkDebugger() {
        var start = performance.now();
        (function() { debugger; })();
        var end = performance.now();
        if (end - start > 100) {
            onDevToolsOpen('debugger');
        }
    }

    // Method 3: console.log toString trick
    function checkConsoleLog() {
        var element = new Image();
        Object.defineProperty(element, 'id', {
            get: function() {
                onDevToolsOpen('console');
            }
        });
        // Only runs toString when devtools is open and inspecting
        console.debug(element);
    }

    function onDevToolsOpen(method) {
        if (devtoolsOpen) return;
        devtoolsOpen = true;
        // Send alert via backend API
        if (!devtoolsAlerted) {
            devtoolsAlerted = true;
            sendSecurityAlert('devtools', 'Detection method: ' + method);
        }
    }

    // Run devtools check every 2 seconds (lightweight)
    setInterval(function() {
        checkSizeDiff();
        // Don't run debugger check — too aggressive, can lag the page
        // checkDebugger();
    }, 2000);

    // Console check every 5 seconds
    setInterval(checkConsoleLog, 5000);

    // ══════════════════════════════════════════
    //  8. ANTI-IFRAME (Clickjacking protection)
    // ══════════════════════════════════════════
    if (window.self !== window.top) {
        // We're in an iframe — break out
        try {
            window.top.location = window.self.location;
        } catch (e) {
            // Cross-origin iframe — hide content
            document.documentElement.style.display = 'none';
            document.body.innerHTML = '<h1 style="color:red;text-align:center;margin-top:100px">⚠️ This site cannot be viewed in an iframe.</h1>';
        }
    }

    // ══════════════════════════════════════════
    //  9. SOURCE CODE WATERMARK
    // ══════════════════════════════════════════
    // Even if they manage to copy the source, it's watermarked
    console.log(
        '%c⚠️ STOP! %c' + SITE_NAME + ' — Protected Content',
        'color:#dc2626;font-size:40px;font-weight:bold;text-shadow:2px 2px 0 #000',
        'color:#fff;font-size:18px;background:#dc2626;padding:10px 20px;border-radius:8px;margin-top:10px'
    );
    console.log(
        '%cViewing, copying, or modifying this source code without permission is prohibited.\nAll activities are monitored and logged.',
        'color:#888;font-size:14px;'
    );

    // ══════════════════════════════════════════
    //  10. BLOCK VIEW SOURCE PROTOCOL
    // ══════════════════════════════════════════
    // Prevent view-source: protocol navigation
    var origOpen = window.open;
    window.open = function(url) {
        if (url && typeof url === 'string' && url.indexOf('view-source:') === 0) {
            return null;
        }
        return origOpen.apply(this, arguments);
    };

    // ══════════════════════════════════════════
    //  11. ANTI-AUTOMATION / BOT DETECTION
    // ══════════════════════════════════════════
    // Detect headless browsers & automated tools
    var isBot = false;
    (function detectBot() {
        // Check for headless Chrome
        if (navigator.webdriver) isBot = true;
        // Check for PhantomJS
        if (window.callPhantom || window._phantom) isBot = true;
        // Check for Nightmare.js
        if (window.__nightmare) isBot = true;
        // Check for Selenium
        if (document.__selenium_unwrapped || document.__webdriver_evaluate || document.__driver_evaluate) isBot = true;
        // Check for common bot user agents
        var ua = navigator.userAgent.toLowerCase();
        if (ua.indexOf('headlesschrome') !== -1 || ua.indexOf('phantomjs') !== -1 ||
            ua.indexOf('httrack') !== -1 || ua.indexOf('wget') !== -1 ||
            ua.indexOf('curl') !== -1 || ua.indexOf('scrapy') !== -1 ||
            ua.indexOf('python-requests') !== -1 || ua.indexOf('crawler') !== -1 ||
            ua.indexOf('spider') !== -1 || ua.indexOf('bot') !== -1) {
            isBot = true;
        }
        // Check for missing browser features
        if (!window.chrome && !navigator.userAgent.includes('Firefox') && !navigator.userAgent.includes('Safari')) {
            // Possibly headless
        }

        if (isBot) {
            sendSecurityAlert('bot', 'UA: ' + navigator.userAgent);
            // Don't block — just log. Some legit tools (Googlebot) would be blocked
        }
    })();

    // ══════════════════════════════════════════
    //  12. ANTI-HOTLINK (Image protection)
    // ══════════════════════════════════════════
    // Make all images non-downloadable via context menu
    document.addEventListener('DOMContentLoaded', function() {
        var images = document.querySelectorAll('img');
        images.forEach(function(img) {
            img.setAttribute('draggable', 'false');
            img.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                return false;
            });
        });

        // Observe for dynamically added images
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(m) {
                m.addedNodes.forEach(function(n) {
                    if (n.tagName === 'IMG') {
                        n.setAttribute('draggable', 'false');
                    }
                    if (n.querySelectorAll) {
                        n.querySelectorAll('img').forEach(function(img) {
                            img.setAttribute('draggable', 'false');
                        });
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });

    // ══════════════════════════════════════════
    //  HELPER FUNCTIONS
    // ══════════════════════════════════════════
    function isInput(el) {
        if (!el) return false;
        var tag = el.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    }

    // Warning notification (non-intrusive)
    var warningTimeout = null;
    function showWarning() {
        // Don't spam warnings
        if (warningTimeout) return;

        var warn = document.createElement('div');
        warn.id = 'sk-shield-warn';
        warn.innerHTML = '<div style="display:flex;align-items:center;gap:10px">' +
            '<span style="font-size:20px">🛡️</span>' +
            '<div><strong style="color:#dc2626">Content Protected</strong>' +
            '<div style="font-size:11px;color:#888;margin-top:2px">This action is not allowed on ' + SITE_NAME + '</div></div></div>';
        warn.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#0a0a0a;border:1px solid #dc2626;' +
            'border-radius:12px;padding:14px 20px;z-index:999999;color:#fff;font-family:Inter,sans-serif;' +
            'font-size:13px;box-shadow:0 0 30px rgba(220,38,38,.3);animation:skShieldIn .3s ease;pointer-events:none;';

        // Add animation keyframes if not exists
        if (!document.getElementById('sk-shield-style')) {
            var s = document.createElement('style');
            s.id = 'sk-shield-style';
            s.textContent = '@keyframes skShieldIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}' +
                '@keyframes skShieldOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(10px)}}';
            document.head.appendChild(s);
        }

        document.body.appendChild(warn);
        warningTimeout = setTimeout(function() {
            warn.style.animation = 'skShieldOut .3s ease forwards';
            setTimeout(function() {
                if (warn.parentNode) warn.parentNode.removeChild(warn);
                warningTimeout = null;
            }, 300);
        }, 2500);
    }

    // Security alert via backend API (webhook URL stays hidden on server)
    var alertsSent = {};
    function sendSecurityAlert(alertType, details) {
        // Rate limit: only send each alert type once per session
        if (alertsSent[alertType]) return;
        alertsSent[alertType] = true;
        try {
            fetch(API + '/analytics/security', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    alert: alertType,
                    details: details || '',
                    page: window.location.href,
                }),
                keepalive: true,
            });
        } catch (e) {}
    }

    // ══════════════════════════════════════════
    //  13. MUTATION OBSERVER — Protect against
    //      DOM injection attacks
    // ══════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', function() {
        // Watch for injected iframes or scripts from external domains
        var domObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(m) {
                m.addedNodes.forEach(function(node) {
                    if (node.tagName === 'IFRAME') {
                        var src = (node.src || '').toLowerCase();
                        if (src && src.indexOf('script-kittens.com') === -1 && src.indexOf('youtube') === -1 &&
                            src.indexOf('discord') === -1 && src.indexOf('stripe') === -1) {
                            node.remove();
                            sendSecurityAlert('iframe', 'Blocked iframe src: ' + src);
                        }
                    }
                });
            });
        });
        domObserver.observe(document.documentElement, { childList: true, subtree: true });
    });

    // ══════════════════════════════════════════
    //  EXPORT (for manual control if needed)
    // ══════════════════════════════════════════
    window.__skShield = {
        version: '2.0',
        isDevToolsOpen: function() { return devtoolsOpen; },
        isBot: function() { return isBot; },
    };

})();
