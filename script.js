/* ================================================
   SCRIPT KITTENS - Ultimate Premium Website v3.0
   Created by Furqan | 2026 Elite Design
   + Performance Optimized for all devices
================================================ */

// Force scroll to top immediately on page load
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

var _globalMouseX = 0, _globalMouseY = 0;
var _pageVisible = true;

// === PERFORMANCE TIER DETECTION ===
// Detects device capability and adjusts effects for buttery smoothness
var _perfTier = 'high'; // 'low', 'medium', 'high'
(function detectPerformanceTier() {
    var start = performance.now();
    // Quick benchmark: measure how fast the device can do math
    var sum = 0;
    for (var i = 0; i < 100000; i++) { sum += Math.sin(i) * Math.cos(i); }
    var elapsed = performance.now() - start;

    // Check hardware concurrency and memory
    var cores = navigator.hardwareConcurrency || 2;
    var memory = navigator.deviceMemory || 4; // GB, defaults to 4 if unavailable
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Score: lower is better
    var score = elapsed;
    if (cores <= 2) score += 20;
    if (memory <= 2) score += 20;
    if (isMobile) score += 15;

    // STRICTER THRESHOLDS for "Buttery Smoothness"
    // We default to 'medium' for most laptops to ensure 60fps
    if (score > 35) _perfTier = 'low';
    else if (score > 12) _perfTier = 'medium'; // Expanded medium range
    else _perfTier = 'high'; // Only top-tier gaming PCs get high

    // Manual override if device has few cores irrespective of benchmark
    if (cores < 4) _perfTier = 'low';
    else if (cores < 8) _perfTier = _perfTier === 'high' ? 'medium' : _perfTier;

    console.log('[ScriptKittens] Performance tier: ' + _perfTier + ' (score: ' + score.toFixed(1) + ', cores: ' + cores + ', mem: ' + memory + 'GB)');
})();

document.addEventListener('DOMContentLoaded', () => {
    // Scroll to top on page load/refresh
    window.scrollTo(0, 0);

    // Page Visibility API - pause animations when tab is hidden
    document.addEventListener('visibilitychange', () => {
        _pageVisible = !document.hidden;
    });

    // Single consolidated mousemove listener with throttling
    let mouseMoveTimeout;
    document.addEventListener('mousemove', (e) => {
        _globalMouseX = e.clientX;
        _globalMouseY = e.clientY;

        if (!mouseMoveTimeout) {
            mouseMoveTimeout = setTimeout(() => {
                mouseMoveTimeout = null;
            }, 20); // Throttle to 50fps
        }
    }, { passive: true });

    // Initialize all modules
    initPreloader();

    // Add layout containment to sections for performance isolation
    document.querySelectorAll('section').forEach(el => {
        el.style.contain = 'content';
    });

    // For low-end devices, reduce CSS blur effects that kill GPU
    if (_perfTier === 'low') {
        document.documentElement.classList.add('perf-low');
    } else if (_perfTier === 'medium') {
        document.documentElement.classList.add('perf-medium');
    }

    try { initTopControls(); } catch (e) { console.error('initTopControls error:', e); }

    initLenisScroll();
    initCursor();

    // Particles: always init but count varies by tier
    initParticles();

    // Three.js: DISABLED — WebGL rendering every frame is a major lag source
    // The wireframe shapes are barely visible but cost massive GPU time
    // To re-enable: change 'false' to '_perfTier === "high"'
    if (false) {
        init3DScene();
    }

    initSidePanel();
    initUserProfile();
    initCounters();
    initScrollAnimations();

    // Tilt: skip on medium/low (creates many GSAP tweens)
    if (_perfTier === 'high') {
        initTiltEffect();
    }

    initLogoCarousel();
    initProductShowcase();
    initPageTransition();
    preventZoom();
});

document.addEventListener('DOMContentLoaded', () => {
    const lb = document.getElementById('loginBtn');
    if (lb && !lb._loginAttached) {
        lb._loginAttached = true;
        lb.addEventListener('click', () => {
            // Redirect to the dedicated login page
            window.location.href = 'https://login.script-kittens.com';
        });
    }
});

/* ============ PREVENT USER ZOOM/SCALING ============ */
function preventZoom() {
    // Prevent pinch zoom on touch devices
    document.addEventListener('touchstart', function (e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // Prevent keyboard zoom (Ctrl/Cmd + Plus/Minus/0)
    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) &&
            (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
            e.preventDefault();
        }
    }, { passive: false });

    // Prevent mouse wheel zoom (Ctrl/Cmd + Wheel)
    document.addEventListener('wheel', function (e) {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
        }
    }, { passive: false });

    // Prevent gesture zoom on trackpad
    document.addEventListener('gesturestart', function (e) {
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('gesturechange', function (e) {
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('gestureend', function (e) {
        e.preventDefault();
    }, { passive: false });
}

/* ============ LOGO GIF CAROUSEL ============ */
function initLogoCarousel() {
    const gifs = document.querySelectorAll('.logo-gif');
    if (gifs.length === 0) return;

    let currentIndex = 0;

    setInterval(() => {
        // Remove active from current
        gifs[currentIndex].classList.remove('active');

        // Move to next
        currentIndex = (currentIndex + 1) % gifs.length;

        // Add active to new
        gifs[currentIndex].classList.add('active');
    }, 5000); // Change every 5 seconds
}

/* ============ LENIS SMOOTH SCROLL ============ */
function initLenisScroll() {
    if (typeof Lenis === 'undefined') return;

    // Disable Lenis on mobile/touch — use native scroll instead
    if (window.innerWidth <= 768 || 'ontouchstart' in window) return;

    const lenis = new Lenis({
        duration: 1.0,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        smoothTouch: false,
        touchMultiplier: 2,
        wheelMultiplier: 1.2,
        lerp: 0.08,
        infinite: false,
        syncTouch: true,
        syncTouchLerp: 0.1,
    });

    // Integrate with GSAP ScrollTrigger
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);
    } else {
        // Only use manual RAF loop if GSAP is not available
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    // Make lenis accessible globally for anchor links
    window.lenis = lenis;
    window._isNavScrolling = false; // Flag to pause scrollspy during nav clicks

    // Handle anchor links with smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                window._isNavScrolling = true;

                // Get navbar height for offset
                const navbar = document.querySelector('.top-navbar');
                const navHeight = navbar ? navbar.offsetHeight + 20 : 80;

                lenis.scrollTo(target, {
                    offset: -navHeight,
                    duration: 1.2,
                    easing: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
                    onComplete: () => {
                        // Keep scrollspy paused long enough for IntersectionObserver to settle
                        setTimeout(() => { window._isNavScrolling = false; }, 800);
                    }
                });
            }
        });
    });
}

/* ============ PRELOADER — FULLSCREEN HERO TEAR ============ */
function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    // Skip if arriving via page transition
    if (sessionStorage.getItem('skipPreloader') === '1') {
        sessionStorage.removeItem('skipPreloader');
        preloader.classList.add('hidden');
        document.body.style.overflow = 'visible';
        return;
    }

    const seamFill = document.querySelector('.pl-seam-fill');

    // Organic progress — drives the vertical seam line fill
    let current = 0;
    let target = 0;
    let raf;
    let readyFired = false;

    function advanceTarget() {
        const remaining = 90 - target;
        if (remaining > 0) {
            target += remaining * (0.08 + Math.random() * 0.06);
            target = Math.min(target, 90);
        }
    }

    function tick() {
        current += (target - current) * 0.08;
        const pct = Math.min(Math.floor(current), 100);

        // Drive the seam fill height
        if (seamFill) seamFill.style.height = pct + '%';

        // Brighten image overlay at 70%
        if (pct >= 70 && !readyFired) {
            readyFired = true;
            preloader.classList.add('pl-ready');
        }

        raf = requestAnimationFrame(tick);
    }

    tick();
    const targetInterval = setInterval(advanceTarget, 220);

    function dismiss() {
        clearInterval(targetInterval);
        target = 100;
        current = 100;
        if (seamFill) seamFill.style.height = '100%';
        preloader.classList.add('pl-ready');

        // Brief pause at 100% then tear apart
        setTimeout(() => {
            cancelAnimationFrame(raf);
            preloader.classList.add('hidden');
            document.body.style.overflow = 'visible';
            setTimeout(() => preloader.remove(), 1000);
        }, 350);
    }

    window.addEventListener('load', () => {
        const elapsed = performance.now();
        const minTime = 1400;
        const wait = Math.max(0, minTime - elapsed);
        setTimeout(dismiss, wait);
    });

    // Hard fallback
    setTimeout(() => {
        if (document.getElementById('preloader')) dismiss();
    }, 4500);
}

/* ============ ULTRA-SMOOTH GPU-ACCELERATED CURSOR ============ */
function initCursor() {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    if (!cursorDot || !cursorOutline) return;

    let mouseX = 0, mouseY = 0;
    let dotX = 0, dotY = 0;
    let outlineX = 0, outlineY = 0;
    let lastSparkleTime = 0;

    // Increased speeds for smoother, more responsive cursor
    const dotSpeed = 0.65;      // Faster dot (was 0.5)
    const outlineSpeed = 0.2;   // Faster outline (was 0.15)

    // Glitter config - more symbols and colors
    const glitterColors = ['#ffffff', '#7c5cfc', '#a78bfa', '#d4d4d4', '#ECDFCC', '#c4b5fd', '#e0e0e0', '#8b8b8b'];
    const glitterSymbols = ['✦', '✧', '★', '✴', '❋', '✺', '✶', '⋆', '✸'];

    // === OPTIMIZED OBJECT POOL for glitter ===
    const POOL_SIZE = 30;
    const pool = [];
    const poolContainer = document.createElement('div');
    poolContainer.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:99997;will-change:transform;';
    document.body.appendChild(poolContainer);

    for (let i = 0; i < POOL_SIZE; i++) {
        const el = document.createElement('span');
        el.style.cssText = 'position:fixed;pointer-events:none;opacity:0;will-change:transform,opacity;backface-visibility:hidden;';
        poolContainer.appendChild(el);
        pool.push(el);
    }

    let poolIndex = 0;
    function getPooledGlitter() {
        const el = pool[poolIndex];
        poolIndex = (poolIndex + 1) % POOL_SIZE;
        return el;
    }

    // Glitter trail — DISABLED for performance
    // The setInterval + RAF + forced reflows (void g.offsetWidth) were killing scroll smoothness
    // Cursor dot/outline still animate smoothly without glitter
    /*
    let _cursorGlitterRafId = null;
    function _updateCursorFromGlobal() {
        mouseX = _globalMouseX;
        mouseY = _globalMouseY;
        const now = Date.now();
        if (now - lastSparkleTime > 100) {
            showGlitter(mouseX, mouseY);
            lastSparkleTime = now;
        }
        _cursorGlitterRafId = null;
    }
    setInterval(() => {
        if (!_cursorGlitterRafId) {
            _cursorGlitterRafId = requestAnimationFrame(_updateCursorFromGlobal);
        }
    }, 16);
    */
    // Simple mouse tracking without glitter overhead
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }, { passive: true });

    // Click - glitter burst
    document.addEventListener('click', (e) => {
        createGlitterBurst(e.clientX, e.clientY);
    }, { passive: true });

    // Reuse pooled element for trail glitter with GPU acceleration
    function showGlitter(x, y) {
        const g = getPooledGlitter();
        const color = glitterColors[Math.floor(Math.random() * glitterColors.length)];
        g.textContent = glitterSymbols[Math.floor(Math.random() * glitterSymbols.length)];
        g.style.transition = 'none';
        g.style.left = (x + (Math.random() - 0.5) * 24) + 'px';
        g.style.top = (y + (Math.random() - 0.5) * 24) + 'px';
        g.style.color = color;
        g.style.fontSize = (10 + Math.random() * 8) + 'px';
        g.style.textShadow = '0 0 8px ' + color + ', 0 0 16px ' + color;
        g.style.opacity = '1';
        g.style.transform = 'scale(1) rotate(0deg)';

        // Force reflow to reset transition
        void g.offsetWidth;

        // Animate out with GPU acceleration
        g.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        g.style.opacity = '0';
        g.style.transform = 'scale(0) rotate(140deg) translateY(-25px)';
    }

    // Click burst - 12 glitter symbols with GPU acceleration
    function createGlitterBurst(x, y) {
        const burstCount = 12;
        for (let i = 0; i < burstCount; i++) {
            const angle = (i / burstCount) * Math.PI * 2;
            const dist = 30 + Math.random() * 45;
            const g = getPooledGlitter();
            const color = glitterColors[Math.floor(Math.random() * glitterColors.length)];
            const targetX = Math.cos(angle) * dist;
            const targetY = Math.sin(angle) * dist;

            g.textContent = glitterSymbols[Math.floor(Math.random() * glitterSymbols.length)];
            g.style.transition = 'none';
            g.style.left = x + 'px';
            g.style.top = y + 'px';
            g.style.color = color;
            g.style.fontSize = (10 + Math.random() * 8) + 'px';
            g.style.textShadow = '0 0 10px ' + color + ', 0 0 20px ' + color;
            g.style.opacity = '1';
            g.style.transform = 'scale(1)';

            void g.offsetWidth;

            g.style.transition = 'all 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            g.style.left = (x + targetX) + 'px';
            g.style.top = (y + targetY) + 'px';
            g.style.opacity = '0';
            g.style.transform = 'scale(0) rotate(' + (Math.random() * 180) + 'deg)';
        }
    }

    // Ultra-smooth cursor movement with proper positioning
    function animateCursor() {
        if (!_pageVisible) {
            requestAnimationFrame(animateCursor);
            return;
        }

        dotX += (mouseX - dotX) * dotSpeed;
        dotY += (mouseY - dotY) * dotSpeed;
        // GPU-accelerated positioning via transform
        cursorDot.style.transform = 'translate3d(' + (dotX - 5) + 'px, ' + (dotY - 5) + 'px, 0)';

        outlineX += (mouseX - outlineX) * outlineSpeed;
        outlineY += (mouseY - outlineY) * outlineSpeed;
        // GPU-accelerated positioning via transform
        cursorOutline.style.transform = 'translate3d(' + (outlineX - 20) + 'px, ' + (outlineY - 20) + 'px, 0)';

        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover effects on interactive elements - passive listeners
    const hoverSelector = 'a, button, .product-card, .product-card-new, .feature-card, .pricing-card, .nav-link, .card-cta, .product-btn, .cc-action-btn, .cc-tab, .cheat-card, .stat-card';
    document.querySelectorAll(hoverSelector).forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorDot.classList.add('hover');
            cursorOutline.classList.add('hover');
        }, { passive: true });
        el.addEventListener('mouseleave', () => {
            cursorDot.classList.remove('hover');
            cursorOutline.classList.remove('hover');
        }, { passive: true });
    });

    // Click active state - passive listeners
    document.addEventListener('mousedown', () => {
        cursorDot.classList.add('active');
        cursorOutline.classList.add('active');
    }, { passive: true });
    document.addEventListener('mouseup', () => {
        cursorDot.classList.remove('active');
        cursorOutline.classList.remove('active');
    }, { passive: true });
}

/* ============ DALA-STYLE FLOATING TRIANGLE PARTICLES ============ */
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = window.innerWidth;
    let h = window.innerHeight;

    function resizeCanvas() {
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();

    var mouse = { x: 0.5, y: 0.5, smoothX: 0.5, smoothY: 0.5 };

    window.addEventListener('resize', resizeCanvas);

    var bgEffects = document.querySelector('.bg-effects');
    var bgGrid = document.querySelector('.bg-grid');

    var colors = [
        { r: 255, g: 255, b: 255 },  /* white */
        { r: 124, g: 92, b: 252 },   /* purple */
        { r: 167, g: 139, b: 250 },  /* light purple */
        { r: 200, g: 200, b: 200 },  /* light grey */
        { r: 150, g: 150, b: 150 },  /* grey */
        { r: 100, g: 100, b: 100 },  /* dark grey */
        { r: 236, g: 223, b: 204 },  /* cream */
        { r: 180, g: 180, b: 180 }   /* silver */
    ];

    var particles = [];
    // Particle count — REDUCED for smoothness (was 40/25/15)
    var particleCount = _perfTier === 'low' ? 8 : (_perfTier === 'medium' ? 12 : 15);

    function createParticle() {
        var color = colors[Math.floor(Math.random() * colors.length)];
        var size = Math.random() * 12 + 4;
        var type = Math.random();
        var depth = Math.random();
        return {
            x: Math.random() * (w + 200) - 100,
            y: Math.random() * (h + 200) - 100,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: size * (0.5 + depth * 0.8),
            color: color,
            opacity: (0.08 + depth * 0.35),
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.012,
            type: type < 0.6 ? 'triangle' : (type < 0.8 ? 'diamond' : 'circle'),
            filled: Math.random() < 0.3,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.015 + 0.005,
            depth: depth,
            glowSize: Math.random() * 6 + 2
        };
    }

    for (var i = 0; i < particleCount; i++) {
        particles.push(createParticle());
    }

    function drawTriangle(x, y, size, rotation, filled) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size * 0.866, size * 0.5);
        ctx.lineTo(size * 0.866, size * 0.5);
        ctx.closePath();
        if (filled) ctx.fill();
        else ctx.stroke();
        ctx.restore();
    }

    function drawDiamond(x, y, size, rotation, filled) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.6, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size * 0.6, 0);
        ctx.closePath();
        if (filled) ctx.fill();
        else ctx.stroke();
        ctx.restore();
    }

    function animate() {
        if (!_pageVisible) { requestAnimationFrame(animate); return; }

        // Frame-skip for low-end devices (30fps instead of 60fps)
        if (_perfTier === 'low') {
            if (!animate._skip) { animate._skip = true; requestAnimationFrame(animate); return; }
            animate._skip = false;
        }

        ctx.clearRect(0, 0, w, h);

        mouse.x = w > 0 ? _globalMouseX / w : 0.5;
        mouse.y = h > 0 ? _globalMouseY / h : 0.5;

        mouse.smoothX += (mouse.x - mouse.smoothX) * 0.04;
        mouse.smoothY += (mouse.y - mouse.smoothY) * 0.04;

        var camX = (mouse.smoothX - 0.5) * 2;
        var camY = (mouse.smoothY - 0.5) * 2;

        // bg-effects and bg-grid parallax handled by GSAP ScrollTrigger — no competing transforms here

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];

            p.pulse += p.pulseSpeed;
            var pulseFactor = 0.85 + Math.sin(p.pulse) * 0.15;

            p.x += p.vx;
            p.y += p.vy;
            p.vx += (Math.random() - 0.5) * 0.01;
            p.vy += (Math.random() - 0.5) * 0.01;
            p.vx *= 0.99;
            p.vy *= 0.99;

            var margin = 80;
            if (p.x < -margin) p.x = w + margin;
            if (p.x > w + margin) p.x = -margin;
            if (p.y < -margin) p.y = h + margin;
            if (p.y > h + margin) p.y = -margin;

            p.rotation += p.rotSpeed;

            var parallaxStrength = 40 + p.depth * 60;
            var drawX = p.x + camX * parallaxStrength;
            var drawY = p.y + camY * parallaxStrength;

            var currentSize = p.size * pulseFactor;
            var c = p.color;
            var alpha = p.opacity * pulseFactor;

            // Skip expensive shadowBlur — use brighter colors for glow effect instead
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            ctx.lineWidth = p.depth > 0.5 ? 1.5 : 1;
            ctx.strokeStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha + ')';
            ctx.fillStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (alpha * 0.5) + ')';
            if (p.type === 'triangle') {
                drawTriangle(drawX, drawY, currentSize, p.rotation, p.filled);
            } else if (p.type === 'diamond') {
                drawDiamond(drawX, drawY, currentSize, p.rotation, p.filled);
            } else {
                ctx.beginPath();
                ctx.arc(drawX, drawY, currentSize * 0.35, 0, Math.PI * 2);
                if (p.filled) ctx.fill();
                else ctx.stroke();
            }
        }

        requestAnimationFrame(animate);
    }
    animate();
}

