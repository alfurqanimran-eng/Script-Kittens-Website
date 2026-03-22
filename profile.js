document.addEventListener('DOMContentLoaded', () => {
    var savedStatus = localStorage.getItem('userStatus');
    if (savedStatus) {
        var el = document.getElementById('currentStatus');
        if (el) el.textContent = savedStatus;
        setTimeout(function () { updateStatusVisual(savedStatus); }, 100);
    }
    initSwipeTransition();
    initCursor();
    initParticles();
    initGSAPAnimations();
    loadProfileFromAPI();
    initTabNavigation();
    initFormHandlers();
    initToggleSwitches();
    initStatusSelector();
    initFileUpload();
    initAboutMeEditor();
    initPasswordStrength();
    initPasswordToggle();
    initQuickActions();
    initSmoothScroll();
    loadSecuritySessions();

    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    if (connected) {
        showToast(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`, 'success');
        window.history.replaceState({}, '', window.location.pathname);
        const accountTab = document.querySelector('[data-tab="account"]');
        if (accountTab) accountTab.click();
    }

    function initSwipeTransition() {
        const swipe = document.getElementById('pageSwipe');
        const container = document.getElementById('profileContainer');

        // Fallback if GSAP is missing
        if (typeof gsap === 'undefined') {
            console.warn('GSAP not loaded. Skipping animations.');
            if (swipe) swipe.style.display = 'none';
            if (container) {
                container.classList.add('visible');
                container.style.opacity = '1';
            }
            return;
        }

        if (!swipe) return;

        if (sessionStorage.getItem('pageSwipe') === '1') {
            sessionStorage.removeItem('pageSwipe');
            gsap.set(swipe, { opacity: 1, pointerEvents: 'all' });
            if (container) container.classList.add('visible');
            gsap.to(swipe, {
                opacity: 0,
                duration: 0.4,
                delay: 0.05,
                ease: 'power2.out',
                onComplete: () => {
                    gsap.set(swipe, { pointerEvents: 'none' });
                    animatePageIn();
                }
            });
        } else {
            if (container) container.classList.add('visible');
            animatePageIn();
        }

        document.querySelectorAll('a[href]').forEach(link => {

            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript') || href === 'https://profile.script-kittens.com') return;
            if (href.includes('script-kittens.com') && !href.includes('profile.script-kittens.com') || (href === '/')) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    sessionStorage.setItem('pageSwipe', '1');
                    gsap.to(swipe, {
                        opacity: 1,
                        duration: 0.3,
                        ease: 'power2.in',
                        onStart: () => { gsap.set(swipe, { pointerEvents: 'all' }); },
                        onComplete: () => { window.location.href = href; }
                    });
                });
            }
        });
    }

    function animatePageIn() {
        if (typeof gsap === 'undefined') return;

        var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.from('.profile-navbar', { y: -30, opacity: 0, duration: 0.5 })
            .from('.profile-banner', { scaleX: 0.8, opacity: 0, duration: 0.7, ease: 'power4.out' }, '-=0.2')
            .from('.avatar-container', { scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' }, '-=0.3')
            .from('.profile-info-col', { x: -30, opacity: 0, duration: 0.5 }, '-=0.3')
            .from('.profile-right-col', { x: 20, opacity: 0, duration: 0.4 }, '-=0.3')
            .from('.profile-xp-section', { y: 15, opacity: 0, duration: 0.4 }, '-=0.2')
            .from('.about-me-section', { y: 15, opacity: 0, duration: 0.4 }, '-=0.2')
            .from('.stat-card', { y: 30, opacity: 0, duration: 0.4, stagger: 0.08, ease: 'back.out(1.4)', clearProps: 'opacity,transform' }, '-=0.2');

        initStatsAnimation();
        initBannerParallax();
        initStatCardHoverGSAP();
        initNewSectionAnimations();
        initSettingsAnimations();

        setTimeout(function () {
            var selectors = '.stat-card, .rank-tier-section, .achievements-section, .activity-section, .content-wrapper, .sidebar, .content-area, .footer-pro';
            document.querySelectorAll(selectors).forEach(function (el) {
                var computed = getComputedStyle(el);
                if (computed.opacity === '0' || parseFloat(computed.opacity) < 0.1) {
                    el.style.opacity = '1';
                    el.style.transform = 'none';
                }
            });
        }, 2500);
    }

    function initSettingsAnimations() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);

        gsap.fromTo('.content-wrapper', { y: 30, opacity: 0 }, {
            scrollTrigger: { trigger: '.content-wrapper', start: 'top 95%', once: true },
            y: 0, opacity: 1, duration: 0.6, ease: 'power3.out'
        });

        gsap.fromTo('.footer-pro', { y: 20, opacity: 0 }, {
            scrollTrigger: { trigger: '.footer-pro', start: 'top 95%', once: true },
            y: 0, opacity: 1, duration: 0.5, ease: 'power3.out'
        });
    }

    function initGSAPAnimations() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);
    }

    function initCursor() {
        const dot = document.querySelector('.cursor-dot');
        const outline = document.querySelector('.cursor-outline');
        if (!dot || !outline) return;

        let mx = 0, my = 0, dx = 0, dy = 0, ox = 0, oy = 0;

        document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

        (function anim() {
            dx += (mx - dx) * 0.5;
            dy += (my - dy) * 0.5;
            ox += (mx - ox) * 0.15;
            oy += (my - oy) * 0.15;
            dot.style.left = dx + 'px';
            dot.style.top = dy + 'px';
            outline.style.left = ox + 'px';
            outline.style.top = oy + 'px';
            requestAnimationFrame(anim);
        })();

        const addHover = () => {
            document.querySelectorAll('button, a, input, textarea, select, .toggle-switch, .nav-item, .stat-card, .badge, .theme-card, .color-swatch, .font-size-option, .footer-pro-social, .footer-pro-tag, .navbar-link, .navbar-action-btn, .navbar-avatar').forEach(el => {
                el.addEventListener('mouseenter', () => { dot.classList.add('hovering'); outline.classList.add('hovering'); });
                el.addEventListener('mouseleave', () => { dot.classList.remove('hovering'); outline.classList.remove('hovering'); });
            });
        };
        addHover();
        setTimeout(addHover, 2000);
    }

    function initParticles() {
        const canvas = document.getElementById('particles-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const count = Math.min(70, Math.floor(window.innerWidth / 20));

        class Particle {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 3 + 0.5;
                this.vx = (Math.random() - 0.5) * 0.6;
                this.vy = (Math.random() - 0.5) * 0.6;
                this.opacity = Math.random() * 0.5 + 0.15;
                const colors = ['143,0,255', '255,0,168', '0,240,255'];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x > canvas.width || this.x < 0) this.vx *= -1;
                if (this.y > canvas.height || this.y < 0) this.vy *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.color},${this.opacity})`;
                ctx.fill();
            }
        }

        for (let i = 0; i < count; i++) particles.push(new Particle());

        function loop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 130) {
                        ctx.strokeStyle = `rgba(143,0,255,${0.12 * (1 - dist / 130)})`;
                        ctx.lineWidth = 0.8;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(loop);
        }
        loop();

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    function initStatsAnimation() {
        document.querySelectorAll('.stat-value').forEach(function (el) {
            var target = parseInt(el.dataset.target) || 0;
            if (typeof gsap !== 'undefined') {
                var obj = { val: 0 };
                gsap.to(obj, {
                    val: target,
                    duration: 1.8,
                    delay: 0.5,
                    ease: 'power2.out',
                    onUpdate: function () { el.textContent = Math.floor(obj.val); }
                });
            } else {
                el.textContent = target;
            }
        });
    }

    function initBannerParallax() {
        var banner = document.querySelector('.profile-banner');
        if (!banner) return;
        var particles = banner.querySelectorAll('.b-particle');
        var mesh = banner.querySelector('.banner-mesh');

        banner.addEventListener('mousemove', function (e) {
            var rect = banner.getBoundingClientRect();
            var x = (e.clientX - rect.left) / rect.width - 0.5;
            var y = (e.clientY - rect.top) / rect.height - 0.5;

            if (typeof gsap !== 'undefined') {
                particles.forEach(function (p, i) {
                    gsap.to(p, {
                        x: x * (20 + i * 8),
                        y: y * (15 + i * 6),
                        duration: 0.6,
                        ease: 'power2.out'
                    });
                });
                if (mesh) {
                    gsap.to(mesh, {
                        x: x * 10,
                        y: y * 8,
                        duration: 0.8,
                        ease: 'power2.out'
                    });
                }
            }
        });

        banner.addEventListener('mouseleave', function () {
            if (typeof gsap !== 'undefined') {
                particles.forEach(function (p) {
                    gsap.to(p, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
                });
                if (mesh) {
                    gsap.to(mesh, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
                }
            }
        });
    }

    function initStatCardHoverGSAP() {
        document.querySelectorAll('.stat-card').forEach(function (card) {
            var iconWrap = card.querySelector('.stat-icon-wrap');
            if (!iconWrap) return;
            card.addEventListener('mouseenter', function () {
                if (typeof gsap !== 'undefined') {
                    gsap.to(iconWrap, {
                        rotation: 5,
                        scale: 1.15,
                        duration: 0.3,
                        ease: 'back.out(2)'
                    });
                }
            });
            card.addEventListener('mouseleave', function () {
                if (typeof gsap !== 'undefined') {
                    gsap.to(iconWrap, {
                        rotation: 0,
                        scale: 1,
                        duration: 0.4,
                        ease: 'elastic.out(1, 0.4)'
                    });
                }
            });
        });
    }

    function updateProfileCompletion(profile) {
        var fieldChecks = {
            'display_name': !!profile.display_name,
            'username': !!profile.username,
            'email': !!profile.email,
            'bio': !!(profile.bio && profile.bio !== 'I Love Script Kittens'),
            'avatar': !!profile.avatar,
            'pronouns': !!profile.pronouns,
            'location': !!profile.location
        };
        var total = 7;
        var filled = 0;
        Object.keys(fieldChecks).forEach(function (key) {
            if (fieldChecks[key]) filled++;
            var el = document.querySelector('.completion-field[data-field="' + key + '"]');
            if (el) {
                if (fieldChecks[key]) {
                    el.classList.add('filled');
                } else {
                    el.classList.remove('filled');
                }
            }
        });

        var percent = Math.round((filled / total) * 100);
        var percentEl = document.getElementById('completionPercent');
        var pathEl = document.getElementById('completionPath');
        if (percentEl) percentEl.textContent = percent + '%';
        if (pathEl) {
            var circumference = 2 * Math.PI * 34;
            var dashLen = (percent / 100) * circumference;
            setTimeout(function () {
                pathEl.setAttribute('stroke-dasharray', dashLen + ' ' + circumference);
            }, 600);
        }
    }

    function updateSocialLinks() {
        fetch(apiUrl('/api/auth/linked-accounts'), { credentials: 'include' })
            .then(function (r) {
                if (!r.ok) throw new Error('fail');
                return r.json();
            })
            .then(function (data) {
                var accounts = data.accounts || {};
                var authMethod = data.primary_provider || 'email';
                document.querySelectorAll('.social-link-icon').forEach(function (icon) {
                    var provider = icon.dataset.provider;
                    var info = accounts[provider];
                    var isConnected = !!(info && info.connected);
                    if (provider === authMethod) isConnected = true;
                    if (isConnected) {
                        icon.classList.add('active');
                    }
                });
            })
            .catch(function () {
                var authMethod = localStorage.getItem('userAuthMethod') || 'email';
                if (authMethod !== 'email') {
                    var icon = document.querySelector('.social-link-icon[data-provider="' + authMethod + '"]');
                    if (icon) icon.classList.add('active');
                }
            });
    }

    let profileCache = null;

    function loadProfileFromAPI() {
        fetch(apiUrl('/api/auth/me'), { credentials: 'include' })
            .then(r => {
                if (!r.ok) throw new Error('Backend not available');
                return r.json();
            })
            .then(authData => {
                if (!authData.logged_in) {
                    showGuestProfile();
                    return;
                }
                var authUser = authData.user;
                applyAuthUserData(authUser);

                return fetch(apiUrl('/api/profile'), { credentials: 'include' })
                    .then(r => {
                        if (!r.ok) throw new Error('Profile API not available');
                        return r.json();
                    })
            })
            .catch(err => {
                console.log('Backend not available, showing guest profile');
                showGuestProfile();
            });
    }

    function applyAuthUserData(user) {
        var setVal = function (id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
        var setText = function (id, val) { var el = document.getElementById(id); if (el) el.textContent = val || ''; };

        setVal('displayName', user.display_name);
        setVal('username', user.username);
        setVal('email', user.email);
        setText('profileNameDisplay', user.display_name);
        setText('profileUsernameDisplay', '@' + (user.username || ''));

        var useAvatar = user.avatar || 'https://files.catbox.moe/f7mmfi.jpg';
        if (user.avatar) {
            localStorage.setItem('userAvatar', user.avatar);
        }

        var av = document.getElementById('profileAvatar');
        var nav = document.getElementById('navAvatar');
        if (av) av.src = useAvatar;
        if (nav) nav.src = useAvatar;

        renderRoleBadge(user.role || 'newbie');

        var authMethod = user.auth_method || localStorage.getItem('userAuthMethod') || 'email';
        if (user.auth_method) localStorage.setItem('userAuthMethod', user.auth_method);
        renderConnectedMethods(authMethod);

        localStorage.setItem('userLoggedIn', 'true');
        if (user.display_name) localStorage.setItem('userDisplayName', user.display_name);
        if (user.username) localStorage.setItem('userUsername', user.username);
        if (user.email) localStorage.setItem('userEmail', user.email);
        if (user.role) localStorage.setItem('userRole', user.role);

        var overviewEmail = document.getElementById('overviewEmail');
        if (overviewEmail) overviewEmail.textContent = user.email || 'Not set';
        var overviewAuth = document.getElementById('overviewAuthMethod');
        if (overviewAuth) {
            var methodName = (user.auth_method || 'email');
            overviewAuth.textContent = methodName.charAt(0).toUpperCase() + methodName.slice(1);
        }
    }

    function renderRoleBadge(role) {
        var container = document.getElementById('profileBadges');
        if (!container) return;
        container.innerHTML = '';

        var roles = {
            'newbie': { icon: 'fas fa-seedling', label: 'Newbie', css: 'role-newbie' },
            'senior': { icon: 'fas fa-shield-alt', label: 'Senior', css: 'role-senior' },
            'developer': { icon: 'fas fa-code', label: 'Developer', css: 'role-developer' },
            'team': { icon: 'fas fa-users', label: 'Team Member', css: 'role-team' },
            'moderator': { icon: 'fas fa-gavel', label: 'Moderator', css: 'role-moderator' },
            'admin': { icon: 'fas fa-user-shield', label: 'Admin', css: 'role-admin' },
            'founder': { icon: 'fas fa-crown', label: 'Founder', css: 'role-founder' },
            'vip': { icon: 'fas fa-gem', label: 'VIP', css: 'role-vip' }
        };

        var info = roles[role] || roles['newbie'];
        var badge = document.createElement('span');
        badge.className = 'badge ' + info.css;
        badge.innerHTML = '<i class="' + info.icon + '"></i><span>' + info.label + '</span>';
        container.appendChild(badge);
    }

    function renderConnectedMethods(primaryMethod) {
        var container = document.getElementById('connectedMethodsRow');
        if (!container) return;

        var providerConfig = {
            google: { icon: 'fab fa-google', label: 'Google' },
            github: { icon: 'fab fa-github', label: 'GitHub' },
            discord: { icon: 'fab fa-discord', label: 'Discord' },
            email: { icon: 'fas fa-envelope', label: 'Email' }
        };

        function buildChips(connectedProviders) {
            container.innerHTML = '';
            var primary = primaryMethod || 'email';
            var allProviders = [primary];
            connectedProviders.forEach(function (p) {
                if (allProviders.indexOf(p) === -1) allProviders.push(p);
            });

            allProviders.forEach(function (method) {
                var cfg = providerConfig[method];
                if (!cfg) return;
                var chip = document.createElement('div');
                chip.className = 'method-chip' + (method === primary ? ' primary' : '');
                chip.setAttribute('data-method', method);
                var dot = method === primary ? '<span class="method-primary-dot"></span>' : '';
                chip.innerHTML = '<i class="' + cfg.icon + '"></i><span>' + cfg.label + '</span>' + dot;
                container.appendChild(chip);
            });
        }

        buildChips([primaryMethod]);

        fetch(apiUrl('/api/auth/linked-accounts'), { credentials: 'include' })
            .then(function (r) {
                if (!r.ok) throw new Error('fail');
                return r.json();
            })
            .then(function (data) {
                var accounts = data.accounts || {};
                var connected = [];
                Object.keys(accounts).forEach(function (key) {
                    if (accounts[key] && accounts[key].connected) {
                        connected.push(key);
                    }
                });
                if (data.primary_provider) {
                    primaryMethod = data.primary_provider;
                }
                if (primaryMethod && connected.indexOf(primaryMethod) === -1) {
                    connected.push(primaryMethod);
                }
                buildChips(connected);
            })
            .catch(function () {
                // keep the initial primary-only render
            });
    }

    function showGuestProfile() {
        localStorage.removeItem('userLoggedIn');
        var guestAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%238f00ff'/%3E%3Cstop offset='100%25' stop-color='%2300f0ff'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='60' cy='60' r='60' fill='url(%23g)'/%3E%3Ccircle cx='60' cy='45' r='20' fill='rgba(255,255,255,0.9)'/%3E%3Cellipse cx='60' cy='95' rx='35' ry='25' fill='rgba(255,255,255,0.9)'/%3E%3C/svg%3E";
        var av = document.getElementById('profileAvatar');
        var nav = document.getElementById('navAvatar');
        if (av) av.src = guestAvatar;
        if (nav) nav.src = guestAvatar;
        var nameEl = document.getElementById('profileNameDisplay');
        var usernameEl = document.getElementById('profileUsernameDisplay');
        if (nameEl) nameEl.textContent = 'Guest';
        if (usernameEl) usernameEl.textContent = '@guest';
        var displayNameField = document.getElementById('displayName');
        var usernameField = document.getElementById('username');
        var emailField = document.getElementById('email');
        if (displayNameField) displayNameField.value = '';
        if (usernameField) usernameField.value = '';
        if (emailField) emailField.value = '';
        var aboutEl = document.getElementById('aboutMeText');
        if (aboutEl) aboutEl.textContent = 'Sign in to customize your profile';
        var badgesEl = document.getElementById('profileBadges');
        if (badgesEl) badgesEl.innerHTML = '';
    }

    function populateProfileExtras(p) {
        var setVal = function (id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
        var setText = function (id, val) { var el = document.getElementById(id); if (el) el.textContent = val || ''; };

        setVal('bio', p.bio || 'I Love Script Kittens');
        setVal('location', p.location);
        setVal('pronouns', p.pronouns);

        setText('currentStatus', p.status || 'Available');
        setText('aboutMeText', p.bio || 'I Love Script Kittens');
        setText('memberSince', p.member_since || 'January 2024');
        var overviewMember = document.getElementById('overviewMemberSince');
        if (overviewMember) overviewMember.textContent = p.member_since || 'January 2024';

        var locDisp = document.getElementById('locationDisplay');
        if (locDisp) locDisp.textContent = p.location || '';

        var pronDisp = document.getElementById('pronounsDisplay');
        if (pronDisp) pronDisp.textContent = p.pronouns || '';

        var pronCard = document.getElementById('profilePronounsCard');
        if (pronCard) pronCard.textContent = p.pronouns || '';

        if (p.bio) localStorage.setItem('userBio', p.bio);

        updateStatusVisual(p.status || 'Available');

        const stats = {
            points: p.points || 0,
            achievements: p.achievements || 0,
            followers: p.followers || 0,
            level: p.level || 0,
            games: p.games || 0,
            downloads: p.downloads || 0
        };
        document.querySelectorAll('.stat-card').forEach(card => {
            const key = card.dataset.stat;
            if (key && stats[key] !== undefined) {
                const valEl = card.querySelector('.stat-value');
                if (valEl) valEl.dataset.target = stats[key];
            }
        });

        var xpLevel = stats.level || 1;
        var xpPoints = stats.points || 0;
        var xpMax = xpLevel * 100;
        var xpPercent = Math.min((xpPoints / xpMax) * 100, 100);
        var xpLevelEl = document.getElementById('xpLevelNum');
        var xpCurrentEl = document.getElementById('xpCurrent');
        var xpMaxEl = document.getElementById('xpMax');
        var xpBarEl = document.getElementById('xpBarFill');
        if (xpLevelEl) xpLevelEl.textContent = xpLevel;
        if (xpCurrentEl) xpCurrentEl.textContent = xpPoints;
        if (xpMaxEl) xpMaxEl.textContent = xpMax;
        if (xpBarEl) {
            setTimeout(function () { xpBarEl.style.width = xpPercent + '%'; }, 300);
        }

        updateProfileCompletion(p);
        updateSocialLinks();
        updateRankTier(stats.level);

        if (p.settings) {
            document.querySelectorAll('.toggle-switch[data-setting]').forEach(label => {
                const key = label.dataset.setting;
                const toggle = label.querySelector('input');
                if (toggle && p.settings[key] !== undefined) {
                    toggle.checked = p.settings[key] === 'true';
                }
            });
        }

        if (p.recent_activity && p.recent_activity.length > 0) {
            renderActivity(p.recent_activity);
        }

        if (p.theme) {
            document.querySelectorAll('.theme-card').forEach(card => {
                card.classList.toggle('active', card.dataset.theme === p.theme);
            });
        }
        if (p.accent_color) {
            document.querySelectorAll('.color-swatch').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.color === p.accent_color);
            });
        }
    }

    function renderActivity(activities) {
        const timeline = document.getElementById('activityTimeline');
        if (!timeline || activities.length === 0) return;

        var actionMap = {
            'profile_update': { label: 'Profile Updated', icon: 'fas fa-user-pen', color: '#8f00ff' },
            'settings_change': { label: 'Settings Changed', icon: 'fas fa-sliders', color: '#00f0ff' },
            'login': { label: 'Logged In', icon: 'fas fa-right-to-bracket', color: '#10b981' },
            'logout': { label: 'Logged Out', icon: 'fas fa-right-from-bracket', color: '#f59e0b' },
            'avatar_change': { label: 'Avatar Changed', icon: 'fas fa-image', color: '#ff00a8' },
            'password_change': { label: 'Password Changed', icon: 'fas fa-lock', color: '#10b981' },
            'account_linked': { label: 'Account Linked', icon: 'fas fa-link', color: '#3b82f6' }
        };

        function prettifyDetails(raw) {
            if (!raw) return '';
            var text = raw.replace(/Updated:\s*/i, '').replace(/,?\s*updated_at/gi, '').replace(/,?\s*created_at/gi, '').trim();
            if (!text) return '';
            var fields = text.split(',').map(function (f) { return f.trim(); }).filter(Boolean);
            var pretty = fields.map(function (f) {
                var map = {
                    'avatar': 'Profile picture', 'bio': 'Bio', 'status': 'Status',
                    'display_name': 'Display name', 'username': 'Username', 'pronouns': 'Pronouns',
                    'location': 'Location', 'theme': 'Theme', 'accent_color': 'Accent color',
                    'email': 'Email', 'password': 'Password', 'name': 'Name'
                };
                return map[f] || f.charAt(0).toUpperCase() + f.slice(1).replace(/_/g, ' ');
            });
            if (pretty.length === 1) return 'Changed ' + pretty[0].toLowerCase();
            if (pretty.length === 2) return 'Changed ' + pretty[0].toLowerCase() + ' and ' + pretty[1].toLowerCase();
            return 'Changed ' + pretty.slice(0, -1).join(', ').toLowerCase() + ' and ' + pretty[pretty.length - 1].toLowerCase();
        }

        timeline.innerHTML = '';
        activities.forEach(function (act, idx) {
            var item = document.createElement('div');
            item.className = 'activity-item';
            item.style.animationDelay = (idx * 0.08) + 's';
            var timeStr = formatTime(act.timestamp);
            var info = actionMap[act.action] || { label: act.action ? act.action.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }) : 'Activity', icon: 'fas fa-circle-info', color: '#8f00ff' };
            var details = prettifyDetails(act.details);

            item.innerHTML = '<div class="activity-dot-wrap"><div class="activity-dot" style="background:' + info.color + ';border-color:' + info.color + '33;box-shadow:0 0 10px ' + info.color + '44"></div>' + (idx < activities.length - 1 ? '<div class="activity-line"></div>' : '') + '</div>' +
                '<div class="activity-content"><div class="activity-icon-wrap" style="background:' + info.color + '18;border-color:' + info.color + '30;color:' + info.color + '"><i class="' + info.icon + '"></i></div>' +
                '<div class="activity-body"><span class="activity-action">' + info.label + '</span>' +
                (details ? '<span class="activity-details">' + details + '</span>' : '') +
                '<span class="activity-time"><i class="far fa-clock"></i> ' + timeStr + '</span></div></div>';
            timeline.appendChild(item);
        });
    }

    function formatTime(ts) {
        if (!ts) return '';
        try {
            var raw = ts;
            if (raw.indexOf('T') !== -1 && raw.indexOf('Z') === -1 && raw.indexOf('+') === -1 && raw.indexOf('-', 10) === -1) {
                raw = raw + 'Z';
            }
            const d = new Date(raw);
            if (isNaN(d.getTime())) return ts;
            const now = new Date();
            const diff = (now - d) / 1000;
            if (diff < 0) return 'Just now';
            if (diff < 60) return 'Just now';
            if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
            if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
            if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
            return d.toLocaleDateString();
        } catch (e) { return ts; }
    }

    function updateStatusVisual(status) {
        const colors = {
            'Available': '#10b981',
            'Busy': '#ef4444',
            'Away': '#f59e0b',
            'Do Not Disturb': '#dc2626',
            'Invisible': '#6b7280'
        };
        const color = colors[status] || '#10b981';
        const dotIcon = document.getElementById('statusDotIcon');
        if (dotIcon) dotIcon.style.color = color;
        const avatarDot = document.getElementById('avatarStatusDot');
        if (avatarDot) {
            avatarDot.style.background = color;
            const ring = avatarDot.querySelector('.pulse-ring');
            if (ring) ring.style.borderColor = color;
        }
        const navStatus = document.querySelector('.navbar-avatar-status');
        if (navStatus) {
            navStatus.style.background = color;
            navStatus.style.boxShadow = '0 0 8px ' + color.replace(')', ',0.5)').replace('rgb', 'rgba');
        }
        localStorage.setItem('userStatus', status);
    }

    function saveToAPI(data) {
        return fetch(apiUrl('/api/profile'), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        }).then(r => r.json());
    }

    function refreshActivityFeed() {
        fetch(apiUrl('/api/profile'), { credentials: 'include' })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.status === 'success' && data.profile && data.profile.recent_activity) {
                    renderActivity(data.profile.recent_activity);
                }
            })
            .catch(function () { });
    }

    function saveSettingsToAPI(data) {
        return fetch(apiUrl('/api/profile/settings'), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        }).then(r => r.json());
    }

    function initTabNavigation() {
        const items = document.querySelectorAll('.nav-item');
        const tabs = document.querySelectorAll('.tab-content');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                items.forEach(n => n.classList.remove('active'));
                tabs.forEach(t => t.classList.remove('active'));
                item.classList.add('active');
                const target = document.getElementById(tab + '-tab');
                if (target) target.classList.add('active');
            });
        });
    }

    function initStatusSelector() {
        var selector = document.getElementById('statusSelector');
        var dropdown = document.getElementById('statusDropdown');
        if (!selector || !dropdown) return;

        document.body.appendChild(dropdown);

        function positionDropdown() {
            var rect = selector.getBoundingClientRect();
            dropdown.style.top = (rect.bottom + 8) + 'px';
            dropdown.style.left = (rect.left + rect.width / 2 - 110) + 'px';
        }

        function openDropdown() {
            positionDropdown();
            dropdown.classList.add('active');
            selector.classList.add('open');
        }

        function closeDropdown() {
            dropdown.classList.remove('active');
            selector.classList.remove('open');
        }

        selector.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (dropdown.classList.contains('active')) {
                closeDropdown();
            } else {
                openDropdown();
            }
        });

        dropdown.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        var options = dropdown.querySelectorAll('.status-option');
        for (var i = 0; i < options.length; i++) {
            (function (opt) {
                opt.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var status = opt.dataset.status;
                    document.getElementById('currentStatus').textContent = status;
                    updateStatusVisual(status);
                    closeDropdown();

                    saveToAPI({ status: status }).then(function (res) {
                        if (res.status === 'success') {
                            showToast('Status changed to ' + status, 'success');
                            refreshActivityFeed();
                        } else {
                            showToast('Failed to update status', 'error');
                        }
                    }).catch(function () { showToast('Network error', 'error'); });
                });
            })(options[i]);
        }

        document.addEventListener('click', function (e) {
            if (!selector.contains(e.target) && !dropdown.contains(e.target)) {
                closeDropdown();
            }
        });

        window.addEventListener('scroll', function () {
            if (dropdown.classList.contains('active')) {
                positionDropdown();
            }
        }, true);
    }

    function initFileUpload() {
        const avatarBtn = document.getElementById('editAvatarBtn');
        const avatarInput = document.getElementById('avatarFileInput');
        const avatarImg = document.getElementById('profileAvatar');

        const avatarContainer = document.querySelector('.avatar-container');
        if (avatarBtn && avatarInput) {
            avatarBtn.addEventListener('click', () => avatarInput.click());
            if (avatarContainer) {
                avatarContainer.style.cursor = 'pointer';
                avatarContainer.addEventListener('click', (e) => {
                    if (e.target !== avatarBtn && !avatarBtn.contains(e.target)) {
                        avatarInput.click();
                    }
                });
            }
            avatarInput.addEventListener('change', e => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) { showToast('Image must be under 10MB', 'error'); return; }

                // Check MIME type OR extension (for JFIF/HEIC support)
                const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jfif', '.heic', '.heif', '.avif'];
                const ext = '.' + file.name.split('.').pop().toLowerCase();
                const isImageMime = file.type.startsWith('image/');
                const isValidExt = validExtensions.includes(ext);

                if (!isImageMime && !isValidExt) {
                    showToast('Please select a valid image file', 'error');
                    return;
                }

                // Immediate preview
                const reader = new FileReader();
                reader.onload = ev => {
                    if (avatarImg) avatarImg.src = ev.target.result;
                    const nav = document.getElementById('navAvatar');
                    if (nav) nav.src = ev.target.result;
                };
                reader.readAsDataURL(file);

                // Professional Multipart Upload
                const formData = new FormData();
                formData.append('avatar', file);

                fetch(apiUrl('/api/profile/upload-avatar'), {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                })
                    .then(r => r.json())
                    .then(res => {
                        if (res.status === 'success') {
                            showToast('Avatar updated!', 'success');
                            if (res.avatar_url) {
                                localStorage.setItem('userAvatar', res.avatar_url);
                            }
                            refreshActivityFeed();
                        } else {
                            showToast('Failed to save: ' + (res.message || ''), 'error');
                        }
                    })
                    .catch(() => showToast('Failed to upload avatar', 'error'));
            });
        }

    }

    function initAboutMeEditor() {
        const editBtn = document.getElementById('editAboutBtn');
        const textEl = document.getElementById('aboutMeText');
        const editWrap = document.getElementById('aboutMeEdit');
        const textarea = document.getElementById('aboutMeTextarea');
        const saveBtn = document.getElementById('saveAboutBtn');
        const cancelBtn = document.getElementById('cancelAboutBtn');
        const contentWrap = document.querySelector('.about-me-content');

        if (!editBtn) return;

        editBtn.addEventListener('click', () => {
            textarea.value = textEl.textContent;
            contentWrap.style.display = 'none';
            editWrap.style.display = 'block';
            textarea.focus();
        });

        saveBtn.addEventListener('click', () => {
            const newBio = textarea.value.trim();
            if (!newBio) { showToast('Bio cannot be empty', 'error'); return; }

            saveToAPI({ bio: newBio }).then(function (res) {
                if (res.status === 'success') {
                    textEl.textContent = newBio;
                    contentWrap.style.display = 'block';
                    editWrap.style.display = 'none';
                    localStorage.setItem('userBio', newBio);
                    var bioField = document.getElementById('bio');
                    if (bioField) bioField.value = newBio;
                    showToast('Bio updated!', 'success');
                    refreshActivityFeed();
                } else {
                    showToast('Failed to update bio', 'error');
                }
            }).catch(function () { showToast('Network error', 'error'); });
        });

        cancelBtn.addEventListener('click', () => {
            contentWrap.style.display = 'block';
            editWrap.style.display = 'none';
        });
    }

    function initFormHandlers() {
        var detectLocBtn = document.getElementById('detectLocationBtn');
        if (detectLocBtn) {
            detectLocBtn.addEventListener('click', function () {
                var locInput = document.getElementById('location');
                if (!navigator.geolocation) {
                    showToast('Geolocation not supported by your browser', 'error');
                    return;
                }
                detectLocBtn.classList.add('detecting');
                detectLocBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                navigator.geolocation.getCurrentPosition(
                    function (pos) {
                        fetch('https://nominatim.openstreetmap.org/reverse?lat=' + pos.coords.latitude + '&lon=' + pos.coords.longitude + '&format=json&addressdetails=1')
                            .then(function (r) { return r.json(); })
                            .then(function (data) {
                                var addr = data.address || {};
                                var city = addr.city || addr.town || addr.village || addr.state || '';
                                var country = addr.country || '';
                                var loc = city && country ? city + ', ' + country : city || country || 'Unknown';
                                if (locInput) locInput.value = loc;
                                detectLocBtn.classList.remove('detecting');
                                detectLocBtn.innerHTML = '<i class="fas fa-check"></i>';
                                showToast('Location detected: ' + loc, 'success');
                                setTimeout(function () { detectLocBtn.innerHTML = '<i class="fas fa-crosshairs"></i>'; }, 2000);
                            })
                            .catch(function () {
                                detectLocBtn.classList.remove('detecting');
                                detectLocBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
                                showToast('Could not detect location', 'error');
                            });
                    },
                    function (err) {
                        detectLocBtn.classList.remove('detecting');
                        detectLocBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
                        if (err.code === 1) showToast('Location access denied. Please allow in browser settings.', 'error');
                        else showToast('Could not detect location', 'error');
                    },
                    { enableHighAccuracy: false, timeout: 10000 }
                );
            });
        }

        const saveGeneral = document.getElementById('saveGeneralBtn');
        if (saveGeneral) {
            saveGeneral.addEventListener('click', () => {
                const displayName = document.getElementById('displayName').value.trim();
                const username = document.getElementById('username').value.trim();
                const bio = document.getElementById('bio').value.trim();
                const pronouns = document.getElementById('pronouns').value.trim();
                const location = document.getElementById('location').value.trim();

                if (!displayName || !username) {
                    showToast('Display name and username are required', 'error');
                    return;
                }

                const btn = saveGeneral;
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Saving...</span>';

                saveToAPI({ display_name: displayName, username, bio, pronouns, location })
                    .then(res => {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-check"></i><span>Saved!</span>';
                        setTimeout(() => { btn.innerHTML = '<i class="fas fa-save"></i><span>Save Changes</span>'; }, 2000);
                        if (res.status === 'success') {
                            document.getElementById('profileNameDisplay').textContent = displayName;
                            document.getElementById('profileUsernameDisplay').textContent = '@' + username;
                            document.getElementById('aboutMeText').textContent = bio;
                            var pronDisp = document.getElementById('pronounsDisplay');
                            if (pronDisp) pronDisp.textContent = pronouns;
                            var pronCard = document.getElementById('profilePronounsCard');
                            if (pronCard) pronCard.textContent = pronouns;
                            var locDisp = document.getElementById('locationDisplay');
                            if (locDisp) locDisp.textContent = location;
                            localStorage.setItem('userDisplayName', displayName);
                            localStorage.setItem('userUsername', username);
                            if (bio) localStorage.setItem('userBio', bio);
                            showToast('Profile saved successfully!', 'success');
                            refreshActivityFeed();
                        } else {
                            showToast(res.message || 'Failed to save', 'error');
                        }
                    })
                    .catch(() => {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-save"></i><span>Save Changes</span>';
                        showToast('Network error', 'error');
                    });
            });
        }

        const cancelGeneral = document.getElementById('cancelGeneralBtn');
        if (cancelGeneral) {
            cancelGeneral.addEventListener('click', () => {
                loadProfileFromAPI();
                showToast('Changes cancelled', 'info');
            });
        }

        const updatePwd = document.getElementById('updatePasswordBtn');
        if (updatePwd) {
            updatePwd.addEventListener('click', () => {
                const curr = document.getElementById('currentPassword').value;
                const newP = document.getElementById('newPassword').value;
                const conf = document.getElementById('confirmPassword').value;

                if (!curr || !newP || !conf) { showToast('Fill in all password fields', 'error'); return; }
                if (newP !== conf) { showToast('Passwords do not match', 'error'); return; }
                if (newP.length < 8) { showToast('Password must be 8+ characters', 'error'); return; }

                updatePwd.disabled = true;
                updatePwd.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Updating...</span>';

                fetch(apiUrl('/api/auth/change-password'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        current_password: curr,
                        new_password: newP,
                        confirm_password: conf
                    })
                }).then(r => r.json()).then(res => {
                    updatePwd.disabled = false;
                    updatePwd.innerHTML = '<i class="fas fa-shield-alt"></i><span>Update Password</span>';
                    if (res.status === 'success') {
                        document.getElementById('currentPassword').value = '';
                        document.getElementById('newPassword').value = '';
                        document.getElementById('confirmPassword').value = '';
                        const fill = document.getElementById('strengthBarFill');
                        if (fill) { fill.style.width = '0%'; }
                        document.getElementById('strengthText').textContent = 'Password Strength';
                        const mi = document.getElementById('passwordMatchIndicator');
                        if (mi) { mi.textContent = ''; mi.className = 'password-match-indicator'; }
                        showToast('Password updated successfully!', 'success');
                    } else {
                        showToast(res.message || 'Failed to update password', 'error');
                    }
                }).catch(() => {
                    updatePwd.disabled = false;
                    updatePwd.innerHTML = '<i class="fas fa-shield-alt"></i><span>Update Password</span>';
                    showToast('Network error', 'error');
                });
            });
        }

        initPasswordMatch();
        loadConnectedAccounts();

        const deleteBtn = document.getElementById('deleteAccountBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('WARNING: This will permanently delete your account and all your data!\n\nThis action cannot be undone. Are you absolutely sure?')) {
                    const confirmation = prompt('Type "DELETE" to confirm account deletion:');
                    if (confirmation === 'DELETE') {
                        deleteBtn.disabled = true;
                        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Deleting...</span>';
                        fetch('/api/auth/delete-account', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ confirmation: 'DELETE' })
                        })
                            .then(r => r.json())
                            .then(data => {
                                if (data.status === 'success') {
                                    localStorage.clear();
                                    showToast('Account deleted. Redirecting...', 'error');
                                    setTimeout(() => window.location.href = '/', 2000);
                                } else {
                                    deleteBtn.disabled = false;
                                    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i><span>Delete Account</span>';
                                    showToast(data.message || 'Deletion failed', 'error');
                                }
                            })
                            .catch(() => {
                                deleteBtn.disabled = false;
                                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i><span>Delete Account</span>';
                                showToast('Network error — try again', 'error');
                            });
                    } else {
                        showToast('Account deletion cancelled', 'info');
                    }
                }
            });
        }

        const securityBtn = document.getElementById('updateSecurityBtn');
        if (securityBtn) {
            securityBtn.addEventListener('click', () => {
                const settings = {};
                document.querySelectorAll('#security-tab .toggle-switch input').forEach(t => {
                    settings[t.dataset.setting] = t.checked.toString();
                });
                securityBtn.disabled = true;
                securityBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Saving...</span>';
                saveSettingsToAPI(settings).then(res => {
                    securityBtn.disabled = false;
                    securityBtn.innerHTML = '<i class="fas fa-shield-alt"></i><span>Save Security Settings</span>';
                    if (res.status === 'success') {
                        showToast('Security settings saved!', 'success');
                    }
                }).catch(() => {
                    securityBtn.disabled = false;
                    securityBtn.innerHTML = '<i class="fas fa-shield-alt"></i><span>Save Security Settings</span>';
                    showToast('Network error', 'error');
                });
            });
        }
    }

    function initToggleSwitches() {
        document.querySelectorAll('.toggle-switch[data-setting]').forEach(label => {
            const toggle = label.querySelector('input');
            if (!toggle) return;
            toggle.addEventListener('change', () => {
                const key = label.dataset.setting;
                const val = toggle.checked.toString();
                const name = label.closest('.toggle-item')?.querySelector('.toggle-label')?.textContent || 'Setting';

                saveSettingsToAPI({ [key]: val }).then(res => {
                    if (res.status === 'success') {
                        showToast(`${name} ${toggle.checked ? 'enabled' : 'disabled'}`, 'success');
                    }
                }).catch(() => showToast('Failed to save setting', 'error'));
            });
        });
    }

    function initPasswordMatch() {
        const newPw = document.getElementById('newPassword');
        const confPw = document.getElementById('confirmPassword');
        const indicator = document.getElementById('passwordMatchIndicator');
        if (!newPw || !confPw || !indicator) return;

        function checkMatch() {
            const n = newPw.value;
            const c = confPw.value;
            if (!c) { indicator.textContent = ''; indicator.className = 'password-match-indicator'; return; }
            if (n === c) {
                indicator.textContent = '\u2713 Passwords match';
                indicator.className = 'password-match-indicator match';
            } else {
                indicator.textContent = '\u2717 Passwords do not match';
                indicator.className = 'password-match-indicator no-match';
            }
        }
        newPw.addEventListener('input', checkMatch);
        confPw.addEventListener('input', checkMatch);
    }

    function loadConnectedAccounts() {
        const container = document.getElementById('connectedAccountsList');
        if (!container) return;

        fetch(apiUrl('/api/auth/linked-accounts'), { credentials: 'include' })
            .then(r => {
                if (!r.ok) throw new Error('not available');
                return r.json();
            })
            .then(data => {
                if (data.status !== 'success') throw new Error('fail');
                const accounts = data.accounts || {};
                const authMethod = data.primary_provider || 'email';
                renderConnectedAccounts(container, accounts, authMethod);
                updatePasswordSectionForOAuth(authMethod);
            })
            .catch(() => {
                fetch(apiUrl('/api/auth/me'), { credentials: 'include' })
                    .then(r => r.json())
                    .then(me => {
                        const authMethod = me.auth_method || 'email';
                        const accounts = {};
                        if (authMethod !== 'email') {
                            accounts[authMethod] = {
                                connected: true,
                                provider_username: me.name || me.username || ''
                            };
                        }
                        renderConnectedAccounts(container, accounts, authMethod);
                        updatePasswordSectionForOAuth(authMethod);
                    })
                    .catch(() => {
                        renderConnectedAccounts(container, {}, 'email');
                    });
            });
    }

    function updatePasswordSectionForOAuth(authMethod) {
        if (authMethod !== 'email') {
            const pwdCard = document.querySelector('.acct-password-card');
            if (pwdCard) {
                const inputs = pwdCard.querySelectorAll('input');
                const btn = pwdCard.querySelector('#updatePasswordBtn');
                inputs.forEach(i => { i.disabled = true; i.placeholder = 'Not available for ' + authMethod.charAt(0).toUpperCase() + authMethod.slice(1) + ' accounts'; i.style.opacity = '0.4'; });
                if (btn) {
                    btn.disabled = true;
                    btn.style.opacity = '0.3';
                    btn.style.cursor = 'not-allowed';
                    btn.style.pointerEvents = 'none';
                }
                const header = pwdCard.querySelector('.acct-card-header');
                if (header && !header.querySelector('.oauth-note')) {
                    const note = document.createElement('div');
                    note.className = 'oauth-note';
                    note.style.cssText = 'font-size:11px;color:rgba(239,68,68,0.6);margin-top:8px;font-style:italic;display:flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(239,68,68,0.05);border-radius:8px;border:1px solid rgba(239,68,68,0.1);';
                    note.innerHTML = '<i class="fas fa-info-circle" style="font-size:10px;"></i> Password management is disabled for ' + authMethod.charAt(0).toUpperCase() + authMethod.slice(1) + ' accounts';
                    header.after(note);
                }
            }
        }
    }

    function renderConnectedAccounts(container, accounts, authMethod) {
        const providers = [
            { id: 'discord', name: 'Discord', icon: 'fab fa-discord', iconClass: 'discord-icon' },
            { id: 'github', name: 'GitHub', icon: 'fab fa-github', iconClass: 'github-icon' },
            { id: 'google', name: 'Google', icon: 'fab fa-google', iconClass: 'google-icon' },
            { id: 'twitter', name: 'Twitter / X', icon: 'fab fa-x-twitter', iconClass: 'twitter-icon' },
            { id: 'twitch', name: 'Twitch', icon: 'fab fa-twitch', iconClass: 'twitch-icon' },
            { id: 'steam', name: 'Steam', icon: 'fab fa-steam', iconClass: 'steam-icon' },
            { id: 'spotify', name: 'Spotify', icon: 'fab fa-spotify', iconClass: 'spotify-icon' },
            { id: 'youtube', name: 'YouTube', icon: 'fab fa-youtube', iconClass: 'youtube-icon' },
            { id: 'reddit', name: 'Reddit', icon: 'fab fa-reddit-alien', iconClass: 'reddit-icon' },
            { id: 'epic', name: 'Epic Games', icon: 'fas fa-gamepad', iconClass: 'epic-icon' },
            { id: 'playstation', name: 'PlayStation', icon: 'fab fa-playstation', iconClass: 'playstation-icon' },
            { id: 'xbox', name: 'Xbox', icon: 'fab fa-xbox', iconClass: 'xbox-icon' },
            { id: 'battlenet', name: 'Battle.net', icon: 'fas fa-hat-wizard', iconClass: 'battlenet-icon' }
        ];

        const primaryProviders = [];
        const otherProviders = [];

        providers.forEach(p => {
            const info = accounts[p.id];
            const isConnected = !!(info && info.connected);
            const isPrimary = authMethod === p.id;
            const username = info ? info.provider_username : '';
            const classes = ['connected-account'];
            if (isConnected) classes.push('is-connected');
            if (isPrimary) classes.push('is-primary');

            let btnHtml;
            if (isPrimary) {
                btnHtml = '<span class="btn-primary-badge"><i class="fas fa-check-circle"></i> Primary</span>';
            } else if (isConnected) {
                btnHtml = `<button class="btn-disconnect" data-provider="${p.id}">Disconnect</button>`;
            } else {
                btnHtml = `<button class="btn-connect" data-provider="${p.id}">Connect</button>`;
            }

            const html = `<div class="${classes.join(' ')}">
                <div class="account-info">
                    <div class="account-icon-wrap ${p.iconClass}">
                        <i class="${p.icon}"></i>
                    </div>
                    <div class="account-details">
                        <span class="account-name">${p.name}</span>
                        ${username ? `<span class="account-username">${username}</span>` : ''}
                        <span class="account-status ${isConnected ? 'connected' : 'not-connected'}">${isConnected ? 'Connected' : 'Not Connected'}</span>
                    </div>
                </div>
                ${btnHtml}
            </div>`;

            if (isPrimary) {
                primaryProviders.push(html);
            } else {
                otherProviders.push(html);
            }
        });

        var mainIds = ['discord', 'github', 'google'];
        var mainProviderHtml = [];
        var extraProviderHtml = [];
        var allHtml = primaryProviders.concat(otherProviders);

        providers.forEach(function (p, idx) {
            var info = accounts[p.id];
            var isConnected = !!(info && info.connected);
            var isPrimary = authMethod === p.id;
            var username = info ? info.provider_username : '';
            var classes = ['connected-account'];
            if (isConnected) classes.push('is-connected');
            if (isPrimary) classes.push('is-primary');
            var btnHtml;
            if (isPrimary) {
                btnHtml = '<span class="btn-primary-badge"><i class="fas fa-check-circle"></i> Primary</span>';
            } else if (isConnected) {
                btnHtml = '<button class="btn-disconnect" data-provider="' + p.id + '">Disconnect</button>';
            } else {
                btnHtml = '<button class="btn-connect" data-provider="' + p.id + '">Connect</button>';
            }
            var html = '<div class="' + classes.join(' ') + '">' +
                '<div class="account-info"><div class="account-icon-wrap ' + p.iconClass + '"><i class="' + p.icon + '"></i></div>' +
                '<div class="account-details"><span class="account-name">' + p.name + '</span>' +
                (username ? '<span class="account-username">' + username + '</span>' : '') +
                '<span class="account-status ' + (isConnected ? 'connected' : 'not-connected') + '">' + (isConnected ? 'Connected' : 'Not Connected') + '</span>' +
                '</div></div>' + btnHtml + '</div>';

            if (mainIds.indexOf(p.id) !== -1 || isPrimary) {
                mainProviderHtml.push(html);
            } else {
                extraProviderHtml.push(html);
            }
        });

        var sectionHtml = '';
        sectionHtml += mainProviderHtml.join('');
        if (extraProviderHtml.length > 0) {
            sectionHtml += '<button class="btn-show-more-platforms" id="showMorePlatformsBtn"><i class="fas fa-chevron-down"></i> Show More Platforms <span class="more-count">' + extraProviderHtml.length + '</span></button>';
            sectionHtml += '<div class="extra-platforms-wrap" id="extraPlatformsWrap" style="display:none;">' + extraProviderHtml.join('') + '</div>';
        }

        container.innerHTML = sectionHtml;

        var showMoreBtn = document.getElementById('showMorePlatformsBtn');
        var extraWrap = document.getElementById('extraPlatformsWrap');
        if (showMoreBtn && extraWrap) {
            showMoreBtn.addEventListener('click', function () {
                var isOpen = extraWrap.style.display !== 'none';
                if (isOpen) {
                    extraWrap.style.display = 'none';
                    showMoreBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Show More Platforms <span class="more-count">' + extraProviderHtml.length + '</span>';
                    showMoreBtn.classList.remove('expanded');
                } else {
                    extraWrap.style.display = 'flex';
                    showMoreBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Show Less';
                    showMoreBtn.classList.add('expanded');
                }
            });
        }

        container.querySelectorAll('.btn-connect').forEach(btn => {
            btn.addEventListener('click', () => {
                const provider = btn.dataset.provider;
                const pObj = providers.find(function (pp) { return pp.id === provider; });
                const providerName = pObj ? pObj.name : provider.charAt(0).toUpperCase() + provider.slice(1);
                if (['discord', 'github', 'google'].indexOf(provider) === -1) {
                    showToast(providerName + ' integration coming soon!', 'info');
                    return;
                }
                const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
                if (!isLoggedIn) {
                    showToast('Please log in first to connect ' + providerName, 'error');
                    return;
                }
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
                const connectUrl = apiUrl(`/api/auth/connect/${provider}`);
                const oauthUrl = apiUrl(`/api/auth/oauth/${provider}`);
                fetch(connectUrl)
                    .then(r => {
                        if (r.redirected) {
                            window.location.href = r.url;
                            return;
                        }
                        if (r.status === 404) {
                            window.location.href = oauthUrl;
                            return;
                        }
                        if (r.status === 401) {
                            showToast('Please log in first to connect ' + providerName, 'error');
                            btn.disabled = false;
                            btn.innerHTML = 'Connect';
                            return;
                        }
                        if (!r.ok) {
                            return r.text().then(text => {
                                let msg = providerName + ' OAuth is not configured';
                                try { msg = JSON.parse(text).message || msg; } catch (e) { }
                                showToast(msg, 'error');
                                btn.disabled = false;
                                btn.innerHTML = 'Connect';
                            });
                        }
                    })
                    .catch(() => {
                        window.location.href = oauthUrl;
                    });
            });
        });

        container.querySelectorAll('.btn-disconnect').forEach(btn => {
            btn.addEventListener('click', () => {
                const provider = btn.dataset.provider;
                if (!confirm(`Disconnect ${provider.charAt(0).toUpperCase() + provider.slice(1)}?`)) return;
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                fetch(apiUrl(`/api/auth/disconnect/${provider}`), { method: 'POST', credentials: 'include' })
                    .then(r => r.json())
                    .then(res => {
                        if (res.status === 'success') {
                            showToast(`${provider.charAt(0).toUpperCase() + provider.slice(1)} disconnected`, 'success');
                            loadConnectedAccounts();
                        } else {
                            showToast(res.message || 'Failed to disconnect', 'error');
                            btn.disabled = false;
                            btn.textContent = 'Disconnect';
                        }
                    })
                    .catch(() => {
                        showToast('Network error', 'error');
                        btn.disabled = false;
                        btn.textContent = 'Disconnect';
                    });
            });
        });
    }

    function initPasswordStrength() {
        const input = document.getElementById('newPassword');
        const fill = document.getElementById('strengthBarFill');
        const text = document.getElementById('strengthText');
        if (!input || !fill || !text) return;

        input.addEventListener('input', () => {
            const pw = input.value;
            let s = 0;
            if (pw.length >= 8) s += 25;
            if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 25;
            if (/[0-9]/.test(pw)) s += 25;
            if (/[^a-zA-Z0-9]/.test(pw)) s += 25;

            fill.style.width = s + '%';
            if (s === 0) {
                fill.style.background = 'transparent';
                text.textContent = 'Password Strength';
                text.style.color = '';
            } else if (s <= 25) {
                fill.style.background = '#ef4444';
                text.textContent = 'Weak';
                text.style.color = '#ef4444';
            } else if (s <= 50) {
                fill.style.background = 'linear-gradient(90deg, #ef4444, #f59e0b)';
                text.textContent = 'Fair';
                text.style.color = '#f59e0b';
            } else if (s <= 75) {
                fill.style.background = 'linear-gradient(90deg, #f59e0b, #10b981)';
                text.textContent = 'Good';
                text.style.color = '#10b981';
            } else {
                fill.style.background = 'linear-gradient(90deg, #10b981, #06b6d4)';
                text.textContent = 'Strong';
                text.style.color = '#06b6d4';
            }
        });
    }

    function initPasswordToggle() {
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = document.getElementById(btn.dataset.target);
                if (!target) return;
                const isPassword = target.type === 'password';
                target.type = isPassword ? 'text' : 'password';
                btn.innerHTML = `<i class="fas fa-eye${isPassword ? '-slash' : ''}"></i>`;
            });
        });
    }


    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
        toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
        container.appendChild(toast);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('show'));
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3500);
    }

    window.showToast = showToast;

    function initQuickActions() {
        var exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function () {
                exportBtn.disabled = true;
                showToast('Preparing your data export...', 'info');
                fetch(apiUrl('/api/profile/export'), { credentials: 'include' })
                    .then(function (r) { return r.json(); })
                    .then(function (data) {
                        exportBtn.disabled = false;
                        if (data.status === 'success') {
                            var blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
                            var url = URL.createObjectURL(blob);
                            var a = document.createElement('a');
                            a.href = url;
                            a.download = 'script-kittens-profile-export.json';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            showToast('Data exported successfully!', 'success');
                        } else {
                            showToast('Export failed — try again', 'error');
                        }
                    })
                    .catch(function () {
                        exportBtn.disabled = false;
                        showToast('Export failed — network error', 'error');
                    });
            });
        }
        var clearBtn = document.getElementById('clearCacheBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                var avatar = localStorage.getItem('userAvatar');
                var loggedIn = localStorage.getItem('userLoggedIn');
                localStorage.clear();
                if (avatar) localStorage.setItem('userAvatar', avatar);
                if (loggedIn) localStorage.setItem('userLoggedIn', loggedIn);
                showToast('Local cache cleared successfully', 'success');
            });
        }
        var twoFaBtn = document.getElementById('twoFactorBtn');
        if (twoFaBtn) {
            twoFaBtn.addEventListener('click', function () {
                showToast('Two-factor authentication setup coming soon!', 'info');
            });
        }
        var activityBtn = document.getElementById('activityLogBtn');
        if (activityBtn) {
            activityBtn.addEventListener('click', function () {
                var profileTab = document.querySelector('[data-tab="profile"]');
                if (profileTab) profileTab.click();
                setTimeout(function () {
                    var timeline = document.getElementById('activityTimeline');
                    if (timeline) timeline.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        }
        var logoutAllBtn = document.getElementById('logoutAllBtn');
        if (logoutAllBtn) {
            logoutAllBtn.addEventListener('click', function () {
                fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' })
                    .then(function () {
                        localStorage.clear();
                        showToast('Signed out from all devices', 'success');
                        setTimeout(function () { window.location.href = '/'; }, 1500);
                    })
                    .catch(function () {
                        showToast('Could not sign out — try again', 'error');
                    });
            });
        }
        var securityLogoutAllBtn = document.getElementById('securityLogoutAllBtn');
        if (securityLogoutAllBtn) {
            securityLogoutAllBtn.addEventListener('click', function () {
                fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' })
                    .then(function () {
                        localStorage.clear();
                        showToast('Signed out from all devices', 'success');
                        setTimeout(function () { window.location.href = '/'; }, 1500);
                    })
                    .catch(function () {
                        showToast('Could not sign out — try again', 'error');
                    });
            });
        }
    }

    function loadSecuritySessions() {
        var container = document.getElementById('securitySessionsList');
        if (!container) return;

        function parseBrowser(ua) {
            if (!ua) return { browser: 'Unknown Browser', os: 'Unknown OS', icon: 'fas fa-globe' };
            var browser = 'Unknown Browser';
            var os = 'Unknown OS';
            var icon = 'fas fa-globe';

            if (ua.indexOf('Firefox') > -1) { browser = 'Firefox'; icon = 'fab fa-firefox-browser'; }
            else if (ua.indexOf('Edg/') > -1) { browser = 'Microsoft Edge'; icon = 'fab fa-edge'; }
            else if (ua.indexOf('OPR') > -1 || ua.indexOf('Opera') > -1) { browser = 'Opera'; icon = 'fab fa-opera'; }
            else if (ua.indexOf('Chrome') > -1) { browser = 'Chrome'; icon = 'fab fa-chrome'; }
            else if (ua.indexOf('Safari') > -1) { browser = 'Safari'; icon = 'fab fa-safari'; }

            if (ua.indexOf('Windows') > -1) { os = 'Windows'; }
            else if (ua.indexOf('Mac OS') > -1) { os = 'macOS'; }
            else if (ua.indexOf('Linux') > -1) { os = 'Linux'; }
            else if (ua.indexOf('Android') > -1) { os = 'Android'; }
            else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) { os = 'iOS'; }

            return { browser: browser, os: os, icon: icon };
        }

        fetch(apiUrl('/api/auth/sessions'), { credentials: 'include' })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.status !== 'success') throw new Error('fail');
                var sessions = data.sessions || [];
                container.innerHTML = '';
                if (sessions.length === 0) {
                    container.innerHTML = '<div class="security-session-card"><div class="security-session-info"><span class="security-session-device">No active sessions</span></div></div>';
                    return;
                }
                sessions.forEach(function (s) {
                    var parsed = parseBrowser(s.device);
                    var card = document.createElement('div');
                    card.className = 'security-session-card' + (s.is_current ? ' current-session' : '');
                    card.innerHTML =
                        '<div class="security-session-icon"><i class="' + parsed.icon + '"></i></div>' +
                        '<div class="security-session-info">' +
                        '<span class="security-session-device">' + parsed.os + ' — ' + parsed.browser + '</span>' +
                        '<span class="security-session-meta">' +
                        (s.is_current ? '<span class="active-dot"></span> Active now' : formatTime(s.last_active)) +
                        '</span>' +
                        (s.ip ? '<span class="security-session-ip">IP: ' + s.ip + '</span>' : '') +
                        '</div>' +
                        (s.is_current ? '<span class="security-session-badge current">Current</span>' : '');
                    container.appendChild(card);
                });
            })
            .catch(function () {
                var parsed = parseBrowser(navigator.userAgent);
                container.innerHTML =
                    '<div class="security-session-card current-session">' +
                    '<div class="security-session-icon"><i class="' + parsed.icon + '"></i></div>' +
                    '<div class="security-session-info">' +
                    '<span class="security-session-device">' + parsed.os + ' — ' + parsed.browser + '</span>' +
                    '<span class="security-session-meta"><span class="active-dot"></span> Active now</span>' +
                    '</div>' +
                    '<span class="security-session-badge current">Current</span>' +
                    '</div>';
            });
    }

    function updateRankTier(level) {
        var tiers = [
            { name: 'Bronze', min: 0, icon: 'fas fa-shield-alt', gradient: 'linear-gradient(135deg, #cd7f32, #b87333)', shadow: 'rgba(205,127,50,0.3)', next: 'Silver', subtitle: 'Keep grinding to reach Silver!' },
            { name: 'Silver', min: 10, icon: 'fas fa-shield-alt', gradient: 'linear-gradient(135deg, #c0c0c0, #a8a8a8)', shadow: 'rgba(192,192,192,0.3)', next: 'Gold', subtitle: 'Almost Gold tier!' },
            { name: 'Gold', min: 25, icon: 'fas fa-crown', gradient: 'linear-gradient(135deg, #ffd700, #f4d03f)', shadow: 'rgba(255,215,0,0.3)', next: 'Diamond', subtitle: 'Shining bright!' },
            { name: 'Diamond', min: 50, icon: 'fas fa-gem', gradient: 'linear-gradient(135deg, #b9f2ff, #7dd3fc)', shadow: 'rgba(185,242,255,0.3)', next: 'Master', subtitle: 'Elite status unlocked!' },
            { name: 'Master', min: 75, icon: 'fas fa-star', gradient: 'linear-gradient(135deg, #ff00a8, #8f00ff)', shadow: 'rgba(255,0,168,0.3)', next: 'Legend', subtitle: 'Among the best!' },
            { name: 'Legend', min: 100, icon: 'fas fa-dragon', gradient: 'linear-gradient(135deg, #8f00ff, #00f0ff)', shadow: 'rgba(143,0,255,0.4)', next: null, subtitle: 'Maximum rank achieved!' }
        ];

        var current = tiers[0];
        var nextTier = tiers[1];
        for (var i = tiers.length - 1; i >= 0; i--) {
            if (level >= tiers[i].min) {
                current = tiers[i];
                nextTier = tiers[i + 1] || null;
                break;
            }
        }

        var nameEl = document.getElementById('rankTierName');
        var subtitleEl = document.getElementById('rankTierSubtitle');
        var emblemIcon = document.querySelector('.rank-emblem-icon');
        var progressFill = document.getElementById('rankProgressFill');
        var currentLabel = document.getElementById('rankCurrentLabel');
        var nextLabel = document.getElementById('rankNextLabel');

        if (nameEl) {
            nameEl.textContent = current.name;
            nameEl.style.background = current.gradient;
            nameEl.style.webkitBackgroundClip = 'text';
            nameEl.style.webkitTextFillColor = 'transparent';
            nameEl.style.backgroundClip = 'text';
        }
        if (subtitleEl) subtitleEl.textContent = current.subtitle;
        if (emblemIcon) {
            emblemIcon.innerHTML = '<i class="' + current.icon + '"></i>';
            emblemIcon.style.background = current.gradient;
            emblemIcon.style.boxShadow = '0 4px 20px ' + current.shadow;
        }
        if (currentLabel) currentLabel.textContent = current.name;
        if (nextLabel) nextLabel.textContent = nextTier ? nextTier.name : 'MAX';

        if (progressFill && nextTier) {
            var range = nextTier.min - current.min;
            var progress = ((level - current.min) / range) * 100;
            setTimeout(function () { progressFill.style.width = Math.min(progress, 100) + '%'; }, 500);
            progressFill.style.background = current.gradient;
        } else if (progressFill) {
            setTimeout(function () { progressFill.style.width = '100%'; }, 500);
            progressFill.style.background = current.gradient;
        }

        document.querySelectorAll('.rank-tier-pip').forEach(function (pip) {
            pip.classList.remove('active');
            var tier = pip.dataset.tier;
            var tierObj = tiers.find(function (t) { return t.name.toLowerCase() === tier; });
            if (tierObj && level >= tierObj.min) {
                pip.classList.add('active');
            }
        });
    }

    function initNewSectionAnimations() {
        if (typeof gsap === 'undefined') return;
        var hasScrollTrigger = typeof ScrollTrigger !== 'undefined';

        if (hasScrollTrigger) {
            gsap.registerPlugin(ScrollTrigger);

            gsap.fromTo('.rank-tier-section', { y: 30, opacity: 0 }, {
                scrollTrigger: { trigger: '.rank-tier-section', start: 'top 90%', once: true },
                y: 0, opacity: 1, duration: 0.7, ease: 'power3.out'
            });

            gsap.fromTo('.rank-emblem', { scale: 0, rotation: -180 }, {
                scrollTrigger: { trigger: '.rank-tier-section', start: 'top 85%', once: true },
                scale: 1, rotation: 0, duration: 1, delay: 0.2, ease: 'back.out(1.7)'
            });

            gsap.fromTo('.achievements-section', { y: 30, opacity: 0 }, {
                scrollTrigger: { trigger: '.achievements-section', start: 'top 90%', once: true },
                y: 0, opacity: 1, duration: 0.7, ease: 'power3.out'
            });

            gsap.fromTo('.achievement-card', { y: 20, opacity: 0, scale: 0.95 }, {
                scrollTrigger: { trigger: '.achievements-grid', start: 'top 90%', once: true },
                y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(1.4)'
            });

            gsap.fromTo('.activity-section', { y: 30, opacity: 0 }, {
                scrollTrigger: { trigger: '.activity-section', start: 'top 90%', once: true },
                y: 0, opacity: 1, duration: 0.7, ease: 'power3.out'
            });
        } else {
            document.querySelectorAll('.rank-tier-section, .achievements-section, .activity-section').forEach(function (el) {
                el.style.opacity = '1';
            });
            document.querySelectorAll('.achievement-card').forEach(function (el) {
                el.style.opacity = '1';
            });
        }

        document.querySelectorAll('.achievement-card.unlocked').forEach(function (card) {
            card.addEventListener('mouseenter', function () {
                if (typeof gsap === 'undefined') return;
                gsap.to(card, { scale: 1.03, duration: 0.3, ease: 'power2.out' });
                var icon = card.querySelector('.achievement-icon');
                if (icon) gsap.to(icon, { rotation: 10, scale: 1.15, duration: 0.3, ease: 'back.out(2)' });
            });
            card.addEventListener('mouseleave', function () {
                if (typeof gsap === 'undefined') return;
                gsap.to(card, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
                var icon = card.querySelector('.achievement-icon');
                if (icon) gsap.to(icon, { rotation: 0, scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
            });
        });
    }

    function initSmoothScroll() {
        document.documentElement.style.scrollBehavior = 'smooth';
        var cards = document.querySelectorAll('#account-tab .acct-card');
        if (!cards.length) return;
        if (!('IntersectionObserver' in window)) {
            cards.forEach(function (card) { card.classList.add('acct-card-visible'); });
            return;
        }
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('acct-card-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
        cards.forEach(function (card) { observer.observe(card); });
        document.querySelectorAll('[data-tab]').forEach(function (tab) {
            tab.addEventListener('click', function () {
                if (tab.dataset.tab === 'account') {
                    setTimeout(function () {
                        cards.forEach(function (card) {
                            if (!card.classList.contains('acct-card-visible')) {
                                observer.unobserve(card);
                                observer.observe(card);
                            }
                        });
                    }, 100);
                }
            });
        });
    }

    // ---- FULLSCREEN TOGGLE ----
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const fullscreenIcon = document.getElementById('fullscreenIcon');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => { });
                if (fullscreenIcon) fullscreenIcon.className = 'fas fa-compress';
            } else {
                document.exitFullscreen();
                if (fullscreenIcon) fullscreenIcon.className = 'fas fa-expand';
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
            }
        });
    }

});
