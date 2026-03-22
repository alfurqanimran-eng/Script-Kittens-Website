/*
 * Script Kittens - API Configuration
 *
 * Subdomain architecture:
 *   - script-kittens.com          → Main site
 *   - login.script-kittens.com    → Login page
 *   - cheats.script-kittens.com   → Free cheats page
 *   - profile.script-kittens.com  → User profile/dashboard
 *   - api.script-kittens.com      → Node.js backend API
 */
const API_BASE_URL = 'https://api.script-kittens.com';

// Helper function to build API URLs
function apiUrl(path) {
    // path comes in as /auth/login or /api/auth/login — normalize
    var cleanPath = path.replace(/^\/api/, '');
    return API_BASE_URL + cleanPath;
}

/* ─── Auth Helpers (used across all pages) ─── */
function getAuthToken() {
    return localStorage.getItem('sk_token');
}

function getAuthUser() {
    try {
        return JSON.parse(localStorage.getItem('sk_user'));
    } catch (e) {
        return null;
    }
}

function isLoggedIn() {
    return !!getAuthToken();
}

function logout() {
    var token = getAuthToken();

    // Clear ALL local storage auth data immediately
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

    // Call backend to clear HTTP-only cookie + invalidate session
    fetch(API_BASE_URL + '/auth/logout', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + (token || ''),
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    })
    .catch(function() {})
    .finally(function() {
        // Use hash fragment — works across subdomains, not stripped by servers
        window.location.href = 'https://login.script-kittens.com?logged_out=1#logged_out';
    });
}