/* ============ THREE.JS 3D SCENE ============ */
function init3DScene() {
    const container = document.getElementById('three-container');
    if (!container || typeof THREE === 'undefined') return;

    // Setup - optimized for performance
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false, // Disabled for massive GPU savings — barely visible difference
        powerPreference: 'high-performance'
    });

    const pixelRatio = Math.min(window.devicePixelRatio || 1, _perfTier === 'high' ? 2 : 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Create floating shapes - reduced count based on perf tier
    const shapes = [];
    const geometries = [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.TetrahedronGeometry(1, 0)
    ];

    const shapeCount = _perfTier === 'medium' ? 4 : 6;

    for (let i = 0; i < shapeCount; i++) {
        const geometry = geometries[Math.floor(Math.random() * geometries.length)];
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(Math.random() * 0.2 + 0.7, 1, 0.5),
            wireframe: true,
            transparent: true,
            opacity: 0.12
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 30 - 10
        );
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        mesh.userData = {
            rotSpeed: { x: (Math.random() - 0.5) * 0.01, y: (Math.random() - 0.5) * 0.01 },
            floatSpeed: Math.random() * 0.3 + 0.3,
            floatOffset: Math.random() * Math.PI * 2
        };

        scene.add(mesh);
        shapes.push(mesh);
    }

    camera.position.z = 20;

    // Mouse movement - reads from global mouse
    let mouseX = 0, mouseY = 0;

    // Animation - throttled
    let time = 0;
    function animate() {
        if (!_pageVisible) { requestAnimationFrame(animate); return; }
        mouseX = (_globalMouseX / window.innerWidth - 0.5) * 2;
        mouseY = (_globalMouseY / window.innerHeight - 0.5) * 2;
        time += 0.008;

        shapes.forEach(shape => {
            shape.rotation.x += shape.userData.rotSpeed.x;
            shape.rotation.y += shape.userData.rotSpeed.y;
            shape.position.y += Math.sin(time * shape.userData.floatSpeed + shape.userData.floatOffset) * 0.01;
        });

        camera.position.x += (mouseX * 4 - camera.position.x) * 0.03;
        camera.position.y += (-mouseY * 4 - camera.position.y) * 0.03;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

/* ============ TOP NAVBAR WITH SCROLL SPY ============ */
function initSidePanel() {
    const navbar = document.getElementById('topNavbar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('navMobileMenu');

    // Navbar scroll effect — transforms to floating glass pill
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    // Mobile hamburger toggle
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
            mobileMenuBtn.classList.toggle('open');
        });
    }

    // Close mobile menu when link clicked
    document.querySelectorAll('.nav-mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            if (mobileMenu) mobileMenu.classList.remove('open');
            if (mobileMenuBtn) mobileMenuBtn.classList.remove('open');
        });
    });

    // ── SCROLL SPY — Proper IntersectionObserver-based system ──
    const sections = document.querySelectorAll('section[id], div[id].hero, .hero[id]');
    const navLinks = document.querySelectorAll('.nav-link[data-section], .nav-mobile-link[data-section]');

    // Cache: sectionId → nav link elements (avoid repeated querySelector in hot path)
    const navMap = {};
    navLinks.forEach(link => {
        const s = link.getAttribute('data-section');
        if (!navMap[s]) navMap[s] = [];
        navMap[s].push(link);
    });

    // Cache sections that have nav links
    const trackedSections = [];
    sections.forEach(sec => { if (navMap[sec.id]) trackedSections.push(sec); });

    function setActiveNav(sectionId) {
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-section') === sectionId);
        });
    }

    function clearActiveNav() {
        navLinks.forEach(link => link.classList.remove('active'));
    }

    // No default active — hero section has no nav link

    const sectionVisibility = {};

    // Track which section the user explicitly clicked
    window._navClickedSection = null;

    const observer = new IntersectionObserver((entries) => {
        // Always update ratios — but NEVER act on them during a nav scroll
        entries.forEach(entry => {
            sectionVisibility[entry.target.id] = entry.intersectionRatio;
        });

        if (window._isNavScrolling) return;

        if (window.scrollY < 80) { clearActiveNav(); return; }

        // Use simple position-based detection — most reliable
        const scrollPos = window.scrollY + window.innerHeight * 0.35;
        let best = null;
        trackedSections.forEach(sec => {
            if (sec.offsetTop <= scrollPos) best = sec.id;
        });

        if (best) setActiveNav(best);
        else clearActiveNav();
    }, {
        threshold: [0, 0.1, 0.3, 0.5, 0.7, 1.0],
        rootMargin: '0px 0px -20% 0px'
    });

    trackedSections.forEach(sec => observer.observe(sec));

    // Scroll-based fallback — only acts when NOT nav-scrolling
    let rafPending = false;
    window.addEventListener('scroll', () => {
        if (window._isNavScrolling || rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => {
            rafPending = false;
            if (window.scrollY < 80) { clearActiveNav(); return; }
            const scrollPos = window.scrollY + window.innerHeight * 0.35;
            let best = null;
            trackedSections.forEach(sec => {
                if (sec.offsetTop <= scrollPos) best = sec.id;
            });
            if (best) setActiveNav(best);
            else clearActiveNav();
        });
    }, { passive: true });

    // Nav link click — set active immediately AND lock scrollspy
    navLinks.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const s = tab.getAttribute('data-section');
            if (s) {
                // Lock scrollspy FIRST — before any scroll begins
                window._isNavScrolling = true;
                window._navClickedSection = s;
                setActiveNav(s);

                // Scroll to the section ourselves (prevents double-handling by anchor listener)
                const targetEl = document.getElementById(s);
                if (targetEl && window.lenis) {
                    e.preventDefault();
                    const navbar = document.querySelector('.top-navbar');
                    const navHeight = navbar ? navbar.offsetHeight + 20 : 80;
                    window.lenis.scrollTo(targetEl, {
                        offset: -navHeight,
                        duration: 1.2,
                        easing: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
                        onComplete: () => {
                            // Set the active state one final time to the target
                            setActiveNav(s);
                            // Keep locked until observer settles
                            setTimeout(() => {
                                window._isNavScrolling = false;
                                window._navClickedSection = null;
                            }, 1200);
                        }
                    });
                }
            }
            if (mobileMenu) mobileMenu.classList.remove('open');
            const spans = mobileMenuBtn && mobileMenuBtn.querySelectorAll('span');
            if (spans) { spans[0].style.transform = ''; spans[1].style.opacity = ''; spans[2].style.transform = ''; }
        });
    });

    // Add ripple animation style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to { transform: scale(30); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

/* ============ COUNTER ANIMATION ============ */
function initCounters() {
    const counters = document.querySelectorAll('.counter');
    const proofValues = document.querySelectorAll('.hero-proof-value[data-count]');

    const animateCounter = (counter) => {
        const target = parseInt(counter.dataset.target || counter.dataset.count);
        const duration = 2000;
        const start = 0;
        const startTime = performance.now();

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);

            counter.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };

        requestAnimationFrame(updateCounter);
    };

    // Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
    proofValues.forEach(val => observer.observe(val));
}

