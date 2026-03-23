/* ============ LOGIN PAGE JS — Script Kittens ============ */
/* Now connected to real backend API                       */
(function () {
    'use strict';

    /* ─── API Base URL ─── */
    var API_BASE = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) ? API_BASE_URL : 'https://api.script-kittens.com';

    function apiUrl(path) {
        // Normalize: strip /api prefix since api subdomain doesn't need it
        var cleanPath = path.replace(/^\/api/, '');
        return API_BASE + cleanPath;
    }

    /* ─────────────────────────────────────────────
     *  0. HANDLE OAUTH REDIRECT (check URL params)
     * ───────────────────────────────────────────── */
    (function handleOAuthRedirect() {
        var params = new URLSearchParams(window.location.search);
        var authStatus = params.get('auth');
        var token = params.get('token');
        var message = params.get('message');
        var providerDisplayName = params.get('provider_name') || '';
        var redirectTo = params.get('redirect') || sessionStorage.getItem('sk_login_redirect') || 'https://script-kittens.com';

        // Save redirect target for after OAuth (OAuth loses query params through the flow)
        if (params.get('redirect')) {
            sessionStorage.setItem('sk_login_redirect', params.get('redirect'));
        }

        if (authStatus === 'success' && token) {
            // Store token in localStorage
            localStorage.setItem('sk_token', token);
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);

            // Fetch user data with the token before redirecting
            fetch(API_BASE + '/auth/me', {
                headers: { 'Authorization': 'Bearer ' + token },
                credentials: 'include'
            })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (data.user) {
                        localStorage.setItem('sk_user', JSON.stringify(data.user));
                        localStorage.setItem('userLoggedIn', 'true');
                        localStorage.setItem('userDisplayName', data.user.username || '');
                        localStorage.setItem('userUsername', data.user.username || '');
                        localStorage.setItem('userEmail', data.user.email || '');
                        if (data.user.avatar_url) localStorage.setItem('userAvatar', data.user.avatar_url);
                        if (data.user.role) localStorage.setItem('userRole', data.user.role);
                        if (data.user.provider) localStorage.setItem('userAuthMethod', data.user.provider);
                    }
                    sessionStorage.removeItem('sk_login_redirect');
                    // Redirect back to where they came from
                    var dest = redirectTo.startsWith('https://') || redirectTo.startsWith('http://')
                        ? redirectTo
                        : 'https://script-kittens.com';
                    window.location.href = dest;
                })
                .catch(function () {
                    sessionStorage.removeItem('sk_login_redirect');
                    window.location.href = redirectTo || 'https://script-kittens.com';
                });
            return;
        }

        if (authStatus === 'error') {
            window.history.replaceState({}, '', window.location.pathname);
            window._oauthError = decodeURIComponent(message || 'OAuth login failed');
        }
    })();

    /* ─────────────────────────────────────────────
     *  1. SPLINE LOADER — show skeleton until 3D is ready
     * ───────────────────────────────────────────── */
    (function initSplineLoader() {
        var loader = document.getElementById('authLoader');
        var splineWrap = document.getElementById('splineWrap');
        var viewer = document.getElementById('splineViewer');
        if (!loader || !splineWrap || !viewer) return;

        viewer.addEventListener('load', function () {
            splineWrap.classList.add('loaded');
            loader.classList.add('hidden');
        });

        var pollCount = 0;
        var poll = setInterval(function () {
            pollCount++;
            var shadow = viewer.shadowRoot;
            if (shadow) {
                var canvas = shadow.querySelector('canvas');
                if (canvas) {
                    splineWrap.classList.add('loaded');
                    loader.classList.add('hidden');
                    clearInterval(poll);
                    return;
                }
            }
            if (pollCount > 90) {
                splineWrap.classList.add('loaded');
                loader.classList.add('hidden');
                clearInterval(poll);
            }
        }, 500);
    })();

    /* ─────────────────────────────────────────────
     *  2. STEP MANAGEMENT
     * ───────────────────────────────────────────── */
    var stepEntry = document.getElementById('stepEntry');
    var stepLogin = document.getElementById('stepLogin');
    var stepSignup = document.getElementById('stepSignup');
    var continueEmailBtn = document.getElementById('continueEmailBtn');
    var backToEntry = document.getElementById('backToEntry');
    var backToEntryFromSignup = document.getElementById('backToEntryFromSignup');
    var entryEmail = document.getElementById('entry-email');
    var loginEmailDisplay = document.getElementById('loginEmailDisplay');
    var signupEmailDisplay = document.getElementById('signupEmailDisplay');
    var loginForm = document.getElementById('loginForm');
    var signupForm = document.getElementById('signupForm');

    function showStep(step) {
        [stepEntry, stepLogin, stepSignup].forEach(function (s) {
            if (s) s.classList.remove('active');
        });
        if (step) step.classList.add('active');
        document.querySelectorAll('.auth-message').forEach(function (m) { m.remove(); });
    }

    /* ─── Check Email (calls real API) ─── */
    if (continueEmailBtn && entryEmail) {
        continueEmailBtn.addEventListener('click', function () {
            var email = entryEmail.value.trim();
            if (!email) { showMessage(stepEntry, 'error', 'Please enter your email address.'); return; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showMessage(stepEntry, 'error', 'Please enter a valid email address.'); return; }

            continueEmailBtn.classList.add('loading');
            continueEmailBtn.disabled = true;

            fetch(apiUrl('/api/auth/check-email'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: email }),
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                continueEmailBtn.classList.remove('loading');
                continueEmailBtn.disabled = false;

                if (data.error) {
                    showMessage(stepEntry, 'error', data.error);
                    return;
                }

                if (data.exists) {
                    if (loginEmailDisplay) loginEmailDisplay.textContent = email;
                    showStep(stepLogin);
                } else {
                    if (signupEmailDisplay) signupEmailDisplay.textContent = email;
                    showStep(stepSignup);
                }
            })
            .catch(function (err) {
                continueEmailBtn.classList.remove('loading');
                continueEmailBtn.disabled = false;
                console.error('Check email error:', err);
                showMessage(stepEntry, 'error', 'Connection failed. Please try again.');
            });
        });

        entryEmail.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); continueEmailBtn.click(); }
        });
    }

    if (backToEntry) backToEntry.addEventListener('click', function () { showStep(stepEntry); });
    if (backToEntryFromSignup) backToEntryFromSignup.addEventListener('click', function () { showStep(stepEntry); });

    if (window.location.hash === '#signup' && entryEmail) entryEmail.focus();

    /* ─────────────────────────────────────────────
     *  3. SOCIAL / OAUTH BUTTONS
     * ───────────────────────────────────────────── */
    (function initSocialButtons() {
        var socialBtns = document.querySelectorAll('.auth-social-btn');
        var providers = ['google', 'discord', 'github'];
        // Get redirect destination from URL param or sessionStorage
        var params = new URLSearchParams(window.location.search);
        var redirectAfter = params.get('redirect') || sessionStorage.getItem('sk_login_redirect') || '';

        socialBtns.forEach(function (btn, index) {
            if (providers[index]) {
                btn.addEventListener('click', function () {
                    var url = apiUrl('/api/oauth/' + providers[index]);
                    if (redirectAfter) url += '?redirect=' + encodeURIComponent(redirectAfter);
                    window.location.href = url;
                });
            }
        });
    })();

    /* ─────────────────────────────────────────────
     *  4. PASSWORD TOGGLE
     * ───────────────────────────────────────────── */
    document.querySelectorAll('.auth-pw-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var input = this.parentElement.querySelector('.auth-input');
            var icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });

    /* ─────────────────────────────────────────────
     *  5. PASSWORD STRENGTH METER
     * ───────────────────────────────────────────── */
    var signupPw = document.getElementById('signup-password');
    var strengthWrap = document.getElementById('passwordStrength');

    if (signupPw && strengthWrap) {
        var fill = strengthWrap.querySelector('.auth-strength-fill');
        var text = strengthWrap.querySelector('.auth-strength-text');

        signupPw.addEventListener('input', function () {
            var val = this.value;
            if (!val.length) { strengthWrap.classList.remove('visible'); return; }
            strengthWrap.classList.add('visible');

            var score = 0;
            if (val.length >= 8) score++;
            if (val.length >= 12) score++;
            if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
            if (/[0-9]/.test(val)) score++;
            if (/[^A-Za-z0-9]/.test(val)) score++;

            var levels = ['weak', 'weak', 'fair', 'good', 'strong', 'strong'];
            var labels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Strong'];
            fill.className = 'auth-strength-fill ' + levels[score];
            text.className = 'auth-strength-text ' + levels[score];
            text.textContent = labels[score];
        });
    }

    /* ─────────────────────────────────────────────
     *  6. FORM SUBMISSION — LOGIN (real API)
     * ───────────────────────────────────────────── */
    function showMessage(container, type, msg) {
        var existing = container.querySelector('.auth-message');
        if (existing) existing.remove();

        var div = document.createElement('div');
        div.className = 'auth-message ' + type;
        div.innerHTML = '<i class="fas fa-' + (type === 'error' ? 'exclamation-circle' : 'check-circle') + '"></i>' + msg;

        var heading = container.querySelector('.auth-heading');
        if (heading && heading.nextSibling) container.insertBefore(div, heading.nextSibling);
        else container.insertBefore(div, container.firstChild);

        setTimeout(function () { if (div.parentNode) div.remove(); }, 5000);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = loginEmailDisplay ? loginEmailDisplay.textContent : '';
            var password = document.getElementById('login-password').value;
            var rememberMe = loginForm.querySelector('input[type="checkbox"]');
            var btn = this.querySelector('.auth-submit');

            if (!password) { showMessage(stepLogin, 'error', 'Please enter your password.'); return; }

            btn.classList.add('loading');
            btn.disabled = true;

            fetch(apiUrl('/api/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: email, password: password }),
            })
            .then(function (res) { return res.json().then(function(data) { return { status: res.status, data: data }; }); })
            .then(function (result) {
                btn.classList.remove('loading');
                btn.disabled = false;

                if (result.status >= 400) {
                    showMessage(stepLogin, 'error', result.data.error || 'Login failed');
                    return;
                }

                // Store token and user data
                if (result.data.token) {
                    localStorage.setItem('sk_token', result.data.token);
                    if (result.data.user) {
                        localStorage.setItem('sk_user', JSON.stringify(result.data.user));
                        localStorage.setItem('userLoggedIn', 'true');
                        localStorage.setItem('userDisplayName', result.data.user.username || '');
                        localStorage.setItem('userUsername', result.data.user.username || '');
                        localStorage.setItem('userEmail', result.data.user.email || '');
                        if (result.data.user.role) localStorage.setItem('userRole', result.data.user.role);
                        localStorage.setItem('userAuthMethod', 'email');
                    }
                }

                showMessage(stepLogin, 'success', 'Signed in successfully! Redirecting...');
                setTimeout(function () {
                    var dest = sessionStorage.getItem('sk_login_redirect') || 'https://script-kittens.com';
                    sessionStorage.removeItem('sk_login_redirect');
                    window.location.href = dest;
                }, 1200);
            })
            .catch(function (err) {
                btn.classList.remove('loading');
                btn.disabled = false;
                console.error('Login error:', err);
                showMessage(stepLogin, 'error', 'Connection failed. Please try again.');
            });
        });
    }

    /* ─────────────────────────────────────────────
     *  7. FORM SUBMISSION — SIGNUP (real API)
     * ───────────────────────────────────────────── */
    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = signupEmailDisplay ? signupEmailDisplay.textContent : '';
            var username = document.getElementById('signup-username').value.trim();
            var password = document.getElementById('signup-password').value;
            var confirm = document.getElementById('signup-confirm').value;
            var btn = this.querySelector('.auth-submit');

            if (!username || !password || !confirm) { showMessage(stepSignup, 'error', 'Please fill in all fields.'); return; }
            if (password.length < 8) { showMessage(stepSignup, 'error', 'Password must be at least 8 characters.'); return; }
            if (password !== confirm) { showMessage(stepSignup, 'error', 'Passwords do not match.'); return; }

            btn.classList.add('loading');
            btn.disabled = true;

            fetch(apiUrl('/api/auth/register'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: email, username: username, password: password }),
            })
            .then(function (res) { return res.json().then(function(data) { return { status: res.status, data: data }; }); })
            .then(function (result) {
                btn.classList.remove('loading');
                btn.disabled = false;

                if (result.status >= 400) {
                    showMessage(stepSignup, 'error', result.data.error || 'Registration failed');
                    return;
                }

                // Store token and user data (auto-login after signup)
                if (result.data.token) {
                    localStorage.setItem('sk_token', result.data.token);
                    if (result.data.user) {
                        localStorage.setItem('sk_user', JSON.stringify(result.data.user));
                        localStorage.setItem('userLoggedIn', 'true');
                        localStorage.setItem('userDisplayName', result.data.user.username || '');
                        localStorage.setItem('userUsername', result.data.user.username || '');
                        localStorage.setItem('userEmail', result.data.user.email || '');
                        if (result.data.user.role) localStorage.setItem('userRole', result.data.user.role);
                        localStorage.setItem('userAuthMethod', 'email');
                    }
                }

                showMessage(stepSignup, 'success', 'Account created! Redirecting...');
                setTimeout(function () {
                    var dest = sessionStorage.getItem('sk_login_redirect') || 'https://script-kittens.com';
                    sessionStorage.removeItem('sk_login_redirect');
                    window.location.href = dest;
                }, 1200);
            })
            .catch(function (err) {
                btn.classList.remove('loading');
                btn.disabled = false;
                console.error('Signup error:', err);
                showMessage(stepSignup, 'error', 'Connection failed. Please try again.');
            });
        });
    }

    /* ─────────────────────────────────────────────
     *  8. SHOW OAUTH ERROR (if redirected with error)
     * ───────────────────────────────────────────── */
    if (window._oauthError && stepEntry) {
        setTimeout(function () {
            showMessage(stepEntry, 'error', window._oauthError);
        }, 500);
    }

    /* ─────────────────────────────────────────────
     *  9. CHECK IF ALREADY LOGGED IN
     * ───────────────────────────────────────────── */
    (function checkExistingAuth() {
        var params  = new URLSearchParams(window.location.search);
        var hash    = window.location.hash;
        var justLoggedOut = (
            params.get('logged_out') === '1' ||
            hash.includes('logged_out')
        );

        // If we just logged out — nuke everything and stay here
        if (justLoggedOut) {
            localStorage.removeItem('sk_token');
            localStorage.removeItem('sk_user');
            localStorage.removeItem('userLoggedIn');
            localStorage.removeItem('userDisplayName');
            localStorage.removeItem('userUsername');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userAvatar');
            localStorage.removeItem('userBio');
            localStorage.removeItem('userStatus');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userAuthMethod');
            // Also tell backend to kill the cookie (belt AND suspenders)
            fetch(apiUrl('/api/auth/logout'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // need this to clear the cookie
            }).catch(function() {});
            // Clean the URL
            window.history.replaceState({}, '', window.location.pathname);
            return; // stay on login page, do NOT check token
        }

        // No logout signal — check if already logged in
        var token = localStorage.getItem('sk_token');
        if (!token) return; // no token, show login form

        // Verify token with backend (header only, not cookie)
        fetch(apiUrl('/api/auth/me'), {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            credentials: 'omit',
        })
        .then(function(res) {
            if (res.ok) {
                var dest = sessionStorage.getItem('sk_login_redirect') || 'https://script-kittens.com';
                sessionStorage.removeItem('sk_login_redirect');
                window.location.href = dest;
            } else {
                // Dead token — clear it all
                localStorage.removeItem('sk_token');
                localStorage.removeItem('sk_user');
                localStorage.removeItem('userLoggedIn');
                localStorage.removeItem('userDisplayName');
                localStorage.removeItem('userUsername');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userAvatar');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userAuthMethod');
            }
        })
        .catch(function() { /* network error — stay on login page */ });
    })();

    /* ─────────────────────────────────────────────
     *  10. TESTIMONIAL CAROUSEL
     * ───────────────────────────────────────────── */
    (function () {
        var slides = document.querySelectorAll('.auth-testimonial-slide');
        var prevBtn = document.getElementById('testimonialPrev');
        var nextBtn = document.getElementById('testimonialNext');
        if (!slides.length) return;

        var current = 0;
        function show(i) {
            slides.forEach(function (s) { s.classList.remove('active'); });
            current = ((i % slides.length) + slides.length) % slides.length;
            slides[current].classList.add('active');
        }

        if (prevBtn) prevBtn.addEventListener('click', function () { show(current - 1); });
        if (nextBtn) nextBtn.addEventListener('click', function () { show(current + 1); });
        setInterval(function () { show(current + 1); }, 5000);
    })();

    /* ─────────────────────────────────────────────
     *  11. GSAP ENTRANCE ANIMATIONS
     * ───────────────────────────────────────────── */
    function runEntryAnimations() {
        if (typeof gsap === 'undefined') {
            // GSAP not loaded — force everything visible
            document.querySelectorAll('.auth-logo-link, .auth-back-btn, .auth-heading, .auth-social-btn, .auth-divider, .auth-email-label, .auth-legal, .auth-secure, .auth-testimonial-area, .auth-testimonial-nav, .auth-step-entry .auth-field, .auth-step-entry .auth-submit').forEach(function(el) {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            return;
        }

        // Left panel
        gsap.fromTo('.auth-logo-link',
            { opacity: 0, y: -15 },
            { opacity: 1, y: 0, duration: 0.5, delay: 0.2, clearProps: 'all' });
        gsap.fromTo('.auth-testimonial-area',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, delay: 0.5, clearProps: 'all' });
        gsap.fromTo('.auth-testimonial-nav',
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.5, delay: 0.7, clearProps: 'all' });

        // Right panel
        gsap.fromTo('.auth-back-btn',
            { opacity: 0, x: -10 },
            { opacity: 1, x: 0, duration: 0.4, delay: 0.3, clearProps: 'all' });
        gsap.fromTo('.auth-heading',
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.5, delay: 0.35, clearProps: 'all' });
        gsap.fromTo('.auth-social-btn',
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, delay: 0.45, clearProps: 'all' });
        gsap.fromTo('.auth-divider',
            { opacity: 0 },
            { opacity: 1, duration: 0.3, delay: 0.65, clearProps: 'all' });
        gsap.fromTo('.auth-email-label',
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.4, delay: 0.7, clearProps: 'all' });
        gsap.fromTo('.auth-step-entry .auth-field',
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.4, delay: 0.75, clearProps: 'all' });
        gsap.fromTo('.auth-step-entry .auth-submit',
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.4, delay: 0.85, clearProps: 'all' });
        gsap.fromTo('.auth-legal',
            { opacity: 0 },
            { opacity: 1, duration: 0.3, delay: 0.95, clearProps: 'all' });
        gsap.fromTo('.auth-secure',
            { opacity: 0 },
            { opacity: 1, duration: 0.3, delay: 1.0, clearProps: 'all' });
    }

    document.addEventListener('DOMContentLoaded', function () {
        // Wait a tick to let GSAP finish loading (it's deferred)
        setTimeout(runEntryAnimations, 50);
    });

})();