/* ============ SCROLL ANIMATIONS ============ */
function initScrollAnimations() {
    // Check if GSAP is available
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        initBasicScrollAnimations();
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // --- HERO REVEAL ANIMATION ---
    const heroTl = gsap.timeline({ delay: 2.6 });

    // Image slides in from right
    heroTl.fromTo('.hero-right',
        { x: 60, opacity: 0 },
        { x: 0, opacity: 1, duration: 1, ease: 'power3.out' }
    );
    // Label fades in
    heroTl.fromTo('.hero-label',
        { y: -10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
        '-=0.7'
    );
    // Title reveals
    heroTl.fromTo('.hero-title',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power4.out' },
        '-=0.4'
    );
    // Subtitle fades up
    heroTl.fromTo('.hero-subtitle',
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.5'
    );
    // Buttons stagger in
    heroTl.fromTo('.hero-cta-group a',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.1 },
        '-=0.4'
    );
    // Proof stats
    heroTl.fromTo('.hero-proof',
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
        '-=0.3'
    );

    // Hero 3D section entrance
    gsap.from('.hero-3d-section', {
        x: 100,
        opacity: 0,
        duration: 1.5,
        ease: 'power4.out',
        delay: 3
    });

    // ============ COMMAND CENTER INTERACTIVITY ============
    // Track CC visibility — pause all intervals when off-screen (huge CPU savings)
    let _ccVisible = true;
    const ccVisibilityEl = document.querySelector('.hero-3d-section') || document.getElementById('commandCenter');
    if (ccVisibilityEl) {
        const ccObserver = new IntersectionObserver((entries) => {
            _ccVisible = entries[0].isIntersecting;
        }, { threshold: 0 });
        ccObserver.observe(ccVisibilityEl);
    }

    // --- Mouse tilt on command center ---
    const ccEl = document.getElementById('commandCenter');
    if (ccEl) {
        const ccParent = ccEl.closest('.hero-3d-section');
        if (ccParent) {
            ccParent.addEventListener('mousemove', (e) => {
                const rect = ccParent.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                gsap.to(ccEl, {
                    rotateY: x * 10,
                    rotateX: -y * 6,
                    duration: 0.5,
                    ease: 'power2.out'
                });
            }, { passive: true });
            ccParent.addEventListener('mouseleave', () => {
                gsap.to(ccEl, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
            });
        }
    }

    // === INTERACTIVE TAB SWITCHING ===
    const tabs = document.querySelectorAll('.cc-tab');
    const panels = document.querySelectorAll('.cc-tab-panel');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const targetPanel = document.querySelector(`.cc-tab-panel[data-panel="${target}"]`);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });

    // --- Terminal typing loop ---
    const terminalBody = document.getElementById('terminalBody');
    const typingLine = document.getElementById('typingLine');
    if (terminalBody && typingLine) {
        const commands = [
            {
                cmd: 'load --module esp --type box',
                flags: ['--module', '--type'],
                response: { type: 'success', icon: 'fa-eye', text: 'ESP Box overlay activated' }
            },
            {
                cmd: 'status --check antiban',
                flags: ['--check'],
                response: { type: 'success', icon: 'fa-shield-alt', text: 'Anti-ban shield — integrity 100%' }
            },
            {
                cmd: 'connect --server asia-sg2',
                flags: ['--server'],
                response: { type: 'info', icon: 'fa-wifi', text: 'Connected — ping 8ms, packet loss 0%' }
            },
            {
                cmd: 'update --force --silent',
                flags: ['--force', '--silent'],
                response: { type: 'success', icon: 'fa-download', text: 'Updated to v4.2.1 — changelog loaded' }
            },
            {
                cmd: 'deploy --module chams --skin rgb',
                flags: ['--module', '--skin'],
                response: { type: 'success', icon: 'fa-palette', text: 'RGB Chams deployed — glow enabled' }
            },
            {
                cmd: 'scan --lobby --players',
                flags: ['--lobby', '--players'],
                response: { type: 'info', icon: 'fa-search', text: 'Scanning... 52 players found in lobby' }
            },
            {
                cmd: 'config --preset tournament',
                flags: ['--preset'],
                response: { type: 'success', icon: 'fa-trophy', text: 'Tournament preset loaded — all limits active' }
            },
            {
                cmd: 'boost --fps --unlimited',
                flags: ['--fps', '--unlimited'],
                response: { type: 'success', icon: 'fa-tachometer-alt', text: 'FPS Boost engaged — running at 120fps' }
            },
            {
                cmd: 'stealth --mode ghost',
                flags: ['--mode'],
                response: { type: 'success', icon: 'fa-ghost', text: 'Ghost mode active — completely invisible' }
            },
            {
                cmd: 'health --regen --speed fast',
                flags: ['--regen', '--speed'],
                response: { type: 'success', icon: 'fa-heartbeat', text: 'Auto-regen enabled — healing 200hp/s' }
            }
        ];
        let cmdIndex = 0;

        function typeCommand() {
            if (!_ccVisible || document.hidden) { setTimeout(typeCommand, 2500); return; }
            const { cmd, flags, response } = commands[cmdIndex % commands.length];
            cmdIndex++;
            let charIdx = 0;
            typingLine.innerHTML = '<span class="cc-prompt">❯</span> <span class="cc-cursor">|</span>';

            const typingInterval = setInterval(() => {
                if (charIdx < cmd.length) {
                    let currentText = cmd.substring(0, charIdx + 1);
                    let colored = currentText;
                    flags.forEach(f => {
                        colored = colored.replace(f, '<span class="cc-flag">' + f + '</span>');
                    });
                    colored = colored.replace(/^(\S+)/, '<span class="cc-cmd">$1</span>');
                    typingLine.innerHTML = '<span class="cc-prompt">❯</span> ' + colored + '<span class="cc-cursor">|</span>';
                    charIdx++;
                } else {
                    clearInterval(typingInterval);
                    setTimeout(() => {
                        let finalCmd = cmd;
                        flags.forEach(f => {
                            finalCmd = finalCmd.replace(f, '<span class="cc-flag">' + f + '</span>');
                        });
                        finalCmd = finalCmd.replace(/^(\S+)/, '<span class="cc-cmd">$1</span>');

                        const cmdLine = document.createElement('div');
                        cmdLine.className = 'cc-line';
                        cmdLine.innerHTML = '<span class="cc-prompt">❯</span> ' + finalCmd;
                        terminalBody.insertBefore(cmdLine, typingLine);

                        const resLine = document.createElement('div');
                        resLine.className = 'cc-line cc-line--' + response.type;
                        resLine.innerHTML = '<i class="fas ' + response.icon + '"></i> ' + response.text;
                        resLine.style.opacity = '0';
                        terminalBody.insertBefore(resLine, typingLine);
                        gsap.to(resLine, { opacity: 1, duration: 0.3, delay: 0.1 });

                        typingLine.innerHTML = '<span class="cc-prompt">❯</span> <span class="cc-cursor">|</span>';
                        terminalBody.scrollTop = terminalBody.scrollHeight;

                        const allLines = terminalBody.querySelectorAll('.cc-line:not(.cc-line--typing):not(.cc-line--ascii)');
                        if (allLines.length > 14) {
                            allLines[0].remove();
                            allLines[1].remove();
                        }

                        setTimeout(typeCommand, 2500);
                    }, 400);
                }
            }, 45 + Math.random() * 25);
        }

        setTimeout(typeCommand, 4500);
    }

    // === INTERACTIVE ACTION BUTTONS ===
    const actionBtns = document.querySelectorAll('.cc-action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Optimized ripple effect
            const ripple = document.createElement('span');
            ripple.className = 'cc-ripple';
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 1.5;
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            btn.appendChild(ripple);
            setTimeout(() => ripple.remove(), 400);

            // Execute the command in terminal
            const cmd = btn.dataset.cmd;
            if (terminalBody && typingLine) {
                const cmdLine = document.createElement('div');
                cmdLine.className = 'cc-line';
                let coloredCmd = cmd.replace(/--\S+/g, '<span class="cc-flag">$&</span>');
                coloredCmd = coloredCmd.replace(/^(\S+)/, '<span class="cc-cmd">$1</span>');
                cmdLine.innerHTML = '<span class="cc-prompt">❯</span> ' + coloredCmd;
                terminalBody.insertBefore(cmdLine, typingLine);

                // Generate response
                const responses = {
                    'help': { type: 'info', icon: 'fa-book', text: 'Available: load, scan, deploy, connect, status, config, boost, stealth' },
                    'status': { type: 'success', icon: 'fa-check-circle', text: 'All 7 modules active — system healthy — no threats detected' },
                    'deploy --all': { type: 'success', icon: 'fa-rocket', text: 'Deploying all modules... 7/7 activated successfully' },
                    'scan --lobby': { type: 'info', icon: 'fa-search', text: 'Scanning lobby... ' + (40 + Math.floor(Math.random() * 20)) + ' players found' },
                    'boost --fps': { type: 'success', icon: 'fa-tachometer-alt', text: 'FPS Boost MAX — running at ' + (90 + Math.floor(Math.random() * 50)) + ' fps' }
                };
                const res = responses[cmd] || { type: 'success', icon: 'fa-check', text: 'Command executed successfully' };

                setTimeout(() => {
                    const resLine = document.createElement('div');
                    resLine.className = 'cc-line cc-line--' + res.type;
                    resLine.innerHTML = '<i class="fas ' + res.icon + '"></i> ' + res.text;
                    resLine.style.opacity = '0';
                    terminalBody.insertBefore(resLine, typingLine);
                    gsap.to(resLine, { opacity: 1, duration: 0.3 });
                    terminalBody.scrollTop = terminalBody.scrollHeight;
                }, 200);

                // Switch to main tab
                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));
                document.querySelector('.cc-tab[data-tab="main"]')?.classList.add('active');
                document.querySelector('.cc-tab-panel[data-panel="main"]')?.classList.add('active');
            }
        });
    });

    // === LIVE LOGS TAB ===
    const logsBody = document.getElementById('logsBody');
    if (logsBody) {
        const logMessages = [
            { level: 'info', msg: 'Heartbeat sent — server acknowledged' },
            { level: 'ok', msg: 'Module integrity check passed' },
            { level: 'info', msg: 'Player position updated — delta 0.03ms' },
            { level: 'warn', msg: 'High memory usage detected — 78% utilized' },
            { level: 'ok', msg: 'Anti-cheat bypass refreshed — token valid' },
            { level: 'info', msg: 'Packet encryption rotated — AES-256-GCM' },
            { level: 'ok', msg: 'ESP overlay rendered — 48 entities tracked' },
            { level: 'info', msg: 'Server keepalive — latency 9ms' },
            { level: 'warn', msg: 'GPU temp elevated — 72°C' },
            { level: 'ok', msg: 'Aim correction applied — deviation 0.02°' },
            { level: 'info', msg: 'Lobby sync complete — 52 players loaded' },
            { level: 'err', msg: 'Connection timeout — retrying in 2s...' },
            { level: 'ok', msg: 'Reconnected successfully — session restored' },
            { level: 'info', msg: 'Skin changer applied — 3 custom skins active' },
            { level: 'ok', msg: 'Speed hack within safe limits — ratio 1.08x' },
        ];
        let logIdx = 0;

        function addLogEntry() {
            if (!_ccVisible) return;
            const log = logMessages[logIdx % logMessages.length];
            logIdx++;
            const now = new Date();
            const time = now.toLocaleTimeString('en-US', { hour12: false });

            const el = document.createElement('div');
            el.className = 'cc-log-entry';
            el.innerHTML = `
                <span class="cc-log-time">${time}</span>
                <span class="cc-log-level ${log.level}">${log.level.toUpperCase()}</span>
                <span class="cc-log-msg">${log.msg}</span>
            `;
            logsBody.appendChild(el);
            logsBody.scrollTop = logsBody.scrollHeight;

            // Keep max 20 entries
            while (logsBody.children.length > 20) {
                logsBody.children[1].remove(); // keep the comment header
            }
        }

        // Add log entries periodically
        setTimeout(() => {
            addLogEntry();
            setInterval(addLogEntry, 2500);
        }, 3000);
    }

    // === MONITOR TAB — WAVE CANVAS (Optimized) ===
    const waveCanvas = document.getElementById('waveCanvas');
    if (waveCanvas) {
        const ctx = waveCanvas.getContext('2d');
        let wavePhase = 0;
        const waveData = [];
        for (let i = 0; i < 100; i++) waveData.push(40 + Math.random() * 20);

        // Pre-cache the gradient (recreating every frame was a major GC pressure source)
        let cachedGrad = null;
        let cachedH = 0;
        function getWaveGradient(h) {
            if (cachedGrad && cachedH === h) return cachedGrad;
            cachedH = h;
            cachedGrad = ctx.createLinearGradient(0, 0, 0, h);
            cachedGrad.addColorStop(0, 'rgba(124, 92, 252, 0.08)');
            cachedGrad.addColorStop(1, 'rgba(124, 92, 252, 0.01)');
            return cachedGrad;
        }

        // Only animate when the monitor tab is visible (IntersectionObserver)
        let waveVisible = false;
        const waveObserver = new IntersectionObserver((entries) => {
            waveVisible = entries[0].isIntersecting;
        }, { threshold: 0 });
        waveObserver.observe(waveCanvas);

        function drawWave() {
            if (!_pageVisible || !waveVisible) { requestAnimationFrame(drawWave); return; }

            const w = waveCanvas.width;
            const h = waveCanvas.height;
            ctx.clearRect(0, 0, w, h);

            waveData.push(30 + Math.random() * 40 + Math.sin(wavePhase * 0.05) * 10);
            if (waveData.length > 100) waveData.shift();
            wavePhase++;

            // Draw wave — single pass (removed duplicate stroke with shadowBlur)
            ctx.beginPath();
            for (let i = 0; i < waveData.length; i++) {
                const x = (i / (waveData.length - 1)) * w;
                const y = h - (waveData[i] / 80) * h;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = 'rgba(124, 92, 252, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Fill under curve
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fillStyle = getWaveGradient(h);
            ctx.fill();

            requestAnimationFrame(drawWave);
        }
        drawWave();
    }

    // === MONITOR BAR ANIMATIONS ===
    const monitorBars = document.querySelectorAll('.cc-monitor-bar__fill');
    monitorBars.forEach(bar => {
        const val = parseInt(bar.dataset.val);
        bar.style.width = val + '%';
    });

    // Fluctuate monitor values — only when CC is visible
    setInterval(() => {
        if (document.hidden || !_ccVisible) return;
        const cpuEl = document.getElementById('monCpu');
        const ramEl = document.getElementById('monRam');
        const gpuEl = document.getElementById('monGpu');
        const netEl = document.getElementById('monNet');
        const latEl = document.getElementById('monLatency');

        if (cpuEl) {
            const v = 15 + Math.floor(Math.random() * 25);
            cpuEl.textContent = v + '%';
            const bar = cpuEl.closest('.cc-monitor-card')?.querySelector('.cc-monitor-bar__fill');
            if (bar) bar.style.width = v + '%';
        }
        if (ramEl) {
            const v = 35 + Math.floor(Math.random() * 20);
            ramEl.textContent = v + '%';
            const bar = ramEl.closest('.cc-monitor-card')?.querySelector('.cc-monitor-bar__fill');
            if (bar) bar.style.width = v + '%';
        }
        if (gpuEl) {
            const v = 55 + Math.floor(Math.random() * 25);
            gpuEl.textContent = v + '%';
            const bar = gpuEl.closest('.cc-monitor-card')?.querySelector('.cc-monitor-bar__fill');
            if (bar) bar.style.width = v + '%';
        }
        if (netEl) {
            const v = 20 + Math.floor(Math.random() * 30);
            netEl.textContent = v + '%';
            const bar = netEl.closest('.cc-monitor-card')?.querySelector('.cc-monitor-bar__fill');
            if (bar) bar.style.width = v + '%';
        }
        if (latEl) {
            latEl.textContent = (6 + Math.floor(Math.random() * 12)) + 'ms';
        }
    }, 3000);

    // === UPTIME COUNTER ===
    const uptimeEl = document.getElementById('ccUptime');
    if (uptimeEl) {
        let uptimeSeconds = 0;
        setInterval(() => {
            if (!_ccVisible) return;
            uptimeSeconds++;
            const h = String(Math.floor(uptimeSeconds / 3600)).padStart(2, '0');
            const m = String(Math.floor((uptimeSeconds % 3600) / 60)).padStart(2, '0');
            const s = String(uptimeSeconds % 60).padStart(2, '0');
            uptimeEl.textContent = `${h}:${m}:${s}`;
        }, 1000);
    }

    // --- Live ping jitter ---
    const pingEl = document.getElementById('pingValue');
    if (pingEl) {
        setInterval(() => {
            if (document.hidden || !_ccVisible) return;
            const ping = Math.floor(8 + Math.random() * 14);
            pingEl.textContent = ping + 'ms';
        }, 2000);
    }

    // --- Live online count ---
    const onlineEl = document.getElementById('onlineCount');
    if (onlineEl) {
        let onlineBase = 2847;
        setInterval(() => {
            if (!_ccVisible) return;
            onlineBase += Math.floor(Math.random() * 7) - 3;
            onlineBase = Math.max(2700, Math.min(3100, onlineBase));
            onlineEl.textContent = onlineBase.toLocaleString();
        }, 3000);
    }

    // --- Live notification toasts ---
    const notifsContainer = document.getElementById('ccNotifications');
    if (notifsContainer) {
        const notifications = [
            { icon: 'fa-user-plus', color: 'green', text: '<strong>Player_X</strong> joined lobby' },
            { icon: 'fa-rocket', color: 'purple', text: '<strong>Aimbot v3</strong> deployed' },
            { icon: 'fa-shield-alt', color: 'cyan', text: 'Anti-ban <strong>shield active</strong>' },
            { icon: 'fa-download', color: 'pink', text: 'Module <strong>updated</strong> to v4.2' },
            { icon: 'fa-check-circle', color: 'green', text: '<strong>ESP overlay</strong> enabled' },
            { icon: 'fa-bolt', color: 'purple', text: 'Speed hack <strong>engaged</strong>' },
            { icon: 'fa-globe', color: 'cyan', text: 'Server <strong>Asia-SG2</strong> connected' },
            { icon: 'fa-star', color: 'pink', text: '<strong>5-star</strong> review received' },
            { icon: 'fa-crown', color: 'purple', text: '<strong>Premium</strong> subscription activated' },
            { icon: 'fa-users', color: 'green', text: '<strong>50K+</strong> users milestone!' }
        ];
        const userNames = ['Shadow', 'Blaze', 'Kira', 'Nova', 'Ghost', 'Reaper', 'Venom', 'Storm', 'Hawk', 'Phoenix'];
        let notifIdx = 0;

        function spawnNotification() {
            if (!_ccVisible || document.hidden) return;
            const n = notifications[notifIdx % notifications.length];
            notifIdx++;
            let text = n.text.replace('Player_X', userNames[Math.floor(Math.random() * userNames.length)]);

            const el = document.createElement('div');
            el.className = 'cc-notif';
            el.innerHTML = `
                <div class="cc-notif__icon ${n.color}"><i class="fas ${n.icon}"></i></div>
                <div class="cc-notif__text">${text}</div>
            `;
            notifsContainer.appendChild(el);
            setTimeout(() => { if (el.parentNode) el.remove(); }, 4500);
            while (notifsContainer.children.length > 3) {
                notifsContainer.firstChild.remove();
            }
        }

        setTimeout(() => {
            spawnNotification();
            setInterval(spawnNotification, 5000);
        }, 5000);
    }

    // Card entrance animation
    gsap.from('.cc-card', {
        y: 40,
        opacity: 0,
        scale: 0.95,
        duration: 1.2,
        ease: 'power3.out',
        delay: 2.6
    });
    gsap.from('.cc-ambient', {
        opacity: 0,
        scale: 0.8,
        duration: 1.8,
        ease: 'power2.out',
        delay: 2.8
    });

    // ============ SCROLL + MOUSE BACKGROUND PARALLAX ============
    // DISABLED: This was the #1 source of lag — 10+ GSAP tweens on every scroll frame
    // + a 32ms mouse-driven interval creating 5 more tweens per tick.
    // To re-enable, change 'false' to '_perfTier !== "low"'
    if (false) {

        // BG-effects container: slow vertical parallax on scroll
        gsap.to('.bg-effects', {
            y: -120,
            ease: 'none',
            scrollTrigger: {
                trigger: 'body',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 2
            }
        });

        // BG gradient: drift on scroll
        gsap.to('.bg-gradient', {
            y: -300,
            x: 60,
            rotation: 8,
            scale: 1.15,
            ease: 'none',
            scrollTrigger: {
                trigger: 'body',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 3
            }
        });

        // BG grid: slower scroll parallax
        gsap.to('.bg-grid', {
            y: -200,
            opacity: 0.3,
            ease: 'none',
            scrollTrigger: {
                trigger: 'body',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 2.5
            }
        });

        // Particles canvas: subtle drift
        gsap.to('#particles-canvas', {
            y: -150,
            opacity: 0.5,
            ease: 'none',
            scrollTrigger: {
                trigger: 'body',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1.8
            }
        });

        // Three.js container: medium drift
        gsap.to('#three-container', {
            y: -180,
            scale: 0.9,
            ease: 'none',
            scrollTrigger: {
                trigger: 'body',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 2.2
            }
        });

        // Individual element parallax
        if (_perfTier === 'high') {
            gsap.utils.toArray('.orb').forEach((orb, i) => {
                const direction = i % 2 === 0 ? 1 : -1;
                gsap.to(orb, {
                    y: () => -150 * (i + 1),
                    x: () => direction * 40 * (i + 1),
                    ease: 'none',
                    scrollTrigger: {
                        trigger: 'body',
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: 1.5 + i * 0.5
                    }
                });
            });

            gsap.utils.toArray('.anime-gif').forEach((gif, i) => {
                gsap.to(gif, {
                    y: -200 * (i + 1),
                    ease: 'none',
                    scrollTrigger: {
                        trigger: 'body',
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: 2 + i
                    }
                });
            });
        }

        // Mouse-driven background parallax
        let parallaxRafId = null;
        let _lastParallaxMX = 0, _lastParallaxMY = 0;
        setInterval(() => {
            const nmx = (_globalMouseX / window.innerWidth - 0.5) * 2;
            const nmy = (_globalMouseY / window.innerHeight - 0.5) * 2;
            if (nmx === _lastParallaxMX && nmy === _lastParallaxMY) return;
            _lastParallaxMX = nmx;
            _lastParallaxMY = nmy;
            if (parallaxRafId) return;
            parallaxRafId = requestAnimationFrame(() => {
                const mx = _lastParallaxMX;

                gsap.to('.bg-effects', {
                    x: mx * -25,
                    duration: 0.6,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });

                gsap.to('#particles-canvas', {
                    x: mx * -12,
                    duration: 0.6,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });

                gsap.to('#three-container', {
                    x: mx * -18,
                    duration: 0.6,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });

                gsap.to('.floating-anime-gifs', {
                    x: mx * -8,
                    duration: 0.6,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });

                gsap.to('.fantasy-orbs', {
                    x: mx * -30,
                    duration: 0.6,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });
                parallaxRafId = null;
            });
        }, 32);

    } // end parallax (DISABLED)

    // --- PURPLE GRADIENT: fade out after hero section ---
    gsap.to('.bg-gradient', {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: 'bottom 80%',
            end: 'bottom top',
            scrub: 1
        }
    });

    // Orbs also fade after hero
    gsap.to('.fantasy-orbs', {
        opacity: 0.15,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: 'bottom 50%',
            end: 'bottom top',
            scrub: 1
        }
    });

    // --- SECTION TRANSITIONS (smooth fade) ---
    // Hero fades out when scrolling away — opacity only for GPU efficiency
    gsap.to('.hero', {
        opacity: 0.3,
        y: -40,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: 'center center',
            end: 'bottom top',
            scrub: true,
        }
    });

    // Login handler moved to initTopControls()

    // Each content section: smooth 3D perspective reveal on scroll
    const contentSections = gsap.utils.toArray('.products-section, .features-section, .pricing-section, .free-cheats-section, .courses-section, .about-section, .team-section, .contact-section');

    contentSections.forEach((section, index) => {
        // Set will-change only during animation (saves VRAM when not animating)
        ScrollTrigger.create({
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            onEnter: () => { section.style.willChange = 'transform, opacity'; },
            onLeave: () => { section.style.willChange = 'auto'; },
            onEnterBack: () => { section.style.willChange = 'transform, opacity'; },
            onLeaveBack: () => { section.style.willChange = 'auto'; },
        });

        // Enter: 3D perspective slide-up with slight rotation
        gsap.fromTo(section,
            {
                opacity: 0,
                y: 80,
                rotateX: 4,
                transformPerspective: 1200,
                transformOrigin: 'center bottom',
            },
            {
                opacity: 1,
                y: 0,
                rotateX: 0,
                ease: 'none',
                immediateRender: false,
                scrollTrigger: {
                    trigger: section,
                    start: 'top bottom',
                    end: 'top 60%',
                    scrub: 0.8,
                }
            }
        );

        // Exit: fade out + slight upward drift
        gsap.to(section, {
            opacity: 0.15,
            y: -30,
            ease: 'none',
            immediateRender: false,
            scrollTrigger: {
                trigger: section,
                start: 'bottom 35%',
                end: 'bottom top',
                scrub: 0.8,
            }
        });
    });

    // Scroll snapping removed — Lenis handles smooth scroll natively

    // --- ARC STUDIOS STYLE: section headers with clip-path line reveals ---
    gsap.utils.toArray('.section-header').forEach(header => {
        const badge = header.querySelector('.section-badge');
        const title = header.querySelector('.section-title');
        const desc = header.querySelector('.section-desc');

        const headerTl = gsap.timeline({
            scrollTrigger: { trigger: header, start: 'top 88%', toggleActions: 'play none none reverse' }
        });

        // Badge scales in
        if (badge) {
            headerTl.fromTo(badge,
                { y: 20, opacity: 0, scale: 0.85 },
                { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }
            );
        }
        // Title reveals with clip-path unmask
        if (title) {
            headerTl.fromTo(title,
                { clipPath: 'inset(100% 0 0 0)', y: 40 },
                { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 1, ease: 'power4.out' },
                '-=0.3'
            );
        }
        // Description fades up
        if (desc) {
            headerTl.fromTo(desc,
                { y: 25, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
                '-=0.5'
            );
        }
    });

    // --- PREMIUM 3D REVEALS: feature cards with perspective stagger ---
    const featureCards = gsap.utils.toArray('.feature-card');
    if (featureCards.length) {
        gsap.fromTo(featureCards,
            {
                y: 100,
                opacity: 0,
                rotateY: -8,
                rotateX: 5,
                transformPerspective: 1000,
                scale: 0.92,
            },
            {
                y: 0, opacity: 1, rotateY: 0, rotateX: 0, scale: 1,
                duration: 1,
                ease: 'power3.out',
                stagger: 0.12,
                scrollTrigger: {
                    trigger: '.features-grid',
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    }

    // Features showcase
    gsap.fromTo('.features-3d-showcase',
        { x: 60, opacity: 0 },
        {
            x: 0, opacity: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: {
                trigger: '.features-showcase',
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            }
        }
    );

    // --- PREMIUM 3D: pricing cards with depth stagger ---
    const pricingCards = gsap.utils.toArray('.pricing-card');
    if (pricingCards.length) {
        gsap.fromTo(pricingCards,
            {
                y: 80,
                opacity: 0,
                rotateX: 6,
                transformPerspective: 1000,
                scale: 0.9,
            },
            {
                y: 0, opacity: 1, rotateX: 0, scale: 1,
                duration: 1,
                stagger: 0.15,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.pricing-grid',
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    }

    // --- Course cards: clean fade-in entrance ---
    const courseCards = gsap.utils.toArray('.courses-grid .cheats-gateway-card');
    if (courseCards.length) {
        gsap.fromTo(courseCards,
            {
                y: 50,
                opacity: 0,
            },
            {
                y: 0, opacity: 1,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.courses-grid',
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                clearProps: 'transform'
            }
        );

        // Animate feature items inside each card
        courseCards.forEach(card => {
            const features = card.querySelectorAll('.feature-item');
            if (features.length) {
                gsap.fromTo(features,
                    { x: -15, opacity: 0 },
                    {
                        x: 0, opacity: 1,
                        duration: 0.4,
                        stagger: 0.06,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: card,
                            start: 'top 75%',
                            toggleActions: 'play none none reverse'
                        }
                    }
                );
            }
        });
    }

    // Perk cards with stagger — clean entrance
    const coursePerks = gsap.utils.toArray('.cv2-perk-card');
    if (coursePerks.length) {
        gsap.fromTo(coursePerks,
            { y: 30, opacity: 0, scale: 0.95 },
            {
                y: 0, opacity: 1, scale: 1,
                duration: 0.7,
                stagger: 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.cv2-perks-grid',
                    start: 'top 88%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    }

    // About section - smooth slide reveals
    gsap.fromTo('.about-content',
        { x: -60, opacity: 0 },
        {
            x: 0, opacity: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: {
                trigger: '.about-grid',
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            }
        }
    );

    gsap.fromTo('.about-founder',
        { x: 60, opacity: 0 },
        {
            x: 0, opacity: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: {
                trigger: '.about-grid',
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            }
        }
    );

    // CTA box - smooth scale entrance
    gsap.fromTo('.cta-box',
        { y: 50, opacity: 0, scale: 0.95 },
        {
            y: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out',
            scrollTrigger: {
                trigger: '.cta-box',
                start: 'top 90%',
                toggleActions: 'play none none reverse'
            }
        }
    );

    // Contact cards staggered reveal
    const contactCards = gsap.utils.toArray('.contact-card');
    if (contactCards.length) {
        gsap.fromTo(contactCards,
            { y: 50, opacity: 0, scale: 0.95 },
            {
                y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out',
                stagger: 0.1,
                scrollTrigger: {
                    trigger: '.contact-cards',
                    start: 'top 90%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    }

    // Team Section V2 — Header reveal
    const teamHeaderV2 = document.querySelector('.team-header-v2');
    if (teamHeaderV2) {
        const thTl = gsap.timeline({
            scrollTrigger: {
                trigger: '.team-header-v2',
                start: 'top 88%',
                toggleActions: 'play none none reverse'
            }
        });
        thTl.fromTo('.team-header-v2 .team-header-full-img', { y: 30, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' })
            .fromTo('.team-headline-v2', { clipPath: 'inset(100% 0 0 0)', y: 30 }, { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.4')
            .fromTo('.team-sub-v2', { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.5')
            .fromTo('.team-header-divider', { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power3.out' }, '-=0.3');
    }

    // Team Section V2 — Founder spotlight reveal
    const founderSpotlight = document.querySelector('.founder-spotlight__card');
    if (founderSpotlight) {
        gsap.fromTo('.founder-spotlight__card',
            {
                y: 60,
                opacity: 0,
                scale: 0.95,
            },
            {
                y: 0, opacity: 1, scale: 1,
                duration: 1.2, ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.founder-spotlight',
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    }

    // Team Section V2 — Department cards staggered reveal
    const teamDepts = gsap.utils.toArray('.team-dept');
    teamDepts.forEach((dept) => {
        const cards = dept.querySelectorAll('.team-card-v2');
        if (cards.length) {
            gsap.fromTo(cards,
                { y: 40, opacity: 0, scale: 0.95 },
                {
                    y: 0, opacity: 1, scale: 1,
                    duration: 0.8, ease: 'power3.out',
                    stagger: 0.12,
                    scrollTrigger: {
                        trigger: dept,
                        start: 'top 88%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        }
        // Department header entrance
        const header = dept.querySelector('.team-dept__header');
        if (header) {
            gsap.fromTo(header,
                { x: -30, opacity: 0 },
                {
                    x: 0, opacity: 1,
                    duration: 0.6, ease: 'power3.out',
                    scrollTrigger: {
                        trigger: dept,
                        start: 'top 90%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        }
    });

    // About stats row
    const aboutStats = gsap.utils.toArray('.about-stat');
    if (aboutStats.length) {
        gsap.fromTo(aboutStats,
            { y: 30, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 0.7, ease: 'power3.out',
                stagger: 0.12,
                scrollTrigger: {
                    trigger: '.about-stats-row',
                    start: 'top 92%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    }

    // Exclusive members entrance
    const exMembers = gsap.utils.toArray('.team-exclusive__member');
    if (exMembers.length) {
        gsap.fromTo('.team-exclusive__divider',
            { opacity: 0, scaleX: 0.5 },
            {
                opacity: 1, scaleX: 1, duration: 0.8, ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.team-exclusive',
                    start: 'top 90%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
        gsap.fromTo(exMembers,
            { y: 30, opacity: 0, scale: 0.9 },
            {
                y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out',
                stagger: 0.1,
                scrollTrigger: {
                    trigger: '.team-exclusive__row',
                    start: 'top 92%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    }

    // Footer massive text - Arc Studios clip-path reveal
    const massiveWords = gsap.utils.toArray('.massive-word');
    if (massiveWords.length) {
        gsap.fromTo(massiveWords,
            { clipPath: 'inset(100% 0 0 0)', y: 60 },
            {
                clipPath: 'inset(0% 0 0 0)', y: 0,
                duration: 1.2, ease: 'power4.out',
                stagger: 0.1,
                scrollTrigger: {
                    trigger: '.footer-massive',
                    start: 'top 95%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    }

    // (Background parallax already handled above in the main parallax system)
}

// Fallback scroll animations without GSAP
function initBasicScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.section-header, .product-card, .feature-card, .pricing-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add animation class styles
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}

/* ============ ADVANCED TILT + MAGNETIC HOVER + GLOW FOLLOW ============ */
function initTiltEffect() {
    if (typeof gsap === 'undefined') return;

    // --- ENHANCED 3D TILT for all interactive cards ---
    const tiltTargets = document.querySelectorAll('.feature-card, .pricing-card, .team-card-v2');

    tiltTargets.forEach(card => {
        // Add glow follow element
        const glow = document.createElement('div');
        glow.className = 'glow-follow';
        card.style.position = 'relative';
        card.style.overflow = 'hidden';
        card.appendChild(glow);

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;

            gsap.to(card, {
                rotateX: rotateX,
                rotateY: rotateY,
                transformPerspective: 1000,
                scale: 1.03,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: 'auto'
            });

            // Move glow follow to cursor position
            gsap.to(glow, {
                x: x,
                y: y,
                opacity: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        }, { passive: true });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                rotateX: 0,
                rotateY: 0,
                scale: 1,
                y: 0,
                duration: 0.7,
                ease: 'elastic.out(1, 0.5)',
                overwrite: 'auto'
            });

            gsap.to(glow, {
                opacity: 0,
                duration: 0.4,
                ease: 'power2.out'
            });
        });
    });

    // --- MAGNETIC HOVER for buttons ---
    const magneticTargets = document.querySelectorAll('.btn-primary, .btn-secondary, .social-btn, .showcase-arrow');

    magneticTargets.forEach(btn => {
        const strength = btn.classList.contains('showcase-arrow') ? 0.4 : 0.3;

        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(btn, {
                x: x * strength,
                y: y * strength,
                duration: 0.4,
                ease: 'power2.out',
                overwrite: 'auto'
            });
        }, { passive: true });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.6,
                ease: 'elastic.out(1, 0.4)',
                overwrite: 'auto'
            });
        });
    });

    // --- NAV LINKS: subtle magnetic pull ---
    const navTabs = document.querySelectorAll('.nav-link');
    navTabs.forEach(tab => {
        tab.addEventListener('mousemove', (e) => {
            const rect = tab.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;

            gsap.to(tab, {
                x: x * 0.15,
                duration: 0.3,
                ease: 'power2.out',
                overwrite: 'auto'
            });
        }, { passive: true });

        tab.addEventListener('mouseleave', () => {
            gsap.to(tab, {
                x: 0,
                duration: 0.5,
                ease: 'elastic.out(1, 0.5)',
                overwrite: 'auto'
            });
        });
    });
}

/* ============ PRODUCT SHOWCASE CAROUSEL ============ */
function initProductShowcase() {
    const showcase = document.querySelector('.products-showcase');
    if (!showcase) return;

    const track = showcase.querySelector('.products-grid-new');
    const cards = showcase.querySelectorAll('.product-card-new');
    const leftArrow = showcase.querySelector('.arrow-left');
    const rightArrow = showcase.querySelector('.arrow-right');
    const dots = showcase.querySelectorAll('.showcase-dot');
    const infoPanel = showcase.querySelector('.showcase-info-panel');
    const sliderTrack = showcase.querySelector('.products-slider-track');

    if (!track || cards.length === 0) return;

    let currentIndex = 0;
    const totalCards = cards.length;
    let isAnimating = false;

    // === CREATE PORTAL ELEMENTS ===
    const beam = document.createElement('div');
    beam.className = 'showcase-portal-beam';
    sliderTrack.appendChild(beam);

    const particleContainer = document.createElement('div');
    particleContainer.className = 'showcase-portal-particles';
    sliderTrack.appendChild(particleContainer);

    // Spawn portal particles
    for (let i = 0; i < 14; i++) {
        const p = document.createElement('div');
        p.className = 'portal-particle';
        p.style.left = (15 + Math.random() * 70) + '%';
        p.style.animationDelay = (Math.random() * 3) + 's';
        p.style.animationDuration = (2.5 + Math.random() * 2) + 's';
        const size = (2 + Math.random() * 3);
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        particleContainer.appendChild(p);
    }

    // Product descriptions
    const productDescriptions = [
        'Our flagship external tool packed with Aimbot Suite, ESP & Chams, Sniper Scope, and Streamer Mode. The ultimate gaming companion.',
        'Advanced internal tool with Silent Aim, Teleport, Speed Hack, Unlimited Ammo, No Recoil, and Full ESP. Maximum power unleashed.',
        'Premium code collection including Aimbot x64/x86, Sniper Location, Speed Hack, Fly Run, and all Chams types. Incredible value.',
        'RESTful API services for Player Info, Friend Request, JWT Token bypass, and more. Built for developers who need power.'
    ];

    const productPrices = [
        { label: 'Starting from', amount: '$9.99' },
        { label: 'Starting from', amount: '$1.00' },
        { label: 'One-time', amount: '$4.99' },
        { label: 'Per endpoint', amount: '$1.00' }
    ];

    // Card accent colors — Red / White / Cream
    const cardColors = [
        { accent: 'rgba(220, 38, 38, 0.25)', accentBright: '#dc2626', dim: 'rgba(220, 38, 38, 0.08)', glow: 'rgba(220, 38, 38, 0.12)', glowMid: 'rgba(220, 38, 38, 0.05)' },
        { accent: 'rgba(255, 255, 255, 0.2)', accentBright: '#ffffff', dim: 'rgba(255, 255, 255, 0.06)', glow: 'rgba(255, 255, 255, 0.08)', glowMid: 'rgba(255, 255, 255, 0.03)' },
        { accent: 'rgba(236, 223, 204, 0.2)', accentBright: '#ECDFCC', dim: 'rgba(236, 223, 204, 0.06)', glow: 'rgba(236, 223, 204, 0.1)', glowMid: 'rgba(236, 223, 204, 0.04)' },
        { accent: 'rgba(220, 38, 38, 0.2)', accentBright: '#dc2626', dim: 'rgba(220, 38, 38, 0.06)', glow: 'rgba(220, 38, 38, 0.1)', glowMid: 'rgba(220, 38, 38, 0.04)' }
    ];

    // ====== GSAP-POWERED SLIDE ANIMATION ======
    function isMobileView() {
        return window.innerWidth <= 768;
    }

    function animateCardTransition(fromIndex, toIndex, direction) {
        if (fromIndex === toIndex) return;
        isAnimating = true;

        const outCard = cards[fromIndex];
        const inCard = cards[toIndex];
        const outInner = outCard ? outCard.querySelector('.card-inner') : null;
        const inInner = inCard ? inCard.querySelector('.card-inner') : null;

        // Kill any running tweens
        if (outInner) gsap.killTweensOf(outInner);
        if (inInner) gsap.killTweensOf(inInner);

        // ── Simple crossfade — works on all screen sizes ──

        // Show incoming card container
        inCard.classList.add('showcase-active');

        // Fade out old card
        if (outInner) {
            gsap.to(outInner, {
                opacity: 0,
                scale: 0.95,
                duration: 0.3,
                ease: 'power2.in',
                overwrite: true,
                onComplete: function () {
                    outCard.classList.remove('showcase-active');
                    gsap.set(outInner, { clearProps: 'opacity,scale,x,transform' });
                }
            });
        } else {
            outCard.classList.remove('showcase-active');
        }

        // Fade in new card
        if (inInner) {
            gsap.set(inInner, { opacity: 0, scale: 0.95 });
            gsap.to(inInner, {
                opacity: 1,
                scale: 1,
                duration: 0.4,
                delay: 0.15,
                ease: 'power2.out',
                overwrite: true,
                onComplete: function () { isAnimating = false; }
            });
        } else {
            isAnimating = false;
        }
    }

    // ====== HOVER TILT EFFECT ON ACTIVE CARD ======
    function initCardHoverTilt() {
        cards.forEach(function (card) {
            const inner = card.querySelector('.card-inner');
            if (!inner) return;

            card.addEventListener('mousemove', function (e) {
                if (!card.classList.contains('showcase-active')) return;
                const rect = inner.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -4;
                const rotateY = ((x - centerX) / centerX) * 4;

                if (typeof gsap !== 'undefined') {
                    gsap.to(inner, {
                        rotateX: rotateX,
                        rotateY: rotateY,
                        duration: 0.4,
                        ease: 'power2.out',
                        transformPerspective: 800
                    });
                }
            }, { passive: true });

            card.addEventListener('mouseleave', function () {
                if (!card.classList.contains('showcase-active')) return;
                if (typeof gsap !== 'undefined') {
                    gsap.to(inner, {
                        rotateX: 0,
                        rotateY: 0,
                        y: 0,
                        scale: 1,
                        duration: 0.6,
                        ease: 'power3.out',
                        transformPerspective: 800
                    });
                }
            });
        });
    }
    initCardHoverTilt();

    // ====== UPDATE COLORS & INFO ======
    function updateShowcaseInfo(index) {
        // Update dots
        dots.forEach(function (dot, i) {
            dot.classList.toggle('active', i === index);
        });

        // Update color theme
        const colors = cardColors[index] || cardColors[0];
        if (sliderTrack) {
            sliderTrack.style.setProperty('--showcase-glow', colors.glow);
            sliderTrack.style.setProperty('--showcase-glow-mid', colors.glowMid);
        }
        const stage = showcase.querySelector('.showcase-stage');
        if (stage) {
            stage.style.setProperty('--showcase-accent', colors.accent);
            stage.style.setProperty('--showcase-accent-bright', colors.accentBright);
            stage.style.setProperty('--showcase-accent-dim', colors.dim);
        }
        showcase.style.setProperty('--showcase-accent-bright', colors.accentBright);
        showcase.style.setProperty('--showcase-accent', colors.accent);
        showcase.style.setProperty('--showcase-accent-dim', colors.dim);

        // Update portal particle colors
        particleContainer.querySelectorAll('.portal-particle').forEach(function (p) {
            p.style.background = colors.glow;
            p.style.boxShadow = '0 0 8px ' + colors.glow;
        });

        // Update info panel with smooth stagger
        if (infoPanel) {
            const nameEl = infoPanel.querySelector('.showcase-product-name');
            const typeEl = infoPanel.querySelector('.showcase-product-type');
            const descEl = infoPanel.querySelector('.showcase-product-desc');
            const priceEl = infoPanel.querySelector('.showcase-product-price');
            const els = [nameEl, typeEl, descEl, priceEl];

            // Fade out
            els.forEach(function (el) { if (el) el.classList.remove('visible'); });

            setTimeout(function () {
                const card = cards[index];
                const title = card.querySelector('.card-title');
                const type = card.querySelector('.card-type');

                if (nameEl) nameEl.textContent = title ? title.textContent : '';
                if (typeEl) typeEl.textContent = type ? type.textContent : '';
                if (descEl) descEl.textContent = productDescriptions[index] || '';
                if (priceEl) {
                    const p = productPrices[index];
                    priceEl.innerHTML = '<span class="price-from">' + p.label + '</span><span class="price-amount">' + p.amount + '</span>';
                }

                // Staggered fade in
                requestAnimationFrame(function () {
                    els.forEach(function (el) { if (el) el.classList.add('visible'); });
                });
            }, 300);
        }
    }

    // ====== GO TO SLIDE ======
    function goToSlide(index, direction) {
        if (isAnimating) return;
        if (index < 0) index = totalCards - 1;
        if (index >= totalCards) index = 0;
        if (index === currentIndex) return;

        const prevIndex = currentIndex;
        currentIndex = index;

        animateCardTransition(prevIndex, currentIndex, direction || 'right');
        updateShowcaseInfo(currentIndex);
    }

    // ====== NAVIGATION ======
    if (leftArrow) {
        leftArrow.addEventListener('click', function () {
            goToSlide(currentIndex - 1, 'left');
        });
    }
    if (rightArrow) {
        rightArrow.addEventListener('click', function () {
            goToSlide(currentIndex + 1, 'right');
        });
    }

    // Dot clicks
    dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
            var idx = parseInt(dot.dataset.index);
            if (!isNaN(idx) && idx !== currentIndex) {
                goToSlide(idx, idx > currentIndex ? 'right' : 'left');
            }
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
        var section = document.querySelector('#products');
        if (!section) return;
        var rect = section.getBoundingClientRect();
        var inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (!inView) return;

        if (e.key === 'ArrowLeft') goToSlide(currentIndex - 1, 'left');
        if (e.key === 'ArrowRight') goToSlide(currentIndex + 1, 'right');
    });

    // Touch/swipe support
    var touchStartX = 0;
    track.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', function (e) {
        var diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) goToSlide(currentIndex + 1, 'right');
            else goToSlide(currentIndex - 1, 'left');
        }
    }, { passive: true });

    // ====== INITIALIZE FIRST SLIDE (no animation, just show) ======
    cards.forEach(function (c, i) {
        var inner = c.querySelector('.card-inner');
        c.classList.remove('showcase-active');
        if (inner) {
            // On mobile, don't set opacity:0 — CSS handles visibility via display
            if (isMobileView()) {
                gsap.set(inner, { clearProps: 'opacity,x,scale,transform' });
            } else {
                gsap.set(inner, { opacity: 0, x: 0, scale: 1 });
            }
        }
    });
    cards[0].classList.add('showcase-active');
    var firstInner = cards[0].querySelector('.card-inner');
    if (firstInner) gsap.set(firstInner, { opacity: 1, x: 0, scale: 1 });
    updateShowcaseInfo(0);
}

/* ============ FANTASY EFFECTS ============ */
function initFantasyEffects() {
    // Glitter sparkle on hover for buttons
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .product-btn, .pricing-btn, .card-cta, .discover-btn, .social-btn, .code-copy');

    const glitterColors = ['#ffffff', '#7c5cfc', '#a78bfa', '#d4d4d4', '#ECDFCC', '#c4b5fd', '#e0e0e0'];
    const glitterSymbols = ['✦', '✧', '★', '✴', '❋', '✺', '✶', '⋆'];

    buttons.forEach(btn => {
        let hoverInterval = null;

        btn.addEventListener('mouseenter', (e) => {
            // Initial burst on enter
            spawnButtonGlitter(btn, 6);

            // Continuous sparkle while hovering
            hoverInterval = setInterval(() => {
                spawnButtonGlitter(btn, 2);
            }, 200);
        });

        btn.addEventListener('mouseleave', () => {
            if (hoverInterval) {
                clearInterval(hoverInterval);
                hoverInterval = null;
            }
        });
    });

    function spawnButtonGlitter(btn, count) {
        const rect = btn.getBoundingClientRect();
        for (let i = 0; i < count; i++) {
            const g = document.createElement('span');
            const color = glitterColors[Math.floor(Math.random() * glitterColors.length)];
            const symbol = glitterSymbols[Math.floor(Math.random() * glitterSymbols.length)];
            const x = rect.left + Math.random() * rect.width;
            const y = rect.top + Math.random() * rect.height;
            const size = 8 + Math.random() * 10;
            g.textContent = symbol;
            g.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                color: ${color};
                font-size: ${size}px;
                text-shadow: 0 0 8px ${color}, 0 0 16px ${color};
                pointer-events: none;
                z-index: 99999;
                animation: btnGlitterFloat 0.7s ease-out forwards;
            `;
            document.body.appendChild(g);
            setTimeout(() => g.remove(), 700);
        }
    }
}

/* ============ SMOOTH SCROLL (handled by Lenis) ============ */

/* ============ PAGE TRANSITION ============ */
function initPageTransition() {
    const overlay = document.getElementById('pageTransition');
    if (!overlay) return;

    const gatewayBtn = document.getElementById('openCheatsPage');
    if (gatewayBtn) {
        gatewayBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const href = gatewayBtn.getAttribute('href');
            sessionStorage.setItem('skipPreloader', '1');
            overlay.classList.add('active');
            const barFill = overlay.querySelector('.pt-bar-fill');
            if (barFill) {
                barFill.style.transition = 'width 1.4s cubic-bezier(0.22, 1, 0.36, 1)';
                setTimeout(() => { barFill.style.width = '100%'; }, 80);
            }
            setTimeout(() => { window.location.href = href; }, 1500);
        });
    }

    if (sessionStorage.getItem('pageTransition')) {
        sessionStorage.removeItem('pageTransition');
        overlay.classList.add('no-transition');
        overlay.classList.add('active');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.classList.remove('no-transition');
                overlay.classList.remove('active');
            });
        });
    }
}

/* ============ SWIPE PAGE TRANSITION ============ */
function initSwipeTransition() {
    const swipe = document.getElementById('pageSwipe');
    if (!swipe) return;

    if (sessionStorage.getItem('pageSwipe') === '1') {
        sessionStorage.removeItem('pageSwipe');
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('hidden');
            document.body.style.overflow = 'visible';
        }
        if (typeof gsap !== 'undefined') {
            gsap.set(swipe, { opacity: 1, pointerEvents: 'all' });
            gsap.to(swipe, {
                opacity: 0,
                duration: 0.4,
                delay: 0.05,
                ease: 'power2.out',
                onComplete: () => { gsap.set(swipe, { pointerEvents: 'none' }); }
            });
        }
    }

    document.querySelectorAll('a[href*="profile.script-kittens.com"], a[href*="cheats.script-kittens.com"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            sessionStorage.setItem('pageSwipe', '1');
            if (typeof gsap !== 'undefined') {
                gsap.to(swipe, {
                    opacity: 1,
                    duration: 0.3,
                    ease: 'power2.in',
                    onStart: () => { gsap.set(swipe, { pointerEvents: 'all' }); },
                    onComplete: () => { window.location.href = href; }
                });
            } else {
                window.location.href = href;
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initPageTransition();
    initSwipeTransition();
});

/* ============ TOP CONTROL BUTTONS ============ */
function initTopControls() {
    const loginBtn = document.getElementById('loginBtn');
    const cursorBtn = document.getElementById('cursorBtn');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = 'https://login.script-kittens.com';
        });
    }

    if (cursorBtn) {
        const savedCursor = localStorage.getItem('cursor') || 'custom';
        if (savedCursor === 'normal') {
            document.body.classList.add('normal-cursor');
            cursorBtn.querySelector('i').classList.replace('fa-mouse-pointer', 'fa-hand-pointer');
        }

        cursorBtn.addEventListener('click', () => {
            const isNormal = document.body.classList.toggle('normal-cursor');
            const icon = cursorBtn.querySelector('i');

            if (isNormal) {
                icon.classList.replace('fa-mouse-pointer', 'fa-hand-pointer');
                localStorage.setItem('cursor', 'normal');
            } else {
                icon.classList.replace('fa-hand-pointer', 'fa-mouse-pointer');
                localStorage.setItem('cursor', 'custom');
            }

            if (typeof gsap !== 'undefined') {
                gsap.timeline()
                    .to(cursorBtn, { scale: 0.85, duration: 0.1 })
                    .to(cursorBtn, { scale: 1.1, duration: 0.2, ease: 'back.out(3)' })
                    .to(cursorBtn, { scale: 1, duration: 0.15 });
            }
        });
    }

    // ---- FULLSCREEN TOGGLE ----
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const fullscreenIcon = document.getElementById('fullscreenIcon');
    const topControls = document.querySelector('.top-controls');

    // Show button after preloader
    setTimeout(() => {
        if (topControls) topControls.classList.add('visible');
    }, 2000);

    // Check if we should enter fullscreen on load
    if (sessionStorage.getItem('wasFullscreen') === 'true') {
        setTimeout(() => {
            document.documentElement.requestFullscreen().catch(() => {
                sessionStorage.removeItem('wasFullscreen');
            });
        }, 2100);
    }

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => { });
                if (fullscreenIcon) fullscreenIcon.className = 'fas fa-compress';
                sessionStorage.setItem('wasFullscreen', 'true');
            } else {
                document.exitFullscreen();
                if (fullscreenIcon) fullscreenIcon.className = 'fas fa-expand';
                sessionStorage.removeItem('wasFullscreen');
            }
            if (typeof gsap !== 'undefined') {
                gsap.timeline()
                    .to(fullscreenBtn, { scale: 0.85, duration: 0.1 })
                    .to(fullscreenBtn, { scale: 1.1, duration: 0.2, ease: 'back.out(3)' })
                    .to(fullscreenBtn, { scale: 1, duration: 0.15 });
            }
        });
        document.addEventListener('fullscreenchange', () => {
            if (fullscreenIcon) {
                fullscreenIcon.className = document.fullscreenElement ? 'fas fa-compress' : 'fas fa-expand';
                if (document.fullscreenElement) {
                    sessionStorage.setItem('wasFullscreen', 'true');
                } else {
                    sessionStorage.removeItem('wasFullscreen');
                }
            }
        });
    }
}

function createLoginModal() {
    const existingModal = document.querySelector('.login-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'login-modal';

    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const loggedName = localStorage.getItem('userDisplayName') || '';
    const loggedMethod = localStorage.getItem('userAuthMethod') || 'email';
    const loggedEmail = localStorage.getItem('userEmail') || '';

    const providerMeta = {
        google: { icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>', label: 'Google', color: '#4285F4' },
        github: { icon: '<i class="fab fa-github"></i>', label: 'GitHub', color: '#ffffff' },
        discord: { icon: '<i class="fab fa-discord"></i>', label: 'Discord', color: '#5865F2' },
        email: { icon: '<i class="fas fa-envelope"></i>', label: 'Email', color: '#7c5cfc' }
    };
    const activeProv = providerMeta[loggedMethod] || providerMeta.email;

    const loggedInBanner = isLoggedIn ? `
        <div class="logged-in-banner">
            <div class="logged-in-banner-glow"></div>
            <div class="logged-in-icon" style="color:${activeProv.color}">${activeProv.icon}</div>
            <div class="logged-in-info">
                <span class="logged-in-label">Signed in as</span>
                <span class="logged-in-name">${loggedName}</span>
            </div>
            <div class="logged-in-platform">
                <span class="logged-in-via">via ${activeProv.label}</span>
            </div>
        </div>
        <div class="logged-in-actions">
            <button class="logged-in-continue-btn" onclick="this.closest('.login-modal').remove()">
                <i class="fas fa-arrow-right"></i>
                <span>Continue as ${loggedName.split(' ')[0]}</span>
            </button>
            <button class="logged-in-switch-btn" id="switchAccountBtn">
                <i class="fas fa-exchange-alt"></i>
                <span>Switch Account</span>
            </button>
        </div>
        <div class="logged-in-connect-hint">
            <i class="fas fa-link"></i>
            <span>Connect more accounts from your <a href="/profile" class="connect-profile-link">Profile</a> for added security</span>
        </div>
    ` : '';

    modal.innerHTML = `
        <div class="login-container">
            <canvas class="login-particles-canvas" id="loginParticles"></canvas>
            <div class="login-glow-orb login-glow-orb-1"></div>
            <div class="login-glow-orb login-glow-orb-2"></div>
            <div class="login-glow-orb login-glow-orb-3"></div>
            <div class="login-header">
                <div class="login-logo">
                    <img src="https://i.postimg.cc/sg838cbj/download-(7).gif" alt="Script Kittens" class="login-logo-img">
                    <div class="login-logo-ring"></div>
                </div>
                <h2>${isLoggedIn ? 'Welcome Back' : 'Welcome Back'}</h2>
                <p>${isLoggedIn ? loggedEmail : 'Sign in to Script Kittens'}</p>
                <button class="login-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="login-body">
                ${isLoggedIn ? loggedInBanner : ''}
                <div class="login-form-area" ${isLoggedIn ? 'style="display:none;"' : ''}>
                <div class="login-tabs">
                    <button class="login-tab active" data-tab="signin">Sign In</button>
                    <button class="login-tab" data-tab="signup">Sign Up</button>
                    <div class="login-tab-indicator"></div>
                </div>

                <div class="login-content-wrapper">
                <div class="login-content active" data-content="signin">
                    <div class="social-login-grid">
                        <button class="social-btn google" data-provider="google">
                            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                            <span>Google</span>
                        </button>
                        <button class="social-btn github" data-provider="github">
                            <i class="fab fa-github"></i>
                            <span>GitHub</span>
                        </button>
                        <button class="social-btn discord" data-provider="discord">
                            <i class="fab fa-discord"></i>
                            <span>Discord</span>
                        </button>
                    </div>
                    <div class="login-divider"><span>or continue with email</span></div>
                    <form id="signinForm">
                        <div class="form-group">
                            <label><i class="fas fa-envelope"></i> Email</label>
                            <input type="email" class="form-input" placeholder="your@email.com" required>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-lock"></i> Password</label>
                            <div class="password-wrap">
                                <input type="password" class="form-input" placeholder="Enter your password" required>
                                <button type="button" class="pw-toggle"><i class="fas fa-eye"></i></button>
                            </div>
                        </div>
                        <div class="form-options">
                            <label class="remember-toggle">
                                <input type="checkbox" id="rememberMeToggle">
                                <div class="toggle-track">
                                    <div class="toggle-thumb">
                                        <i class="fas fa-check toggle-check-icon"></i>
                                    </div>
                                    <div class="toggle-glow"></div>
                                </div>
                                <span class="toggle-label">Remember me</span>
                            </label>
                            <a href="#" class="form-link">Forgot password?</a>
                        </div>
                        <button type="submit" class="login-submit">
                            <div class="login-submit-bg"></div>
                            <i class="fas fa-sign-in-alt"></i>
                            <span>Sign In</span>
                        </button>
                    </form>
                    <div class="login-footer">Don't have an account? <a href="#" class="switch-tab" data-target="signup">Create one</a></div>
                    <div class="login-platform-hint">
                        <i class="fas fa-info-circle"></i>
                        <span>You can connect additional accounts from your profile after signing in</span>
                    </div>
                </div>

                <div class="login-content" data-content="signup">
                    <div class="social-login-grid">
                        <button class="social-btn google" data-provider="google" data-action="signup">
                            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                            <span>Google</span>
                        </button>
                        <button class="social-btn github" data-provider="github" data-action="signup">
                            <i class="fab fa-github"></i>
                            <span>GitHub</span>
                        </button>
                        <button class="social-btn discord" data-provider="discord" data-action="signup">
                            <i class="fab fa-discord"></i>
                            <span>Discord</span>
                        </button>
                    </div>
                    <div class="login-divider"><span>or create with email</span></div>
                    <form id="signupForm">
                        <div class="form-group">
                            <label><i class="fas fa-user"></i> Full Name</label>
                            <input type="text" class="form-input" placeholder="Your name" required>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-envelope"></i> Email</label>
                            <input type="email" class="form-input" id="signupEmail" placeholder="your@email.com" required>
                        </div>
                        <div class="form-group verification-row" id="verificationRow" style="display:none;">
                            <label><i class="fas fa-shield-alt"></i> Verification Code</label>
                            <div class="verify-input-wrap">
                                <input type="text" class="form-input" id="verifyCodeInput" placeholder="6-digit code" maxlength="6">
                                <button type="button" class="verify-btn" id="sendCodeBtn"><i class="fas fa-paper-plane"></i> Send</button>
                            </div>
                            <span class="verify-status" id="verifyStatus"></span>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-lock"></i> Password</label>
                            <div class="password-wrap">
                                <input type="password" class="form-input" placeholder="Min 6 characters" required>
                                <button type="button" class="pw-toggle"><i class="fas fa-eye"></i></button>
                            </div>
                        </div>
                        <button type="submit" class="login-submit">
                            <div class="login-submit-bg"></div>
                            <i class="fas fa-user-plus"></i>
                            <span>Create Account</span>
                        </button>
                    </form>
                    <div class="login-footer">Already have an account? <a href="#" class="switch-tab" data-target="signin">Sign in</a></div>
                </div>
                </div>
                </div>
            </div>
            <div class="login-secure-badge">
                <i class="fas fa-shield-alt"></i>
                <span>256-bit SSL Encrypted</span>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const tabs = modal.querySelectorAll('.login-tab');
    const contents = modal.querySelectorAll('.login-content');
    const switchLinks = modal.querySelectorAll('.switch-tab');
    const tabIndicator = modal.querySelector('.login-tab-indicator');
    let currentTab = 'signin';
    let switchTimeout = null;
    let switching = false;

    function switchTab(targetTab) {
        if (targetTab === currentTab) return;

        if (switchTimeout) { clearTimeout(switchTimeout); switchTimeout = null; }

        contents.forEach(c => {
            c.style.transition = '';
            c.style.transform = '';
            c.style.opacity = '';
            c.classList.remove('active');
        });

        const goingRight = targetTab === 'signup';

        tabs.forEach(t => t.classList.remove('active'));
        const newContent = modal.querySelector(`[data-content="${targetTab}"]`);
        const tab = modal.querySelector(`[data-tab="${targetTab}"]`);

        if (tabIndicator) {
            if (goingRight) tabIndicator.classList.add('right');
            else tabIndicator.classList.remove('right');
        }

        if (tab) tab.classList.add('active');

        if (newContent) {
            newContent.style.transform = goingRight ? 'translateX(12px)' : 'translateX(-12px)';
            newContent.style.opacity = '0';
            newContent.classList.add('active');
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    newContent.style.transition = 'opacity 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.22,1,0.36,1)';
                    newContent.style.transform = 'translateX(0)';
                    newContent.style.opacity = '1';
                    switchTimeout = setTimeout(() => {
                        newContent.style.transition = '';
                        newContent.style.transform = '';
                        newContent.style.opacity = '';
                        switching = false;
                    }, 420);
                });
            });
        }

        currentTab = targetTab;
    }

    tabs.forEach(tab => { tab.addEventListener('click', () => switchTab(tab.dataset.tab)); });
    switchLinks.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); switchTab(link.dataset.target); }); });

    const switchAccountBtn = modal.querySelector('#switchAccountBtn');
    if (switchAccountBtn) {
        switchAccountBtn.addEventListener('click', () => {
            const banner = modal.querySelector('.logged-in-banner');
            const actions = modal.querySelector('.logged-in-actions');
            const hint = modal.querySelector('.logged-in-connect-hint');
            const formArea = modal.querySelector('.login-form-area');
            if (banner) banner.style.display = 'none';
            if (actions) actions.style.display = 'none';
            if (hint) hint.style.display = 'none';
            if (formArea) {
                formArea.style.display = 'block';
                formArea.style.animation = 'fadeSlideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
            }
        });
    }

    modal.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', () => handleSocialLogin(btn.dataset.provider));
    });

    modal.querySelectorAll('.pw-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const inp = btn.parentElement.querySelector('input');
            const isPass = inp.type === 'password';
            inp.type = isPass ? 'text' : 'password';
            btn.innerHTML = `<i class="fas fa-eye${isPass ? '-slash' : ''}"></i>`;
        });
    });

    const signinForm = modal.querySelector('#signinForm');
    if (signinForm) signinForm.addEventListener('submit', (e) => { e.preventDefault(); handleEmailLogin(signinForm, 'signin'); });

    const signupForm = modal.querySelector('#signupForm');
    if (signupForm) signupForm.addEventListener('submit', (e) => { e.preventDefault(); handleEmailLogin(signupForm, 'signup'); });

    const signupEmail = modal.querySelector('#signupEmail');
    const verificationRow = modal.querySelector('#verificationRow');
    const sendCodeBtn = modal.querySelector('#sendCodeBtn');
    const verifyCodeInput = modal.querySelector('#verifyCodeInput');
    const verifyStatus = modal.querySelector('#verifyStatus');

    if (signupEmail) {
        signupEmail.addEventListener('input', () => {
            const email = signupEmail.value.trim();
            if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                verificationRow.style.display = 'block';
            }
        });
    }

    let emailVerified = false;

    if (sendCodeBtn) {
        sendCodeBtn.addEventListener('click', async () => {
            const email = signupEmail.value.trim();
            if (!email) return;
            sendCodeBtn.disabled = true;
            sendCodeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            try {
                const res = await fetch(apiUrl('/api/auth/send-code'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email, purpose: 'register' })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    verifyStatus.textContent = 'Code sent! Check your email.';
                    verifyStatus.style.color = '#00ff88';
                    let countdown = 60;
                    sendCodeBtn.innerHTML = `${countdown}s`;
                    const timer = setInterval(() => {
                        countdown--;
                        sendCodeBtn.innerHTML = `${countdown}s`;
                        if (countdown <= 0) {
                            clearInterval(timer);
                            sendCodeBtn.disabled = false;
                            sendCodeBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Resend';
                        }
                    }, 1000);
                } else {
                    verifyStatus.textContent = data.message;
                    verifyStatus.style.color = '#ff4646';
                    sendCodeBtn.disabled = false;
                    sendCodeBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
                }
            } catch {
                verifyStatus.textContent = 'Network error';
                verifyStatus.style.color = '#ff4646';
                sendCodeBtn.disabled = false;
                sendCodeBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
            }
        });
    }

    if (verifyCodeInput) {
        verifyCodeInput.addEventListener('input', async () => {
            const code = verifyCodeInput.value.trim();
            if (code.length === 6) {
                const email = signupEmail.value.trim();
                try {
                    const res = await fetch(apiUrl('/api/auth/verify-code'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ email, code, purpose: 'register' })
                    });
                    const data = await res.json();
                    if (data.verified) {
                        emailVerified = true;
                        verifyStatus.textContent = 'Email verified!';
                        verifyStatus.style.color = '#00ff88';
                        verifyCodeInput.style.borderColor = '#00ff88';
                        verifyCodeInput.disabled = true;
                        signupEmail.readOnly = true;
                    } else {
                        verifyStatus.textContent = data.message || 'Invalid code';
                        verifyStatus.style.color = '#ff4646';
                    }
                } catch {
                    verifyStatus.textContent = 'Verification failed';
                    verifyStatus.style.color = '#ff4646';
                }
            }
        });
    }

    modal.querySelector('.login-close').addEventListener('click', () => closeModal(modal));
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
    const escHandler = (e) => { if (e.key === 'Escape') { closeModal(modal); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);

    initLoginEffects(modal);
}

function initLoginEffects(modal) {
    var socialBtns = modal.querySelectorAll('.social-btn');
    socialBtns.forEach(function (btn, i) {
        btn.style.opacity = '0';
        btn.style.transform = 'translateY(15px) scale(0.9)';
        setTimeout(function () {
            btn.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
            btn.style.opacity = '1';
            btn.style.transform = 'translateY(0) scale(1)';
        }, 200 + (i * 60));
    });

    var formGroups = modal.querySelectorAll('.form-group');
    formGroups.forEach(function (fg, i) {
        fg.style.opacity = '0';
        fg.style.transform = 'translateX(-15px)';
        setTimeout(function () {
            fg.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
            fg.style.opacity = '1';
            fg.style.transform = 'translateX(0)';
        }, 500 + (i * 80));
    });

    var submitBtn = modal.querySelector('.login-submit');
    if (submitBtn) {
        submitBtn.style.opacity = '0';
        submitBtn.style.transform = 'translateY(10px)';
        setTimeout(function () {
            submitBtn.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
            submitBtn.style.opacity = '1';
            submitBtn.style.transform = 'translateY(0)';
        }, 750);
    }

    socialBtns.forEach(function (btn) {
        btn.addEventListener('mousemove', function (e) {
            var rect = btn.getBoundingClientRect();
            var x = e.clientX - rect.left - rect.width / 2;
            var y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = 'translateY(-3px) scale(1.02) translate(' + (x * 0.1) + 'px, ' + (y * 0.1) + 'px)';
        });
        btn.addEventListener('mouseleave', function () {
            btn.style.transform = 'translateY(0) scale(1)';
        });
    });

    var inputs = modal.querySelectorAll('.form-input');
    inputs.forEach(function (input) {
        input.addEventListener('focus', function () {
            var group = input.closest('.form-group');
            if (group) {
                group.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
                group.style.transform = 'scale(1.02)';
            }
        });
        input.addEventListener('blur', function () {
            var group = input.closest('.form-group');
            if (group) {
                group.style.transform = 'scale(1)';
            }
        });
    });

    var canvas = modal.querySelector('#loginParticles');
    if (canvas) {
        var container = modal.querySelector('.login-container');
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        var ctx = canvas.getContext('2d');
        var particles = [];
        var particleCount = 35;
        for (var p = 0; p < particleCount; p++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                r: Math.random() * 1.5 + 0.5,
                alpha: Math.random() * 0.4 + 0.1,
                color: ['143,0,255', '0,240,255', '255,0,168'][Math.floor(Math.random() * 3)]
            });
        }
        var animId;
        function drawParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(function (pt) {
                pt.x += pt.vx;
                pt.y += pt.vy;
                if (pt.x < 0) pt.x = canvas.width;
                if (pt.x > canvas.width) pt.x = 0;
                if (pt.y < 0) pt.y = canvas.height;
                if (pt.y > canvas.height) pt.y = 0;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(' + pt.color + ',' + pt.alpha + ')';
                ctx.fill();
            });
            for (var a = 0; a < particles.length; a++) {
                for (var b = a + 1; b < particles.length; b++) {
                    var dx = particles[a].x - particles[b].x;
                    var dy = particles[a].y - particles[b].y;
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 80) {
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.strokeStyle = 'rgba(124,92,252,' + (0.08 * (1 - dist / 80)) + ')';
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            animId = requestAnimationFrame(drawParticles);
        }
        drawParticles();
        var obs = new MutationObserver(function (list) {
            list.forEach(function (m) {
                m.removedNodes.forEach(function (n) {
                    if (n === modal || n.contains && n.contains(modal)) {
                        cancelAnimationFrame(animId);
                        obs.disconnect();
                    }
                });
            });
        });
        obs.observe(document.body, { childList: true });
    }
}

function closeModal(modal) {
    modal.classList.add('closing');
    setTimeout(() => modal.remove(), 300);
}

function handleSocialLogin(provider) {
    const activeProviders = {
        google: apiUrl('/api/auth/oauth/google'),
        github: apiUrl('/api/auth/oauth/github'),
        discord: apiUrl('/api/auth/oauth/discord')
    };
    if (activeProviders[provider]) {
        window.location.href = activeProviders[provider];
    } else {
        const names = { apple: 'Apple', twitter: 'X (Twitter)', microsoft: 'Microsoft' };
        showAuthNotification('Coming Soon', `${names[provider] || provider} login will be available soon.`, true);
    }
}

function showAuthNotification(title, message, isError, options) {
    options = options || {};
    var avatarUrl = options.avatar || '';
    var provider = options.provider || '';

    var notification = document.createElement('div');
    var borderColor = isError ? 'rgba(255, 70, 70, 0.3)' : 'rgba(220, 38, 38, 0.4)';
    var iconBg = isError ? 'rgba(255, 70, 70, 0.15)' : 'rgba(220, 38, 38, 0.15)';
    var iconColor = isError ? '#ff4646' : '#dc2626';
    var iconClass = isError ? 'fa-exclamation-circle' : 'fa-check-circle';
    var shadowColor = isError ? 'rgba(255, 70, 70, 0.2)' : 'rgba(220, 38, 38, 0.3)';

    // Provider-specific colors
    var providerColors = { google: '#4285F4', discord: '#5865F2', github: '#fff', email: '#dc2626' };
    var providerIcons = { google: 'fab fa-google', discord: 'fab fa-discord', github: 'fab fa-github', email: 'fas fa-envelope' };
    if (provider && providerColors[provider] && !isError) {
        iconColor = providerColors[provider];
        iconBg = providerColors[provider] + '22';
        borderColor = providerColors[provider] + '55';
        shadowColor = providerColors[provider] + '33';
        iconClass = providerIcons[provider] || iconClass;
    }

    notification.style.cssText =
        'position:fixed;top:100px;right:30px;' +
        'background:rgba(10,8,20,0.92);' +
        'backdrop-filter:blur(30px) saturate(180%);' +
        '-webkit-backdrop-filter:blur(30px) saturate(180%);' +
        'padding:16px 20px;border-radius:16px;' +
        'border:1px solid ' + borderColor + ';color:white;' +
        'font-family:"Space Grotesk","Outfit",sans-serif;font-size:14px;font-weight:600;' +
        'box-shadow:0 20px 60px rgba(0,0,0,0.5),0 0 1px ' + shadowColor + ' inset,0 0 20px ' + shadowColor + ';' +
        'z-index:10001;' +
        'animation:notificationSlideIn 0.5s cubic-bezier(0.34,1.56,0.64,1);' +
        'display:flex;align-items:center;gap:14px;' +
        'min-width:300px;max-width:420px;';

    // Build icon or avatar
    var iconHtml = '';
    if (avatarUrl && !isError) {
        iconHtml = '<img src="' + avatarUrl + '" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid ' + iconColor + ';flex-shrink:0;" onerror="this.style.display=\'none\'">';
    } else {
        iconHtml = '<div style="width:42px;height:42px;background:' + iconBg + ';border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
            '<i class="' + iconClass + '" style="font-size:20px;color:' + iconColor + ';"></i>' +
        '</div>';
    }

    // Provider badge
    var providerBadge = '';
    if (provider && providerIcons[provider] && !isError) {
        var pName = provider.charAt(0).toUpperCase() + provider.slice(1);
        providerBadge = '<div style="display:flex;align-items:center;gap:5px;margin-top:4px;">' +
            '<i class="' + providerIcons[provider] + '" style="font-size:11px;color:' + providerColors[provider] + ';"></i>' +
            '<span style="font-size:11px;color:rgba(255,255,255,0.5);font-weight:400;">via ' + pName + '</span>' +
        '</div>';
    }

    notification.innerHTML = iconHtml +
        '<div style="flex:1;">' +
            '<div style="font-weight:700;font-size:14px;margin-bottom:2px;color:white;">' + title + '</div>' +
            '<div style="font-size:12px;color:rgba(255,255,255,0.7);font-weight:500;">' + message + '</div>' +
            providerBadge +
        '</div>';

    document.body.appendChild(notification);
    setTimeout(function() {
        notification.style.animation = 'notificationSlideOut 0.4s cubic-bezier(0.6,0,0.8,0.4)';
        setTimeout(function() { notification.remove(); }, 400);
    }, 5000);
}

function updateUIForLoggedInUser(user) {
    // Store unified auth state
    localStorage.setItem('userLoggedIn', 'true');
    localStorage.setItem('sk_user', JSON.stringify(user));
    localStorage.setItem('userDisplayName', user.username || user.display_name || 'User');
    localStorage.setItem('userUsername', user.username || '');
    localStorage.setItem('userEmail', user.email || '');
    if (user.role) localStorage.setItem('userRole', user.role);
    if (user.provider) localStorage.setItem('userAuthMethod', user.provider);

    var displayName = user.username || user.display_name || 'User';
    var avatarUrl = user.avatar_url || user.avatar || localStorage.getItem('userAvatar') || '';
    if (avatarUrl) localStorage.setItem('userAvatar', avatarUrl);

    // Update dropdown
    var dropdownName = document.getElementById('dropdownUserName');
    var dropdownUsername = document.getElementById('dropdownUsername');
    var dropdownAvatar = document.getElementById('dropdownAvatarImg');
    var profileBtnImg = document.getElementById('profileBtnImg');
    var mobileProfileImg = document.getElementById('mobileProfileImg');
    var mobileProfileName = document.getElementById('mobileProfileName');

    if (dropdownName) dropdownName.textContent = displayName;
    if (dropdownUsername) dropdownUsername.textContent = '@' + (user.username || 'user');
    if (avatarUrl) {
        if (dropdownAvatar) dropdownAvatar.src = avatarUrl;
        if (profileBtnImg) profileBtnImg.src = avatarUrl;
        if (mobileProfileImg) mobileProfileImg.src = avatarUrl;
    }
    if (mobileProfileName) mobileProfileName.textContent = displayName;

    // Show profile button, hide login button
    var loginBtnNav = document.getElementById('loginBtnNav');
    var profileBtn = document.getElementById('profileBtn');
    var mobileLoginBtn = document.getElementById('mobileLoginBtn');
    var mobileProfileBtn = document.getElementById('mobileProfileBtn');

    if (loginBtnNav) loginBtnNav.style.display = 'none';
    if (profileBtn) profileBtn.style.display = 'flex';
    if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
    if (mobileProfileBtn) mobileProfileBtn.style.display = 'flex';

    // Auth method badge
    var authMethod = user.provider || localStorage.getItem('userAuthMethod') || 'email';
    var authBadge = document.getElementById('authMethodBadge');
    if (authBadge) {
        var providerConfig = {
            google: { icon: 'fab fa-google', label: 'Google', color: '#4285F4' },
            github: { icon: 'fab fa-github', label: 'GitHub', color: '#fff' },
            discord: { icon: 'fab fa-discord', label: 'Discord', color: '#5865F2' },
            email: { icon: 'fas fa-envelope', label: 'Email', color: '#7c5cfc' }
        };
        var cfg = providerConfig[authMethod] || providerConfig.email;
        authBadge.innerHTML = '<i class="' + cfg.icon + '" style="color:' + cfg.color + '"></i> via ' + cfg.label;
        authBadge.style.display = 'flex';
        authBadge.className = 'auth-method-badge auth-' + authMethod;
    }
}

function resetUIForGuest() {
    var guestAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%238f00ff'/%3E%3Cstop offset='100%25' stop-color='%2300f0ff'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='60' cy='60' r='60' fill='url(%23g)'/%3E%3Ccircle cx='60' cy='45' r='20' fill='rgba(255,255,255,0.9)'/%3E%3Cellipse cx='60' cy='95' rx='35' ry='25' fill='rgba(255,255,255,0.9)'/%3E%3C/svg%3E";

    // Clear all auth data
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('userDisplayName');
    localStorage.removeItem('userUsername');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('userBio');
    localStorage.removeItem('userStatus');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userAuthMethod');
    localStorage.removeItem('sk_token');
    localStorage.removeItem('sk_user');

    // Reset dropdown to guest
    var dn = document.getElementById('dropdownUserName');
    var du = document.getElementById('dropdownUsername');
    var da = document.getElementById('dropdownAvatarImg');
    if (dn) dn.textContent = 'Guest';
    if (du) du.textContent = '@guest';
    if (da) da.src = guestAvatar;

    // Show login button, hide profile button
    var loginBtnNav = document.getElementById('loginBtnNav');
    var profileBtn = document.getElementById('profileBtn');
    var mobileLoginBtn = document.getElementById('mobileLoginBtn');
    var mobileProfileBtn = document.getElementById('mobileProfileBtn');

    if (loginBtnNav) loginBtnNav.style.display = '';
    if (profileBtn) profileBtn.style.display = 'none';
    if (mobileLoginBtn) mobileLoginBtn.style.display = '';
    if (mobileProfileBtn) mobileProfileBtn.style.display = 'none';
}

async function handleEmailLogin(form, action = 'signin') {
    const email = form.querySelector('input[type="email"]').value.trim();
    const password = form.querySelector('input[type="password"]').value;
    const submitBtn = form.querySelector('.login-submit');

    if (!email || !password) {
        showAuthNotification('Missing Fields', 'Please fill in all required fields.', true);
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = action === 'signup' ? 'Creating Account...' : 'Signing In...';
    }

    try {
        const endpoint = action === 'signup' ? apiUrl('/api/auth/register') : apiUrl('/api/auth/login');
        const rememberToggle = form.closest('.login-modal')?.querySelector('#rememberMeToggle');
        const rememberMe = rememberToggle ? rememberToggle.checked : false;
        const body = { email, password, remember_me: rememberMe };

        if (action === 'signup') {
            const nameInput = form.querySelector('input[type="text"]');
            const displayName = nameInput ? nameInput.value.trim() : '';
            if (!displayName) {
                showAuthNotification('Name Required', 'Please enter your full name.', true);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.querySelector('span').textContent = 'Create Account';
                }
                return;
            }
            body.display_name = displayName;
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.status === 'success') {
            const successTitle = action === 'signup' ? 'Account Created!' : 'Welcome Back!';
            const successMsg = action === 'signup'
                ? `Welcome to Script Kittens, ${data.user.display_name}!`
                : `Signed in as ${data.user.display_name}`;

            showAuthNotification(successTitle, successMsg, false);
            updateUIForLoggedInUser(data.user);

            const modal = form.closest('.login-modal');
            if (modal) {
                setTimeout(() => closeModal(modal), 800);
            }
        } else {
            showAuthNotification('Error', data.message || 'Something went wrong.', true);
        }
    } catch (err) {
        showAuthNotification('Connection Error', 'Could not reach the server. Please try again.', true);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.querySelector('span').textContent = action === 'signup' ? 'Create Account' : 'Sign In';
        }
    }
}

// Add notification animations
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes notificationSlideIn {
        from {
            opacity: 0;
            transform: translateX(120px) scale(0.9);
            filter: blur(10px);
        }
        to {
            opacity: 1;
            transform: translateX(0) scale(1);
            filter: blur(0);
        }
    }
    
    @keyframes notificationSlideOut {
        from {
            opacity: 1;
            transform: translateX(0) scale(1);
            filter: blur(0);
        }
        to {
            opacity: 0;
            transform: translateX(120px) scale(0.9);
            filter: blur(10px);
        }
    }
`;
document.head.appendChild(notificationStyles);

function checkAuthSession() {
    var params = new URLSearchParams(window.location.search);
    var oauthProvider = params.get('auth_success');
    var oauthName = params.get('name') ? decodeURIComponent(params.get('name')) : '';
    var showWelcome = !!oauthProvider; // show toast after OAuth redirect

    if (params.get('auth_success') || params.get('auth_error')) {
        window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('auth_error')) {
        showAuthNotification('Login Failed', decodeURIComponent(params.get('auth_error')), true);
    }

    // Try cookie-based auth (works across subdomains)
    var token = localStorage.getItem('sk_token');
    var headers = {};
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    fetch(apiUrl('/api/auth/me'), {
        credentials: 'include',
        headers: headers
    })
        .then(function(res) {
            if (!res.ok) throw new Error('Not authenticated');
            return res.json();
        })
        .then(function(data) {
            if (data.user) {
                updateUIForLoggedInUser(data.user);
                if (typeof loadProfileExtras === 'function') loadProfileExtras();

                // Show welcome notification
                if (showWelcome) {
                    var displayName = data.user.username || oauthName || 'User';
                    var avatar = data.user.avatar_url || '';
                    var provider = oauthProvider || data.user.provider || '';
                    showAuthNotification(
                        'Welcome back, ' + displayName + '!',
                        'Signed in successfully',
                        false,
                        { avatar: avatar, provider: provider }
                    );
                }
            } else {
                resetUIForGuest();
            }
        })
        .catch(function() {
            // Check if we have cached user data
            var cachedUser = localStorage.getItem('sk_user');
            if (cachedUser && localStorage.getItem('sk_token')) {
                try {
                    var user = JSON.parse(cachedUser);
                    updateUIForLoggedInUser(user);
                    if (showWelcome) {
                        showAuthNotification(
                            'Welcome back, ' + (user.username || 'User') + '!',
                            'Signed in successfully',
                            false,
                            { avatar: user.avatar_url || '', provider: oauthProvider || user.provider || '' }
                        );
                    }
                } catch (e) {
                    resetUIForGuest();
                }
            } else {
                resetUIForGuest();
            }
        });
}

console.log('%c🐱 Script Kittens v3.0', 'color: #7c5cfc; font-size: 24px; font-weight: bold;');
console.log('%cCreated by Furqan | Ultimate Edition', 'color: #a78bfa; font-size: 14px;');


/* ============ USER PROFILE SYSTEM ============ */
function initUserProfile() {
    const profileBtn = document.getElementById('profileBtn');
    const mobileProfileBtn = document.getElementById('mobileProfileBtn');
    const dropdown = document.getElementById('userDropdown');
    const closeBtn = dropdown?.querySelector('.ud-close-btn');

    if (!dropdown) return;

    // Always run auth check — don't depend on profileBtn existing
    checkAuthSession();
    if (typeof loadProfileDataFromStorage === 'function') loadProfileDataFromStorage();

    function closeDropdown() {
        dropdown.classList.remove('active');
        const floatingGifs = document.querySelector('.floating-anime-gifs');
        const fantasyOrbs = document.querySelector('.fantasy-orbs');
        if (floatingGifs) floatingGifs.style.opacity = '1';
        if (fantasyOrbs) fantasyOrbs.style.opacity = '1';
    }

    function toggleDropdown(e) {
        e.stopPropagation();
        dropdown.classList.toggle('active');
        const floatingGifs = document.querySelector('.floating-anime-gifs');
        const fantasyOrbs = document.querySelector('.fantasy-orbs');
        if (dropdown.classList.contains('active')) {
            if (floatingGifs) floatingGifs.style.opacity = '0';
            if (fantasyOrbs) fantasyOrbs.style.opacity = '0';
        } else {
            if (floatingGifs) floatingGifs.style.opacity = '1';
            if (fantasyOrbs) fantasyOrbs.style.opacity = '1';
        }
    }

    if (profileBtn) profileBtn.addEventListener('click', toggleDropdown);
    if (mobileProfileBtn) mobileProfileBtn.addEventListener('click', toggleDropdown);

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeDropdown();
        });
    }

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !(profileBtn && profileBtn.contains(e.target)) && !(mobileProfileBtn && mobileProfileBtn.contains(e.target))) {
            closeDropdown();
        }
    });

    dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dropdown.classList.contains('active')) {
            closeDropdown();
        }
    });

    const menuItems = dropdown.querySelectorAll('.ud-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const action = item.getAttribute('data-action');

            if (action === 'help') {
                e.preventDefault();
                alert('Need help? Contact us at support@scriptkittens.com or join our Discord community.');
                closeDropdown();
            } else if (action === 'shortcuts') {
                e.preventDefault();
                alert('Keyboard Shortcuts:\n\nESC — Close dropdown\nCTRL+P — Open profile\nCTRL+, — Settings\n↑↓ — Navigate menus');
                closeDropdown();
            } else if (action === 'signout') {
                e.preventDefault();
                e.stopPropagation();
                performSignOut(closeDropdown);
            }
        });
    });
}

function performSignOut(closeDropdownFn) {
    if (closeDropdownFn) closeDropdownFn();
    showSignOutConfirmation();
}

function showSignOutConfirmation() {
    var existing = document.querySelector('.signout-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.className = 'signout-overlay';

    var userName = localStorage.getItem('userDisplayName') || 'User';
    var userAvatar = localStorage.getItem('userAvatar') || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%238f00ff'/%3E%3Cstop offset='100%25' stop-color='%2300f0ff'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='60' cy='60' r='60' fill='url(%23g)'/%3E%3Ccircle cx='60' cy='45' r='20' fill='rgba(255,255,255,0.9)'/%3E%3Cellipse cx='60' cy='95' rx='35' ry='25' fill='rgba(255,255,255,0.9)'/%3E%3C/svg%3E";

    overlay.innerHTML = '<div class="signout-card">' +
        '<div class="signout-glow signout-glow-1"></div>' +
        '<div class="signout-glow signout-glow-2"></div>' +
        '<div class="signout-icon-wrap">' +
        '<div class="signout-icon-ring">' +
        '<i class="fas fa-sign-out-alt"></i>' +
        '</div>' +
        '</div>' +
        '<div class="signout-avatar-wrap">' +
        '<img src="' + userAvatar + '" alt="Avatar" class="signout-avatar">' +
        '</div>' +
        '<h2 class="signout-title">Sign Out</h2>' +
        '<p class="signout-subtitle">Are you sure you want to sign out, <strong>' + userName + '</strong>?</p>' +
        '<p class="signout-desc">You\'ll need to sign in again to access your profile and saved data.</p>' +
        '<div class="signout-actions">' +
        '<button class="signout-btn-cancel" id="signoutCancel"><i class="fas fa-arrow-left"></i> Stay Signed In</button>' +
        '<button class="signout-btn-confirm" id="signoutConfirm"><i class="fas fa-sign-out-alt"></i> Sign Out</button>' +
        '</div>' +
        '</div>';

    document.body.appendChild(overlay);
    requestAnimationFrame(function () {
        overlay.classList.add('active');
    });

    document.getElementById('signoutCancel').addEventListener('click', function () {
        overlay.classList.remove('active');
        setTimeout(function () { overlay.remove(); }, 350);
    });

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            setTimeout(function () { overlay.remove(); }, 350);
        }
    });

    document.getElementById('signoutConfirm').addEventListener('click', function () {
        var btn = this;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing Out...';

        var token = localStorage.getItem('sk_token');
        var headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;

        fetch(apiUrl('/api/auth/logout'), {
            method: 'POST',
            credentials: 'include',
            headers: headers
        })
            .finally(function () {
                // Clear ALL auth data
                localStorage.removeItem('userLoggedIn');
                localStorage.removeItem('userDisplayName');
                localStorage.removeItem('userUsername');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userAvatar');
                localStorage.removeItem('userBio');
                localStorage.removeItem('userStatus');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userAuthMethod');
                localStorage.removeItem('sk_token');
                localStorage.removeItem('sk_user');
                btn.innerHTML = '<i class="fas fa-check"></i> Signed Out!';
                btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                setTimeout(function () { window.location.reload(); }, 600);
            });
    });
}

function loadProfileExtras() {
    var bioEl = document.getElementById('dropdownBio');
    var localBio = localStorage.getItem('userBio');
    if (localBio && bioEl) bioEl.textContent = localBio;

    var localStatus = localStorage.getItem('userStatus');
    if (localStatus) updateProfileStatus(localStatus);

    fetch(apiUrl('/api/profile'), { credentials: 'include' })
        .then(res => { if (!res.ok) throw new Error('API unavailable'); return res.json(); })
        .then(resp => {
            var data = resp.profile || resp;
            var pointsEl = document.getElementById('dropdownPoints');
            var levelEl = document.getElementById('dropdownLevel');
            var achievementsEl = document.getElementById('dropdownAchievements');

            if (data.bio && bioEl) {
                bioEl.textContent = data.bio;
                localStorage.setItem('userBio', data.bio);
            } else if (!data.bio && bioEl && !localBio) {
                bioEl.textContent = 'I Love Script Kittens';
                localStorage.setItem('userBio', 'I Love Script Kittens');
            }
            if (data.points !== undefined && pointsEl) pointsEl.textContent = Number(data.points).toLocaleString();
            if (data.level !== undefined && levelEl) levelEl.textContent = data.level;
            if (data.achievements !== undefined && achievementsEl) achievementsEl.textContent = data.achievements;

            var status = data.status || 'Available';
            localStorage.setItem('userStatus', status);
            updateProfileStatus(status);
        })
        .catch(() => { });
}

function updateProfileStatus(status) {
    const colors = {
        'Available': '#10b981', 'Busy': '#ef4444', 'Away': '#f59e0b',
        'Do Not Disturb': '#dc2626', 'Invisible': '#6b7280'
    };
    const classMap = {
        'Available': 'online', 'Busy': 'busy', 'Away': 'away',
        'Do Not Disturb': 'dnd', 'Invisible': 'offline'
    };
    const color = colors[status] || '#10b981';
    const statusIndicator = document.querySelector('.user-status-indicator');
    if (statusIndicator) {
        statusIndicator.className = 'user-status-indicator ' + (classMap[status] || 'online');
    }
    const profileBtnStatus = document.querySelector('.profile-btn-status');
    if (profileBtnStatus) {
        profileBtnStatus.style.background = color;
        profileBtnStatus.style.boxShadow = '0 0 6px ' + color;
    }
    const dropdownDot = document.getElementById('dropdownStatusDot');
    if (dropdownDot) {
        dropdownDot.style.background = color;
    }
    const dropdownText = document.getElementById('dropdownStatusText');
    if (dropdownText) {
        dropdownText.textContent = status;
    }
}

/* ============ STATUS PICKER IN DROPDOWN ============ */
(function () {
    document.addEventListener('click', function (e) {
        var statusLine = document.getElementById('udStatusLine');
        var picker = document.getElementById('udStatusPicker');
        if (!statusLine || !picker) return;

        if (e.target.closest('.ud-status-opt')) {
            var btn = e.target.closest('.ud-status-opt');
            var newStatus = btn.dataset.status;
            picker.classList.remove('active');
            updateProfileStatus(newStatus);
            localStorage.setItem('userStatus', newStatus);
            fetch(apiUrl('/api/profile'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            }).catch(function () { });
            e.stopPropagation();
            return;
        }

        if (e.target.closest('#udStatusLine') && !e.target.closest('.ud-status-picker')) {
            picker.classList.toggle('active');
            e.stopPropagation();
            return;
        }

        picker.classList.remove('active');
    });
})();

/* ============ LOAD PROFILE DATA FROM LOCALSTORAGE ============ */
function loadProfileDataFromStorage() {
    const displayName = localStorage.getItem('userDisplayName');
    const username = localStorage.getItem('userUsername');
    const avatar = localStorage.getItem('userAvatar');
    const status = localStorage.getItem('userStatus');
    const bio = localStorage.getItem('userBio');

    const dropdownName = document.getElementById('dropdownUserName');
    const dropdownUsername = document.getElementById('dropdownUsername');
    const dropdownAvatar = document.getElementById('dropdownAvatarImg');
    const profileBtnImg = document.getElementById('profileBtnImg') || document.querySelector('#profileBtn img');
    const bioEl = document.getElementById('dropdownBio');

    if (displayName && dropdownName) dropdownName.textContent = displayName;
    if (username && dropdownUsername) dropdownUsername.textContent = '@' + username;
    if (avatar) {
        if (dropdownAvatar) dropdownAvatar.src = avatar;
        if (profileBtnImg) profileBtnImg.src = avatar;
    }
    if (bio && bioEl) bioEl.textContent = bio;

    if (status) {
        updateProfileStatus(status);
    }
}

/* ============ PAGE TRANSITION (GSAP) ============ */
function initPageTransition() {
    const overlay = document.getElementById('page-transition-overlay');
    const triggerBtn = document.getElementById('openFreeCheatsVault');
    const spinner = overlay ? overlay.querySelector('.transition-spinner') : null;

    // ENTRY ANIMATION (from Index to Cheats)
    if (triggerBtn && overlay) {
        triggerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetUrl = triggerBtn.getAttribute('href');

            // Skip preloader on next page
            sessionStorage.setItem('skipPreloader', '1');

            if (typeof gsap !== 'undefined') {
                gsap.to(overlay, {
                    duration: 0.1,
                    autoAlpha: 1
                });

                gsap.to(overlay, {
                    duration: 1.5,
                    opacity: 1,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        setTimeout(() => {
                            window.location.href = targetUrl;
                        }, 500);
                    }
                });

                if (spinner) {
                    gsap.fromTo(spinner,
                        { scale: 0, opacity: 0 },
                        { duration: 1, scale: 1, opacity: 1, ease: 'back.out(1.7)', delay: 0.5 }
                    );
                }
            } else {
                window.location.href = targetUrl;
            }
        });
    }

    // EXIT ANIMATION (Page Load on Cheats)
    if (window.location.pathname.includes('cheats') && overlay) {
        if (typeof gsap !== 'undefined') {
            // Set initial state
            gsap.set(overlay, { autoAlpha: 1, opacity: 1 });

            // Simulate 3-4s total load
            setTimeout(() => {
                gsap.to(overlay, {
                    duration: 1.5,
                    opacity: 0,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        gsap.set(overlay, { autoAlpha: 0 });
                    }
                });

                if (spinner) {
                    gsap.to(spinner, {
                        duration: 0.5,
                        scale: 0,
                        opacity: 0,
                        ease: 'back.in(1.7)'
                    });
                }
            }, 2000);
        } else {
            overlay.style.display = 'none';
        }
    }
}

/* ================================================
   TICKER: Auto-hide broken logos, show fallback text
   ================================================ */
document.addEventListener('DOMContentLoaded', () => {
    const tickerImgs = document.querySelectorAll('.ticker-item img');
    tickerImgs.forEach(img => {
        // If already broken (cached 404)
        if (!img.naturalWidth && img.complete) {
            img.style.display = 'none';
            const fallback = img.nextElementSibling;
            if (fallback) fallback.style.display = 'block';
        }
        // On load error
        img.addEventListener('error', () => {
            img.style.display = 'none';
            const fallback = img.nextElementSibling;
            if (fallback) fallback.style.display = 'block';
        });
    });
});

/* ============ CONTENT PROTECTION ============ */
// Block right-click context menu
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});

// Block keyboard shortcuts for save/copy/inspect
document.addEventListener('keydown', function(e) {
    // Ctrl+S, Ctrl+U, Ctrl+Shift+I, F12
    if ((e.ctrlKey && (e.key === 's' || e.key === 'u')) ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        e.key === 'F12') {
        e.preventDefault();
        return false;
    }
});

// Block drag on all images
document.addEventListener('dragstart', function(e) {
    if (e.target.tagName === 'IMG') {
        e.preventDefault();
        return false;
    }
});

// ============================================================
// 21st.dev COMPONENTS — Lightweight Master Engine
// ONE RAF loop, IntersectionObserver visibility gating,
// low-end device detection, auto-pause when offscreen
// ============================================================
// Wrapped in DOMContentLoaded so defer'd GSAP scripts are loaded
document.addEventListener('DOMContentLoaded', function skAnimationsReady() {
(function skAnimations() {
    'use strict';

    // ── Low-end device detection ──
    const isLowEnd = (function() {
        const mem  = navigator.deviceMemory || 8;
        const cores = navigator.hardwareConcurrency || 4;
        return mem <= 4 || cores <= 2;
    })();

    // ── Visibility tracker (IntersectionObserver) ──
    const visible = {};
    function trackVisibility(id, el) {
        if (!el) return;
        visible[id] = false;
        const obs = new IntersectionObserver(entries => {
            visible[id] = entries[0].isIntersecting;
        }, { threshold: 0.05 });
        obs.observe(el);
    }

    // ── 1. STARS BACKGROUND — canvas twinkle ──
    const starCanvases = [];
    document.querySelectorAll('.stars-bg-canvas').forEach(function(canvas, i) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const id = 'stars-' + i;
        trackVisibility(id, canvas.parentElement);

        const density = isLowEnd ? 0.00006 : 0.00012;
        var stars = [], w = 0, h = 0;

        function resize() {
            var rect = canvas.getBoundingClientRect();
            w = canvas.width  = rect.width;
            h = canvas.height = rect.height;
            var count = Math.floor(w * h * density);
            stars = [];
            for (var j = 0; j < count; j++) {
                stars.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    r: Math.random() * 0.5 + 0.3,
                    o: Math.random() * 0.4 + 0.4,
                    spd: 1.0 + Math.random() * 1.0,
                    tw: Math.random() < 0.7,
                });
            }
        }
        resize();
        var ro = new ResizeObserver(resize);
        ro.observe(canvas);

        starCanvases.push({ id: id, ctx: ctx, getStars: function(){ return stars; }, getW: function(){ return w; }, getH: function(){ return h; } });
    });

    function drawStars(now) {
        for (var k = 0; k < starCanvases.length; k++) {
            var sc = starCanvases[k];
            if (!visible[sc.id]) continue;
            var ctx = sc.ctx, w = sc.getW(), h = sc.getH(), stars = sc.getStars();
            ctx.clearRect(0, 0, w, h);
            for (var i = 0; i < stars.length; i++) {
                var s = stars[i];
                var alpha = s.tw ? 0.15 + Math.abs(Math.sin(now / s.spd) * 0.85) : s.o;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, 6.2832);
                ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
                ctx.fill();
            }
        }
    }

    // ── 2. HERO SMOKE — WebGL2, full background ──
    var smokeRender = null;
    (function initSmoke() {
        var canvas = document.getElementById('hero-smoke-canvas');
        if (!canvas) return;
        if (isLowEnd) { canvas.style.display = 'none'; return; }

        var gl = canvas.getContext('webgl2');
        if (!gl) { canvas.style.display = 'none'; return; }

        trackVisibility('smoke', canvas.parentElement);

        var vSrc = '#version 300 es\nprecision highp float;\nin vec4 position;\nvoid main(){ gl_Position = position; }';
        var fSrc = '#version 300 es\nprecision highp float;\nout vec4 O;\nuniform float time;\nuniform vec2 resolution;\nuniform vec3 u_color;\n#define FC gl_FragCoord.xy\n#define R resolution\n#define T (time + 660.)\nfloat rnd(vec2 p){ p=fract(p*vec2(12.9898,78.233)); p+=dot(p,p+34.56); return fract(p.x*p.y); }\nfloat noise(vec2 p){ vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f); return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y); }\nfloat fbm(vec2 p){ float t=.0,a=1.; for(int i=0;i<4;i++){ t+=a*noise(p); p*=mat2(1,-1.2,.2,1.2)*2.; a*=.5; } return t; }\nvoid main(){\n  vec2 uv=(FC-.5*R)/R.y;\n  vec3 col=vec3(1);\n  uv.x+=.25; uv*=vec2(2,1);\n  float n=fbm(uv*.28-vec2(T*.008,0.));\n  n=noise(uv*3.+n*2.);\n  col.r-=fbm(uv+vec2(0,T*.012)+n);\n  col.g-=fbm(uv*1.003+vec2(0,T*.012)+n+.003);\n  col.b-=fbm(uv*1.006+vec2(0,T*.012)+n+.006);\n  col=mix(col,u_color,dot(col,vec3(.21,.71,.07)));\n  col=mix(vec3(0.0),col,min(time*.1,1.));\n  col=clamp(col,0.0,1.);\n  vec2 ndc=FC/R;\n  float edgeL=1.0-smoothstep(0.0,0.35,ndc.x);\n  float edgeR=smoothstep(0.65,1.0,ndc.x);\n  float edgeT=smoothstep(0.7,1.0,ndc.y);\n  float edgeB=1.0-smoothstep(0.0,0.3,ndc.y);\n  float edgeMask=max(max(edgeL,edgeR),max(edgeT,edgeB));\n  float leftBoost=1.0-smoothstep(0.0,0.5,ndc.x);\n  edgeMask=edgeMask*0.7+leftBoost*0.45;\n  float cx=(ndc.x-0.7)*2.5;\n  float cy=(ndc.y-0.5)*2.0;\n  float logoDist=cx*cx+cy*cy;\n  float logoKill=smoothstep(0.0,0.6,logoDist);\n  edgeMask*=mix(0.15,1.0,logoKill);\n  edgeMask=clamp(edgeMask,0.0,1.0);\n  col*=edgeMask;\n  O=vec4(col,1);\n}';

        function compile(type, src) {
            var s = gl.createShader(type);
            gl.shaderSource(s, src); gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
            return s;
        }
        var vs = compile(gl.VERTEX_SHADER, vSrc);
        var fs = compile(gl.FRAGMENT_SHADER, fSrc);
        if (!vs || !fs) return;
        var prog = gl.createProgram();
        gl.attachShader(prog, vs); gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1,-1,-1,1,1,1,-1]), gl.STATIC_DRAW);
        var posLoc = gl.getAttribLocation(prog, 'position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        var uTime = gl.getUniformLocation(prog, 'time');
        var uRes  = gl.getUniformLocation(prog, 'resolution');
        var uCol  = gl.getUniformLocation(prog, 'u_color');
        var color = [0.863, 0.149, 0.149];

        function resize() {
            canvas.width  = Math.floor(canvas.offsetWidth  * 0.5);
            canvas.height = Math.floor(canvas.offsetHeight * 0.5);
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
        resize();
        window.addEventListener('resize', resize);

        smokeRender = function(now) {
            if (!visible['smoke']) return;
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(prog);
            gl.uniform2f(uRes, canvas.width, canvas.height);
            gl.uniform1f(uTime, now * 0.001);
            gl.uniform3fv(uCol, color);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
    })();

    // ── 3. PRICING PLASMA SHADER — WebGL, paused offscreen ──
    var pricingRender = null;
    (function initPricingShader() {
        var canvas = document.getElementById('pricing-shader-canvas');
        if (!canvas) return;
        if (isLowEnd) { canvas.style.display = 'none'; return; }

        var gl = canvas.getContext('webgl');
        if (!gl) return;
        trackVisibility('pricing', canvas);

        var vSrc = 'attribute vec4 aVertexPosition; void main(){ gl_Position = aVertexPosition; }';
        var fSrc = 'precision highp float;\nuniform vec2 iResolution;\nuniform float iTime;\nconst float overallSpeed=0.2;\nconst float gridSmoothWidth=0.015;\nconst float axisWidth=0.05;\nconst float majorLineWidth=0.025;\nconst float minorLineWidth=0.0125;\nconst float majorLineFrequency=5.0;\nconst float minorLineFrequency=1.0;\nconst float scale=5.0;\nconst vec4 lineColor=vec4(0.4,0.2,0.8,1.0);\nconst float minLineWidth=0.01;\nconst float maxLineWidth=0.2;\nconst float lineSpeed=1.0*overallSpeed;\nconst float lineAmplitude=1.0;\nconst float lineFrequency=0.2;\nconst float warpSpeed=0.2*overallSpeed;\nconst float warpFrequency=0.5;\nconst float warpAmplitude=1.0;\nconst float offsetFrequency=0.5;\nconst float offsetSpeed=1.33*overallSpeed;\nconst float minOffsetSpread=0.6;\nconst float maxOffsetSpread=2.0;\nconst int linesPerGroup=16;\n#define drawSmoothLine(pos,halfWidth,t) smoothstep(halfWidth,0.0,abs(pos-(t)))\n#define drawCrispLine(pos,halfWidth,t) smoothstep(halfWidth+gridSmoothWidth,halfWidth,abs(pos-(t)))\n#define drawCircle(pos,radius,coord) smoothstep(radius+gridSmoothWidth,radius,length(coord-(pos)))\nfloat random(float t){return(cos(t)+cos(t*1.3+1.3)+cos(t*1.4+1.4))/3.0;}\nfloat getPlasmaY(float x,float hf,float offset){return random(x*lineFrequency+iTime*lineSpeed)*hf*lineAmplitude+offset;}\nvoid main(){\n  vec2 uv=gl_FragCoord.xy/iResolution.xy;\n  vec2 space=(gl_FragCoord.xy-iResolution.xy/2.0)/iResolution.x*2.0*scale;\n  float hf=1.0-(cos(uv.x*6.28)*0.5+0.5);\n  float vf=1.0-(cos(uv.y*6.28)*0.5+0.5);\n  space.y+=random(space.x*warpFrequency+iTime*warpSpeed)*warpAmplitude*(0.5+hf);\n  space.x+=random(space.y*warpFrequency+iTime*warpSpeed+2.0)*warpAmplitude*hf;\n  vec4 lines=vec4(0.0);\n  for(int l=0;l<16;l++){\n    float nli=float(l)/16.0;\n    float ot=iTime*offsetSpeed;\n    float op=float(l)+space.x*offsetFrequency;\n    float r=random(op+ot)*0.5+0.5;\n    float hw=mix(minLineWidth,maxLineWidth,r*hf)/2.0;\n    float offset=random(op+ot*(1.0+nli))*mix(minOffsetSpread,maxOffsetSpread,hf);\n    float lp=getPlasmaY(space.x,hf,offset);\n    float line=drawSmoothLine(lp,hw,space.y)/2.0+drawCrispLine(lp,hw*0.15,space.y);\n    float cx=mod(float(l)+iTime*lineSpeed,25.0)-12.0;\n    vec2 cp=vec2(cx,getPlasmaY(cx,hf,offset));\n    float circle=drawCircle(cp,0.01,space)*4.0;\n    line=line+circle;\n    lines+=line*lineColor*r;\n  }\n  vec4 bg1=vec4(0.0,0.0,0.0,1.0);\n  vec4 bg2=vec4(0.03,0.01,0.06,1.0);\n  vec4 fragColor=mix(bg1,bg2,uv.x);\n  fragColor*=vf;\n  fragColor.a=1.0;\n  fragColor+=lines;\n  gl_FragColor=fragColor;\n}';

        function mk(type, src) {
            var s = gl.createShader(type);
            gl.shaderSource(s, src); gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                console.warn('Pricing shader error:', gl.getShaderInfoLog(s));
                return null;
            }
            return s;
        }
        var vs = mk(gl.VERTEX_SHADER, vSrc);
        var fs = mk(gl.FRAGMENT_SHADER, fSrc);
        if (!vs || !fs) return;
        var prog = gl.createProgram();
        gl.attachShader(prog, vs); gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
        var p = gl.getAttribLocation(prog, 'aVertexPosition');
        gl.enableVertexAttribArray(p);
        gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
        var uRes  = gl.getUniformLocation(prog, 'iResolution');
        var uTime = gl.getUniformLocation(prog, 'iTime');
        var startTime = Date.now();

        function resize() {
            canvas.width  = Math.min(canvas.offsetWidth  || 800, 800);
            canvas.height = Math.min(canvas.offsetHeight || 400, 400);
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
        resize();
        window.addEventListener('resize', resize);

        pricingRender = function() {
            if (!visible['pricing']) return;
            var t = (Date.now() - startTime) / 1000;
            gl.useProgram(prog);
            gl.uniform2f(uRes, canvas.width, canvas.height);
            gl.uniform1f(uTime, t);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
    })();

    // ── 4. RGB WAVE — WebGL, low-res, paused offscreen (testimonials section) ──
    var footerRender = null;
    (function initFooterRGB() {
        var canvas = document.getElementById('footer-rgb-canvas');
        if (!canvas) return;
        if (isLowEnd) { canvas.style.display = 'none'; return; }

        var gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) return;
        trackVisibility('testimonials-rgb', canvas.parentElement);

        var vSrc = 'attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos,0.,1.); }';
        var fSrc = 'precision highp float;\nuniform float u_time;\nuniform vec2 u_res;\nvoid main(){\n  vec2 uv = gl_FragCoord.xy / u_res;\n  float w = sin(uv.x*3.+u_time)*.15;\n  float d = .03;\n  float r = smoothstep(.06,0.,abs(uv.y-.5-w-d));\n  float g = smoothstep(.06,0.,abs(uv.y-.5-w));\n  float b = smoothstep(.06,0.,abs(uv.y-.5-w+d));\n  vec3 c = vec3(r,g,b);\n  c = mix(c, c*vec3(1.4,.3,.3), .5);\n  gl_FragColor = vec4(c,1.);\n}';

        function mk(type, src) {
            var s = gl.createShader(type);
            gl.shaderSource(s, src); gl.compileShader(s);
            return s;
        }
        var prog = gl.createProgram();
        gl.attachShader(prog, mk(gl.VERTEX_SHADER, vSrc));
        gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, fSrc));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
        var p = gl.getAttribLocation(prog, 'a_pos');
        gl.enableVertexAttribArray(p);
        gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
        var uTime = gl.getUniformLocation(prog, 'u_time');
        var uRes  = gl.getUniformLocation(prog, 'u_res');

        function resize() {
            canvas.width  = Math.min(canvas.offsetWidth  || 600, 600);
            canvas.height = Math.min(canvas.offsetHeight || 150, 150);
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
        resize();
        window.addEventListener('resize', resize);

        var rgbFrameCount = 0;
        footerRender = function(now) {
            if (!visible['testimonials-rgb']) return;
            rgbFrameCount++;
            if (rgbFrameCount % 2 !== 0) return; // render every other frame to reduce GPU load
            gl.useProgram(prog);
            gl.uniform1f(uTime, now * 0.001);
            gl.uniform2f(uRes, canvas.width, canvas.height);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
    })();

    // ── 4. TESTIMONIALS — build cards, CSS-only scroll ──
    (function initTestimonials() {
        var container = document.getElementById('testimonials-columns');
        if (!container) return;

        var reviews = [
            { name: 'Kumail Haider', role: 'Fortnite Player', stars: 5, text: 'Been using Script Kittens for 3 months now. Zero bans, the aimbot feels super smooth and legit. Support was quick when I had setup issues too.' },
            { name: 'Khuzaima', role: 'Valorant Ranked', stars: 4, text: 'ESP is solid and helped me climb ranks fast. Only thing is the panel takes a sec to load sometimes. But gameplay wise its undetected and clean.' },
            { name: 'Saad Ahmed', role: 'CS2 Player', stars: 5, text: 'Radar hack is actually insane. 6 months in and VAC hasnt touched me once. Updates come out fast too whenever theres a new patch.' },
            { name: 'Ali Raza', role: 'Roblox Scripter', stars: 5, text: 'The Code Vault is worth it just for the Roblox scripts honestly. Clean code, well documented. Saved me hours of work.' },
            { name: 'Hassan Sheikh', role: 'Warzone Player', stars: 3, text: 'No recoil script works great but I wish there were more customization options. Streamer mode is a nice touch though.' },
            { name: 'Bilal Khan', role: 'API Developer', stars: 5, text: 'API integration was surprisingly easy. Had it running in under 30 minutes. The pricing is fair and response times are fast.' },
            { name: 'Zain Malik', role: 'Apex Legends', stars: 4, text: 'External Kitty Panel is the best tool Ive used. Speed hack on Roblox is fun too lol. Would be 5 stars if there was a tutorial for beginners.' },
            { name: 'Hamza Tariq', role: 'Premium Member', stars: 5, text: 'Discord community is really active. Always someone to help. The team pushes updates faster than anyone else in this space.' },
            { name: 'Usman Ghani', role: 'Lifetime License', stars: 2, text: 'Took a while to get my license key after payment. Once it worked though the tools are solid. Just wish support was faster on weekends.' },
        ];
        var colors = ['#dc2626','#7c3aed','#0ea5e9','#10b981','#f59e0b','#ec4899','#6366f1','#14b8a6','#f97316'];

        function avatar(name, color) {
            return 'data:image/svg+xml,' + encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><circle cx="18" cy="18" r="18" fill="' + color + '"/><text x="18" y="18" text-anchor="middle" dy=".35em" fill="#fff" font-size="14" font-family="sans-serif" font-weight="bold">' + name[0] + '</text></svg>'
            );
        }

        function card(r, i) {
            var starsHtml = '';
            for (var s = 0; s < 5; s++) {
                starsHtml += s < r.stars ? '\u2605' : '\u2606';
            }
            return '<div class="testi-card"><div class="testi-card-stars">' + starsHtml + '</div><p class="testi-card-text">\u201c' + r.text + '\u201d</p><div class="testi-card-author"><img class="testi-card-avatar" src="' + avatar(r.name, colors[i % 9]) + '" alt="' + r.name + '"><div><div class="testi-card-name">' + r.name + '</div><div class="testi-card-role">' + r.role + '</div></div></div></div>';
        }

        function makeCol(items, dur) {
            var col = document.createElement('div');
            col.className = 'testimonials-col';
            var html = '';
            for (var i = 0; i < items.length; i++) html += card(items[i], i);
            col.innerHTML = '<div class="testi-scroll-inner" style="animation:testi-scroll ' + dur + 's linear infinite">' + html + html + '</div>';
            container.appendChild(col);
        }

        makeCol(reviews.slice(0, 3), 18);
        makeCol(reviews.slice(3, 6), 22);
        makeCol(reviews.slice(6, 9), 20);
    })();

    // ── 5. SPIRAL ANIMATION — free cheats section (GSAP, converted from React) ──
    (function initSpiralBg() {
        var canvas = document.getElementById('spiral-bg-canvas');
        if (!canvas) return;
        if (isLowEnd) { canvas.style.display = 'none'; return; }

        var ctx = canvas.getContext('2d');
        if (!ctx) return;

        trackVisibility('spiral', canvas.parentElement);

        var time = { v: 0 };
        var W, H, cx, cy;
        var STAR_COUNT = 2000;
        var stars = [];
        var cameraZ = -400;
        var cameraDist = 3400;
        var viewZoom = 100;
        var changeT = 0.32;

        function resize() {
            var rect = canvas.parentElement.getBoundingClientRect();
            W = canvas.width = rect.width;
            H = canvas.height = rect.height;
            cx = W / 2;
            cy = H / 2;
        }
        resize();
        window.addEventListener('resize', resize);

        // Seeded random
        var seed = 1234;
        function srand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

        // Create stars
        for (var i = 0; i < STAR_COUNT; i++) {
            var angle = srand() * Math.PI * 2;
            var dist = 30 * srand() + 15;
            stars.push({
                dx: dist * Math.cos(angle),
                dy: dist * Math.sin(angle),
                spiralLoc: (1 - Math.pow(1 - srand(), 3)) / 1.3,
                z: (0.5 * cameraZ) + srand() * (cameraDist + 0.5 * Math.abs(cameraZ)),
                sw: Math.pow(srand(), 2),
                dir: srand() > 0.5 ? 1 : -1,
                exp: 1.2 + srand() * 0.8,
                angle: angle,
            });
        }

        function ease(p, g) {
            return p < 0.5 ? 0.5 * Math.pow(2 * p, g) : 1 - 0.5 * Math.pow(2 * (1 - p), g);
        }
        function elasticOut(x) {
            if (x <= 0) return 0; if (x >= 1) return 1;
            return Math.pow(2, -8 * x) * Math.sin((x * 8 - 0.75) * (2 * Math.PI / 4.5)) + 1;
        }
        function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }
        function map(v, a, b, c, d) { return c + (d - c) * ((v - a) / (b - a)); }
        function lerp(a, b, t) { return a * (1 - t) + b * t; }

        function spiralPath(p) {
            p = clamp(1.2 * p, 0, 1);
            p = ease(p, 1.8);
            var theta = 2 * Math.PI * 6 * Math.sqrt(p);
            var r = 170 * Math.sqrt(p);
            return { x: r * Math.cos(theta), y: r * Math.sin(theta) + 28 };
        }

        function projectDot(pos, sizeFactor) {
            var t2 = clamp(map(time.v, changeT, 1, 0, 1), 0, 1);
            var camZ = cameraZ + ease(Math.pow(t2, 1.2), 1.8) * cameraDist;
            if (pos.z > camZ) {
                var depth = pos.z - camZ;
                var x = viewZoom * pos.x / depth;
                var y = viewZoom * pos.y / depth;
                var sw = 400 * sizeFactor / depth;
                ctx.beginPath();
                ctx.arc(x, y, Math.max(sw / 2, 0.15), 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function render() {
            if (!visible['spiral']) return;
            ctx.clearRect(0, 0, W, H);
            ctx.save();
            ctx.translate(cx, cy);

            var t1 = clamp(map(time.v, 0, changeT + 0.25, 0, 1), 0, 1);
            var t2 = clamp(map(time.v, changeT, 1, 0, 1), 0, 1);
            ctx.rotate(-Math.PI * ease(t2, 2.7));

            // Trail
            ctx.fillStyle = 'white';
            for (var i = 0; i < 60; i++) {
                var f = map(i, 0, 60, 1.1, 0.1);
                var sw = (0.6 * (1 - t1) + 1.2 * Math.sin(Math.PI * t1)) * f;
                var pt = t1 - 0.00015 * i;
                var sp = spiralPath(pt);
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, Math.max(sw / 2, 0.1), 0, Math.PI * 2);
                ctx.fill();
            }

            // Stars
            for (var j = 0; j < stars.length; j++) {
                var s = stars[j];
                var sp = spiralPath(s.spiralLoc);
                var q = t1 - s.spiralLoc;
                if (q > 0) {
                    var dp = clamp(4 * q, 0, 1);
                    var eased = elasticOut(dp);
                    var sx = sp.x + s.dx * eased;
                    var sy = sp.y + s.dy * eased;
                    var vx = (s.z - cameraZ) * sx / viewZoom;
                    var vy = (s.z - cameraZ) * sy / viewZoom;
                    projectDot({ x: vx, y: vy, z: s.z }, 3.0 * s.sw);
                }
            }

            ctx.restore();
        }

        // GSAP loop — continuous seamless, starts only when section scrolls into view
        var spiralTween = null;
        if (typeof gsap !== 'undefined') {
            var spiralStarted = false;
            var spiralObserver = new IntersectionObserver(function(entries) {
                if (entries[0].isIntersecting && !spiralStarted) {
                    spiralStarted = true;
                    spiralTween = gsap.to(time, {
                        v: 1,
                        duration: 12,
                        repeat: -1,
                        yoyo: true,
                        ease: 'sine.inOut',
                        onUpdate: render
                    });
                    spiralObserver.disconnect();
                }
            }, { threshold: 0.1 });
            spiralObserver.observe(canvas.parentElement);
        }
    })();

    // ── 5b. COURSES SPIRAL — removed (using sparkle-line particles instead) ──

    // ── 6. SPARKLE LINE PARTICLES — courses section (full section spread) ──
    (function initSparkleParticles() {
        var container = document.getElementById('courses-sparkles');
        if (!container) return;

        // Position the sparkle line right under the header image
        var section = document.getElementById('courses');
        var headerImg = section ? section.querySelector('.section-header-img') : null;
        var lineWrap = section ? section.querySelector('.sparkle-line-wrap') : null;
        var sparkLine = lineWrap ? lineWrap.querySelector('.sparkle-line') : null;

        function positionLine() {
            if (!headerImg || !section || !sparkLine || !container) return;
            var sRect = section.getBoundingClientRect();
            var imgRect = headerImg.getBoundingClientRect();
            var topOffset = imgRect.bottom - sRect.top + 8;  // tight — just 8px below image
            sparkLine.style.top = topOffset + 'px';
            container.style.top = (topOffset + 2) + 'px';
        }
        positionLine();
        window.addEventListener('resize', positionLine);

        var count = isLowEnd ? 80 : 200;
        for (var i = 0; i < count; i++) {
            var s = document.createElement('span');
            s.className = 'spark';
            s.style.left = Math.random() * 100 + '%';
            s.style.top  = '0px';
            s.style.width  = (0.5 + Math.random() * 1.5) + 'px';
            s.style.height = s.style.width;
            s.style.animationDuration = (3 + Math.random() * 7) + 's';
            s.style.animationDelay    = (Math.random() * 6) + 's';
            container.appendChild(s);
        }
    })();

    // ── 7. BACKGROUND PATHS — removed ──

    // ── 8. ANIMATED TEAM SPOTLIGHT — stacked card carousel ──
    (function initTeamSpotlight() {
        var imagesWrap = document.getElementById('spotlight-images');
        var textWrap = document.getElementById('spotlight-text');
        var prevBtn = document.getElementById('spotlight-prev');
        var nextBtn = document.getElementById('spotlight-next');
        if (!imagesWrap || !textWrap || !prevBtn || !nextBtn) return;

        var members = [
            {
                name: 'RK',
                role: 'Operations Manager',
                bio: 'The backbone of day-to-day execution at Script Kittens. RK coordinates every moving piece — from product releases to team workflow — making sure nothing slips through the cracks.',
                src: 'team/RK.png'
            },
            {
                name: 'Yuta',
                role: 'Python Architect',
                bio: 'Yuta breathes automation. He architects the Python systems that power our tool ecosystem — clean, fast, and ruthlessly efficient. If it can be scripted, Yuta has already done it better.',
                src: 'team/yuta.png'
            },
            {
                name: 'Zen',
                role: 'C# Lead Developer',
                bio: 'Zen builds the core of our most powerful desktop tools in C#. Low-level, high-performance, zero compromises. His code runs silent and hits hard — exactly how we like it.',
                src: 'team/zen.png'
            },
            {
                name: 'Hassan',
                role: 'C++ Engineer',
                bio: 'Deep in the engine room, Hassan handles the hardest problems — memory manipulation, process injection, and staying one step ahead of every anti-cheat update. The guy who makes "undetectable" real.',
                src: 'team/hassan.png'
            },
            {
                name: 'Saeed',
                role: 'Backend Engineer',
                bio: 'Saeed builds the infrastructure that keeps everything alive. APIs, bot systems, server architecture — he engineers the invisible layer that makes Script Kittens fast, reliable, and always online.',
                src: 'team/saeed.png'
            },
            {
                name: 'Ahmer',
                role: 'Lead Editor',
                bio: 'Ahmer turns raw gameplay into jaw-dropping content. His edits don\'t just show what our tools do — they make you feel the advantage. Sharp cuts, perfect timing, cinematic energy.',
                src: 'team/ahmer.jpg'
            },
            {
                name: 'Reflex',
                role: 'VFX Editor',
                bio: 'Reflex is the reason Script Kittens content looks unlike anything else. Custom VFX, motion graphics, and a visual style so distinct you can spot it in three seconds flat.',
                src: 'team/reflex.png'
            },
            {
                name: 'Kitten',
                role: 'Mascot & Morale',
                bio: 'Every elite team needs heart. Kitten keeps the energy right, the community buzzing, and reminds everyone why we do this. The face of Script Kittens — and honestly the most important one.',
                src: 'team/kitten.png'
            }
        ];

        var active = 0;
        var isAnimating = false;

        // Seeded rotation values for stacked cards
        var rotations = [-6, 4, -3, 7, -5, 3, -7, 5, -4, 6];

        // Build image stack
        members.forEach(function(m, i) {
            var wrap = document.createElement('div');
            wrap.className = 'team-spotlight__img-wrap';
            wrap.style.setProperty('--rot', rotations[i % rotations.length] + 'deg');
            var img = document.createElement('img');
            img.src = m.src;
            img.alt = m.name;
            img.draggable = false;
            wrap.appendChild(img);
            imagesWrap.appendChild(wrap);
        });

        var allWraps = imagesWrap.querySelectorAll('.team-spotlight__img-wrap');

        function updateImages() {
            var prevIdx = (active - 1 + members.length) % members.length;
            var nextIdx = (active + 1) % members.length;
            for (var i = 0; i < allWraps.length; i++) {
                allWraps[i].classList.remove('spotlight-active', 'spotlight-behind', 'spotlight-hidden', 'behind-left', 'behind-right');
                if (i === active) {
                    allWraps[i].classList.add('spotlight-active');
                } else if (i === prevIdx) {
                    allWraps[i].classList.add('spotlight-behind', 'behind-left');
                } else if (i === nextIdx) {
                    allWraps[i].classList.add('spotlight-behind', 'behind-right');
                } else {
                    allWraps[i].classList.add('spotlight-hidden');
                }
            }
        }

        function revealWords() {
            var m = members[active];

            // Build HTML with counter badge
            var html = '<p class="team-spotlight__counter">' + (active + 1) + ' / ' + members.length + '</p>';
            html += '<h3 class="team-spotlight__name">' + m.name + '</h3>';
            html += '<p class="team-spotlight__role">' + m.role + '</p>';
            html += '<p class="team-spotlight__bio">';
            var words = m.bio.split(' ');
            for (var w = 0; w < words.length; w++) {
                html += '<span class="spotlight-word" style="transition-delay:' + (w * 0.025) + 's">' + words[w] + '&nbsp;</span>';
            }
            html += '</p>';
            textWrap.innerHTML = html;

            // Trigger reveal after a micro delay
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    var spans = textWrap.querySelectorAll('.spotlight-word');
                    for (var s = 0; s < spans.length; s++) {
                        spans[s].classList.add('revealed');
                    }
                });
            });
        }

        function goTo(index) {
            if (isAnimating) return;
            isAnimating = true;
            active = ((index % members.length) + members.length) % members.length;
            updateImages();
            revealWords();
            updateDots();
            updateProgress();
            setTimeout(function() { isAnimating = false; }, 500);
        }

        // Build dots
        var dotsWrap = document.getElementById('spotlight-dots');
        var progressFill = document.getElementById('spotlight-progress');

        function buildDots() {
            if (!dotsWrap) return;
            dotsWrap.innerHTML = '';
            members.forEach(function(_, i) {
                var d = document.createElement('span');
                d.className = 'spotlight-dot' + (i === active ? ' active' : '');
                d.addEventListener('click', function() { goTo(i); });
                dotsWrap.appendChild(d);
            });
        }
        function updateDots() {
            if (!dotsWrap) return;
            var dots = dotsWrap.querySelectorAll('.spotlight-dot');
            dots.forEach(function(d, i) { d.classList.toggle('active', i === active); });
        }
        function updateProgress() {
            if (!progressFill) return;
            progressFill.style.width = ((active + 1) / members.length * 100) + '%';
        }

        // Init
        buildDots();
        updateImages();
        revealWords();
        updateProgress();

        // Navigation
        prevBtn.addEventListener('click', function() { goTo(active - 1); });
        nextBtn.addEventListener('click', function() { goTo(active + 1); });

        // Autoplay every 6 seconds
        var autoplayInterval = setInterval(function() { goTo(active + 1); }, 6000);

        // Pause autoplay on hover
        var spotlightEl = imagesWrap.closest('.team-spotlight');
        if (spotlightEl) {
            spotlightEl.addEventListener('mouseenter', function() {
                clearInterval(autoplayInterval);
            });
            spotlightEl.addEventListener('mouseleave', function() {
                autoplayInterval = setInterval(function() { goTo(active + 1); }, 6000);
            });
        }

        // ── Scroll-hijack: attach DIRECTLY to spotlight element ──
        // This only fires when mouse is physically over the spotlight box.
        // capture:true + stopImmediatePropagation beats Lenis.
        var scrollCooldown = false;

        if (spotlightEl) {
            spotlightEl.addEventListener('wheel', function(e) {
                var goingDown = e.deltaY > 0;
                var goingUp   = e.deltaY < 0;

                // At first member scrolling up OR last member scrolling down
                // → let the page scroll through naturally (no preventDefault)
                if (goingDown && active === members.length - 1) return;
                if (goingUp   && active === 0) return;

                // We're mid-carousel → eat the scroll completely
                e.preventDefault();
                e.stopImmediatePropagation();

                if (scrollCooldown) return;
                scrollCooldown = true;
                setTimeout(function() { scrollCooldown = false; }, 800);

                if (goingDown) goTo(active + 1);
                else           goTo(active - 1);

            }, { passive: false, capture: true });
        }
    })();

    // ── 9. PARTICLE TEXT EFFECT (Optimized) ──
    (function initParticleText() {
        var canvas = document.getElementById('particle-text-canvas');
        if (!canvas) return;

        // Size canvas to its container
        function resizeCanvas() {
            canvas.width  = canvas.offsetWidth  || 1000;
            canvas.height = canvas.offsetHeight || 260;
        }
        resizeCanvas();

        var ctx = canvas.getContext('2d', { alpha: false }); // opaque = faster compositing
        var particles = [];
        var aliveCount = 0;       // track active particles without splicing
        var frameCount = 0;
        var wordIndex  = 0;
        var MAX_PARTICLES = 2500; // fewer but bigger = smooth on any PC
        var pixelStep  = 4;       // sample every 4th pixel — bigger dots compensate
        var lastTime = 0;
        var wordInterval = 1800;  // ms between word changes — quick, doesn't fully form before moving
        var lastWordTime = 0;

        var words = [
            'SCRIPT KITTENS',
            'ZERO BANS',
            'ZERO TRACES',
            '1,700+ USERS',
            'UNDETECTABLE',
            'ELITE TOOLS',
            'STAY AHEAD'
        ];

        // ── Flat arrays for particle data (SoA = Structure of Arrays) ──
        // Much faster than array of objects — cache-friendly, no GC pressure
        var maxPool = MAX_PARTICLES + 500; // extra headroom
        var px = new Float32Array(maxPool);    // position x
        var py = new Float32Array(maxPool);    // position y
        var vx = new Float32Array(maxPool);    // velocity x
        var vy = new Float32Array(maxPool);    // velocity y
        var tx = new Float32Array(maxPool);    // target x
        var ty = new Float32Array(maxPool);    // target y
        var maxSpd = new Float32Array(maxPool);
        var maxFrc = new Float32Array(maxPool);
        var pSize  = new Float32Array(maxPool); // particle size
        var sr = new Uint8Array(maxPool);      // start color r
        var sg = new Uint8Array(maxPool);      // start color g
        var sb = new Uint8Array(maxPool);      // start color b
        var tr = new Uint8Array(maxPool);      // target color r
        var tg = new Uint8Array(maxPool);      // target color g
        var tb = new Uint8Array(maxPool);      // target color b
        var cw = new Float32Array(maxPool);    // color weight (0-1)
        var cbr = new Float32Array(maxPool);   // color blend rate
        var killed = new Uint8Array(maxPool);  // 0 = alive, 1 = killed

        function initParticle(i) {
            px[i] = Math.random() * canvas.width;
            py[i] = Math.random() * canvas.height;
            vx[i] = (Math.random() - 0.5) * 2;
            vy[i] = (Math.random() - 0.5) * 2;
            tx[i] = 0; ty[i] = 0;
            maxSpd[i] = Math.random() * 8 + 10;
            maxFrc[i] = maxSpd[i] * 0.15; // aggressive steering = fast arrival
            pSize[i]  = Math.random() * 2.0 + 1.8; // big chunky dots (1.8–3.8px)
            sr[i] = 220; sg[i] = 38; sb[i] = 38;
            tr[i] = 255; tg[i] = 255; tb[i] = 255;
            cw[i] = 0;
            cbr[i] = Math.random() * 0.03 + 0.01;
            killed[i] = 0;
        }

        // Color palette — each word gets a different dramatic color
        var palette = [
            [220,  38,  38],   // brand red          — SCRIPT KITTENS
            [255, 255, 255],   // pure white         — ZERO BANS
            [236, 223, 204],   // cream/gold         — ZERO TRACES
            [255,  60,  60],   // bright red         — 1,700+ USERS
            [180, 180, 200],   // cool grey-blue     — UNDETECTABLE
            [255, 200, 200],   // light pink-red     — ELITE TOOLS
            [255, 255, 255],   // white              — STAY AHEAD
        ];
        var paletteIndex = 0;

        // Reuse offscreen canvas instead of creating new one each time
        var offscreen = document.createElement('canvas');
        var oc = offscreen.getContext('2d');

        function nextWord(word) {
            offscreen.width  = canvas.width;
            offscreen.height = canvas.height;

            // BIG font — fills ~65% of canvas height
            var fontSize = Math.min(
                canvas.width  / (word.length * 0.62),
                canvas.height * 0.62
            );
            fontSize = Math.max(fontSize, 48);

            oc.fillStyle = 'white';
            oc.font = 'bold ' + Math.round(fontSize) + 'px Cinzel, Georgia, serif';
            oc.textAlign = 'center';
            oc.textBaseline = 'middle';
            oc.fillText(word, offscreen.width / 2, offscreen.height / 2);

            var imageData = oc.getImageData(0, 0, offscreen.width, offscreen.height);
            var pixels = imageData.data;
            var w = offscreen.width;

            var newColor = palette[paletteIndex % palette.length];
            paletteIndex++;

            // Collect lit pixel coords — denser sampling (pixelStep=3)
            var coords = [];
            for (var i = 0, len = pixels.length; i < len; i += pixelStep * 4) {
                if (pixels[i + 3] > 128) coords.push(i);
            }

            // Hard cap — use modulo thinning (deterministic, no Math.random per pixel)
            if (coords.length > MAX_PARTICLES) {
                var step = coords.length / MAX_PARTICLES;
                var thinned = [];
                for (var t = 0; t < MAX_PARTICLES; t++) {
                    thinned.push(coords[Math.floor(t * step)]);
                }
                coords = thinned;
            }

            // Shuffle for organic scatter (Fisher-Yates)
            for (var j = coords.length - 1; j > 0; j--) {
                var k = Math.floor(Math.random() * (j + 1));
                var tmp = coords[j]; coords[j] = coords[k]; coords[k] = tmp;
            }

            var pIdx = 0;
            var ncr = newColor[0], ncg = newColor[1], ncb = newColor[2];
            for (var c = 0; c < coords.length; c++) {
                var ci = coords[c];
                var cpx = (ci / 4) % w;
                var cpy = Math.floor(ci / 4 / w);

                if (pIdx >= aliveCount) {
                    // Need a new particle
                    if (pIdx >= maxPool) break; // safety
                    initParticle(pIdx);
                }
                killed[pIdx] = 0;

                // Snapshot current blended color as new start
                var weight = cw[pIdx];
                sr[pIdx] = Math.round(sr[pIdx] + (tr[pIdx] - sr[pIdx]) * weight) | 0;
                sg[pIdx] = Math.round(sg[pIdx] + (tg[pIdx] - sg[pIdx]) * weight) | 0;
                sb[pIdx] = Math.round(sb[pIdx] + (tb[pIdx] - sb[pIdx]) * weight) | 0;
                tr[pIdx] = ncr;
                tg[pIdx] = ncg;
                tb[pIdx] = ncb;
                cw[pIdx] = 0;
                tx[pIdx] = cpx;
                ty[pIdx] = cpy;
                pIdx++;
            }

            // Kill excess particles
            for (var i2 = pIdx; i2 < aliveCount; i2++) {
                if (!killed[i2]) {
                    var angle = Math.random() * 6.2832;
                    var mag   = (canvas.width + canvas.height) * 0.5;
                    tx[i2] = canvas.width  * 0.5 + Math.cos(angle) * mag;
                    ty[i2] = canvas.height * 0.5 + Math.sin(angle) * mag;
                    // snapshot color
                    var w2 = cw[i2];
                    sr[i2] = Math.round(sr[i2] + (tr[i2] - sr[i2]) * w2) | 0;
                    sg[i2] = Math.round(sg[i2] + (tg[i2] - sg[i2]) * w2) | 0;
                    sb[i2] = Math.round(sb[i2] + (tb[i2] - sb[i2]) * w2) | 0;
                    tr[i2] = 0; tg[i2] = 0; tb[i2] = 0;
                    cw[i2] = 0;
                    killed[i2] = 1;
                }
            }

            // Update alive count
            if (pIdx > aliveCount) aliveCount = pIdx;
        }

        // ── Pre-build color lookup for batch rendering ──
        // Group particles by color bucket to minimize fillStyle changes
        var colorBuckets = {};
        var bucketKeys = []; // track active keys for fast reset

        // ── Animate (optimized) ──
        var ptAnimId;
        function ptAnimate(timestamp) {
            if (!lastTime) lastTime = timestamp;
            var dt = Math.min(timestamp - lastTime, 33); // cap at ~30fps delta to prevent jumps
            lastTime = timestamp;
            var dtScale = dt / 16.667; // normalize to 60fps

            // Clear canvas fully (opaque context, no alpha trail needed)
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Reset color buckets (reuse arrays to avoid GC)
            for (var bi = 0; bi < bucketKeys.length; bi++) {
                var bk = colorBuckets[bucketKeys[bi]];
                bk.xs.length = 0; bk.ys.length = 0; bk.sizes.length = 0;
            }
            bucketKeys.length = 0;

            var cw2 = canvas.width, ch2 = canvas.height;
            var newAlive = aliveCount;

            // Update all particles (tight loop over typed arrays)
            for (var i = 0; i < aliveCount; i++) {
                // ── Move (inlined for speed) ──
                var dx = tx[i] - px[i];
                var dy = ty[i] - py[i];
                var distSq = dx * dx + dy * dy;

                // Remove killed particles that left the canvas
                if (killed[i]) {
                    if (px[i] < -100 || px[i] > cw2 + 100 ||
                        py[i] < -100 || py[i] > ch2 + 100) {
                        // Swap with last alive particle (O(1) removal)
                        newAlive--;
                        if (i < newAlive) {
                            px[i]=px[newAlive]; py[i]=py[newAlive];
                            vx[i]=vx[newAlive]; vy[i]=vy[newAlive];
                            tx[i]=tx[newAlive]; ty[i]=ty[newAlive];
                            maxSpd[i]=maxSpd[newAlive]; maxFrc[i]=maxFrc[newAlive];
                            pSize[i]=pSize[newAlive];
                            sr[i]=sr[newAlive]; sg[i]=sg[newAlive]; sb[i]=sb[newAlive];
                            tr[i]=tr[newAlive]; tg[i]=tg[newAlive]; tb[i]=tb[newAlive];
                            cw[i]=cw[newAlive]; cbr[i]=cbr[newAlive];
                            killed[i]=killed[newAlive];
                            i--; // re-process this index
                        }
                        continue;
                    }
                }

                // Simplified steering — one sqrt, no second sqrt for steer magnitude
                var dist = Math.sqrt(distSq);
                var prox = dist < 60 ? (dist / 60) * (dist / 60) : 1;

                if (dist > 0.5) {
                    var invDist = 1 / dist;
                    var desX = dx * invDist * maxSpd[i] * prox;
                    var desY = dy * invDist * maxSpd[i] * prox;

                    // Clamp steer directly — skip sqrt, just cap components
                    var steerX = (desX - vx[i]) * 0.18 * dtScale;
                    var steerY = (desY - vy[i]) * 0.18 * dtScale;
                    vx[i] += steerX;
                    vy[i] += steerY;
                }

                px[i] += vx[i] * dtScale;
                py[i] += vy[i] * dtScale;
                // Damping — light so particles stay fast
                vx[i] *= 0.96;
                vy[i] *= 0.96;

                // ── Color blend ──
                if (cw[i] < 1) {
                    cw[i] = Math.min(cw[i] + cbr[i] * dtScale, 1);
                }
                var w = cw[i];
                var cr = (sr[i] + (tr[i] - sr[i]) * w + 0.5) | 0;
                var cg = (sg[i] + (tg[i] - sg[i]) * w + 0.5) | 0;
                var cb = (sb[i] + (tb[i] - sb[i]) * w + 0.5) | 0;

                // Bucket by color (quantize by >>2 = 64 levels per channel, massively reduces unique colors)
                var qr = cr >> 2, qg = cg >> 2, qb = cb >> 2;
                var colorKey = (qr << 12) | (qg << 6) | qb;
                if (!colorBuckets[colorKey]) {
                    colorBuckets[colorKey] = {
                        color: 'rgb(' + (qr << 2) + ',' + (qg << 2) + ',' + (qb << 2) + ')',
                        xs: [], ys: [], sizes: []
                    };
                }
                if (colorBuckets[colorKey].xs.length === 0) bucketKeys.push(colorKey);
                var bucket = colorBuckets[colorKey];
                bucket.xs.push(px[i]);
                bucket.ys.push(py[i]);
                bucket.sizes.push(pSize[i]);
            }

            aliveCount = newAlive;

            // ── Batch draw by color (massive perf win) ──
            for (var ki = 0; ki < bucketKeys.length; ki++) {
                var b = colorBuckets[bucketKeys[ki]];
                ctx.fillStyle = b.color;
                var bxs = b.xs, bys = b.ys, bsz = b.sizes;
                for (var j = 0, blen = bxs.length; j < blen; j++) {
                    var s = bsz[j];
                    ctx.fillRect(bxs[j] - s * 0.5, bys[j] - s * 0.5, s, s);
                }
            }

            // Auto-advance words (time-based, not frame-based)
            if (!lastWordTime) lastWordTime = timestamp;
            if (timestamp - lastWordTime >= wordInterval) {
                lastWordTime = timestamp;
                wordIndex = (wordIndex + 1) % words.length;
                nextWord(words[wordIndex]);
            }

            ptAnimId = requestAnimationFrame(ptAnimate);
        }

        // Only run when section is visible (IntersectionObserver to save GPU)
        var ptSection = canvas.closest('.particle-text-section') || canvas.parentElement;
        var ptObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    if (!ptAnimId) {
                        lastTime = 0;
                        ptAnimate(performance.now());
                    }
                } else {
                    if (ptAnimId) { cancelAnimationFrame(ptAnimId); ptAnimId = null; }
                }
            });
        }, { threshold: 0.1 });
        ptObserver.observe(ptSection);

        // Resize handler with debounce
        var resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                resizeCanvas();
                nextWord(words[wordIndex]);
            }, 150);
        });

        // Mouse: left-click attract, right-click destroy
        var mouse = { x: -9999, y: -9999, pressed: false, right: false };
        canvas.addEventListener('mousemove', function(e) {
            var rect = canvas.getBoundingClientRect();
            mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
            mouse.y = (e.clientY - rect.top)  * (canvas.height / rect.height);
        });
        canvas.addEventListener('mousedown', function(e) {
            mouse.pressed = true;
            mouse.right = e.button === 2;
        });
        canvas.addEventListener('mouseup', function() { mouse.pressed = false; });
        canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });

        // Kick off first word
        nextWord(words[0]);
    })();

    // ── MASTER LOOP — ONE requestAnimationFrame for ALL canvas effects ──
    var frameCount = 0;
    function masterLoop(now) {
        frameCount++;

        // Stars: skip every other frame on low-end
        if (!isLowEnd || frameCount % 2 === 0) {
            drawStars(now * 0.001);
        }

        // WebGL effects — already visibility-gated internally
        if (smokeRender)   smokeRender(now);
        if (pricingRender) pricingRender();
        if (footerRender)  footerRender(now);

        requestAnimationFrame(masterLoop);
    }
    requestAnimationFrame(masterLoop);

})();
}); // end DOMContentLoaded for skAnimations

