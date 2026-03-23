/* ============================================
 * Admin Routes — /admin/*
 * Full admin panel backend:
 *   - Dashboard stats
 *   - User management (list, role change, ban, add admin)
 *   - Vault/post management (list, delete, moderate)
 *   - Reports management
 *   - Session management
 *   - Pricing management (future)
 * ============================================ */
const express = require('express');
const pool = require('../db/connection');
const { authRequired, adminRequired } = require('../middleware/auth');

const router = express.Router();

// All admin routes require auth + admin role
router.use(authRequired, adminRequired);

/* ═══════════════════════════════════════════════ */
/*  GET /admin/stats — Dashboard overview          */
/* ═══════════════════════════════════════════════ */
router.get('/stats', async (req, res) => {
    try {
        // Run all queries in parallel
        const [
            [userCount],
            [vaultCount],
            [downloadCount],
            [pendingCount],
            [reportCount],
            [recentUsers],
            [topItems],
            [roleCounts],
            [providerCounts],
            [dailySignups],
            [dailyUploads],
        ] = await Promise.all([
            pool.execute('SELECT COUNT(*) AS total FROM users'),
            pool.execute("SELECT COUNT(*) AS total FROM vault_items WHERE status = 'approved'"),
            pool.execute('SELECT COALESCE(SUM(download_count), 0) AS total FROM vault_items'),
            pool.execute("SELECT COUNT(*) AS total FROM vault_items WHERE status = 'pending'"),
            pool.execute("SELECT COUNT(*) AS total FROM vault_reports WHERE status = 'pending'"),
            pool.execute(`SELECT uuid, username, email, avatar_url, role, provider, created_at, last_login
                          FROM users ORDER BY created_at DESC LIMIT 10`),
            pool.execute(`SELECT uuid, title, type, download_count, vote_score, view_count, created_at
                          FROM vault_items WHERE status = 'approved'
                          ORDER BY download_count DESC LIMIT 10`),
            pool.execute(`SELECT role, COUNT(*) AS count FROM users GROUP BY role`),
            pool.execute(`SELECT provider, COUNT(*) AS count FROM users GROUP BY provider`),
            pool.execute(`SELECT DATE(created_at) AS day, COUNT(*) AS count
                          FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                          GROUP BY DATE(created_at) ORDER BY day`),
            pool.execute(`SELECT DATE(created_at) AS day, COUNT(*) AS count
                          FROM vault_items WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                          GROUP BY DATE(created_at) ORDER BY day`),
        ]);

        // Active sessions (not expired)
        const [[sessionCount]] = await pool.execute(
            'SELECT COUNT(*) AS total FROM sessions WHERE expires_at > NOW()'
        );

        res.json({
            status: 'success',
            stats: {
                totalUsers: userCount[0].total,
                totalUploads: vaultCount[0].total,
                totalDownloads: downloadCount[0].total,
                pendingReview: pendingCount[0].total,
                pendingReports: reportCount[0].total,
                activeSessions: sessionCount.total,
            },
            recentUsers,
            topItems,
            roleCounts: roleCounts.reduce((o, r) => ({ ...o, [r.role]: r.count }), {}),
            providerCounts: providerCounts.reduce((o, r) => ({ ...o, [r.provider]: r.count }), {}),
            charts: {
                dailySignups,
                dailyUploads,
            },
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ error: 'Failed to load stats' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  GET /admin/users — List all users              */
/* ═══════════════════════════════════════════════ */
router.get('/users', async (req, res) => {
    try {
        const page    = Math.max(1, parseInt(req.query.page) || 1);
        const perPage = 25;
        const offset  = (page - 1) * perPage;
        const search  = req.query.search || null;
        const role    = req.query.role || null;
        const sort    = req.query.sort || 'newest';

        const conditions = ['1=1'];
        const params = [];

        if (search) {
            conditions.push('(u.username LIKE ? OR u.email LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }
        if (role) {
            conditions.push('u.role = ?');
            params.push(role);
        }

        const ORDER = {
            newest: 'u.created_at DESC',
            oldest: 'u.created_at ASC',
            username: 'u.username ASC',
            last_login: 'u.last_login DESC',
        }[sort] || 'u.created_at DESC';

        const WHERE = conditions.join(' AND ');

        const [users] = await pool.execute(`
            SELECT u.id, u.uuid, u.email, u.username, u.avatar_url, u.role,
                   u.provider, u.is_verified, u.last_login, u.created_at,
                   (SELECT COUNT(*) FROM vault_items WHERE user_id = u.id) AS upload_count,
                   (SELECT COUNT(*) FROM sessions WHERE user_id = u.id AND expires_at > NOW()) AS active_sessions
            FROM users u
            WHERE ${WHERE}
            ORDER BY ${ORDER}
            LIMIT ${perPage} OFFSET ${offset}
        `, params);

        const [countRows] = await pool.execute(
            `SELECT COUNT(*) AS total FROM users u WHERE ${WHERE}`, params
        );

        res.json({
            status: 'success',
            users,
            pagination: {
                page,
                perPage,
                total: countRows[0].total,
                totalPages: Math.ceil(countRows[0].total / perPage),
            },
        });
    } catch (err) {
        console.error('Admin users error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  PUT /admin/users/:uuid/role — Change user role */
/* ═══════════════════════════════════════════════ */
router.put('/users/:uuid/role', async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'premium', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be: user, premium, or admin' });
        }

        // Can't change your own role (safety)
        const [target] = await pool.execute('SELECT id, uuid, username, email FROM users WHERE uuid = ?', [req.params.uuid]);
        if (!target.length) return res.status(404).json({ error: 'User not found' });

        if (target[0].id === req.user.id) {
            return res.status(400).json({ error: "You can't change your own role" });
        }

        await pool.execute('UPDATE users SET role = ? WHERE uuid = ?', [role, req.params.uuid]);

        res.json({
            status: 'success',
            message: `${target[0].username}'s role changed to ${role}`,
            user: { uuid: target[0].uuid, username: target[0].username, role },
        });
    } catch (err) {
        console.error('Admin role change error:', err);
        res.status(500).json({ error: 'Failed to update role' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  DELETE /admin/users/:uuid — Delete user        */
/* ═══════════════════════════════════════════════ */
router.delete('/users/:uuid', async (req, res) => {
    try {
        const [target] = await pool.execute('SELECT id, username FROM users WHERE uuid = ?', [req.params.uuid]);
        if (!target.length) return res.status(404).json({ error: 'User not found' });

        if (target[0].id === req.user.id) {
            return res.status(400).json({ error: "You can't delete yourself" });
        }

        // CASCADE will clean up sessions, vault items, votes, reports, downloads
        await pool.execute('DELETE FROM users WHERE uuid = ?', [req.params.uuid]);

        res.json({ status: 'success', message: `User ${target[0].username} deleted` });
    } catch (err) {
        console.error('Admin delete user error:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  POST /admin/users/:uuid/revoke-sessions        */
/*  Force-logout a user by clearing their sessions */
/* ═══════════════════════════════════════════════ */
router.post('/users/:uuid/revoke-sessions', async (req, res) => {
    try {
        const [target] = await pool.execute('SELECT id, username FROM users WHERE uuid = ?', [req.params.uuid]);
        if (!target.length) return res.status(404).json({ error: 'User not found' });

        const [result] = await pool.execute('DELETE FROM sessions WHERE user_id = ?', [target[0].id]);

        res.json({
            status: 'success',
            message: `${result.affectedRows} session(s) revoked for ${target[0].username}`,
        });
    } catch (err) {
        console.error('Admin revoke sessions error:', err);
        res.status(500).json({ error: 'Failed to revoke sessions' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  GET /admin/vault — List all vault items        */
/* ═══════════════════════════════════════════════ */
router.get('/vault', async (req, res) => {
    try {
        const page    = Math.max(1, parseInt(req.query.page) || 1);
        const perPage = 25;
        const offset  = (page - 1) * perPage;
        const search  = req.query.search || null;
        const status  = req.query.status || null;
        const sort    = req.query.sort || 'newest';

        const conditions = ['1=1'];
        const params = [];

        if (search) {
            conditions.push('(vi.title LIKE ? OR vi.description LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }
        if (status) {
            conditions.push('vi.status = ?');
            params.push(status);
        }

        const ORDER = {
            newest: 'vi.created_at DESC',
            oldest: 'vi.created_at ASC',
            popular: 'vi.download_count DESC',
            votes: 'vi.vote_score DESC',
            views: 'vi.view_count DESC',
        }[sort] || 'vi.created_at DESC';

        const WHERE = conditions.join(' AND ');

        const [items] = await pool.execute(`
            SELECT vi.id, vi.uuid, vi.title, vi.slug, vi.type, vi.game, vi.language,
                   vi.status, vi.is_premium, vi.download_count, vi.vote_score, vi.view_count,
                   vi.thumbnail_url, vi.created_at,
                   u.username, u.uuid AS author_uuid, u.email AS author_email
            FROM vault_items vi
            JOIN users u ON u.id = vi.user_id
            WHERE ${WHERE}
            ORDER BY ${ORDER}
            LIMIT ${perPage} OFFSET ${offset}
        `, params);

        const [countRows] = await pool.execute(`
            SELECT COUNT(*) AS total FROM vault_items vi
            JOIN users u ON u.id = vi.user_id
            WHERE ${WHERE}
        `, params);

        res.json({
            status: 'success',
            items,
            pagination: {
                page,
                perPage,
                total: countRows[0].total,
                totalPages: Math.ceil(countRows[0].total / perPage),
            },
        });
    } catch (err) {
        console.error('Admin vault list error:', err);
        res.status(500).json({ error: 'Failed to fetch vault items' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  DELETE /admin/vault/:uuid — Force delete item  */
/* ═══════════════════════════════════════════════ */
router.delete('/vault/:uuid', async (req, res) => {
    try {
        const fs = require('fs');
        const [rows] = await pool.execute(
            'SELECT vi.id, vi.title FROM vault_items vi WHERE vi.uuid = ?', [req.params.uuid]
        );
        if (!rows.length) return res.status(404).json({ error: 'Item not found' });

        // Delete physical files
        const [files] = await pool.execute('SELECT file_path FROM vault_files WHERE item_id = ?', [rows[0].id]);
        files.forEach(f => fs.unlink(f.file_path, () => {}));

        await pool.execute('DELETE FROM vault_items WHERE id = ?', [rows[0].id]);

        res.json({ status: 'success', message: `"${rows[0].title}" deleted` });
    } catch (err) {
        console.error('Admin vault delete error:', err);
        res.status(500).json({ error: 'Delete failed' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  PUT /admin/vault/:uuid/status — Change status  */
/* ═══════════════════════════════════════════════ */
router.put('/vault/:uuid/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const [rows] = await pool.execute('SELECT id, title FROM vault_items WHERE uuid = ?', [req.params.uuid]);
        if (!rows.length) return res.status(404).json({ error: 'Item not found' });

        await pool.execute('UPDATE vault_items SET status = ? WHERE id = ?', [status, rows[0].id]);

        // If rejected, delete files to save space
        if (status === 'rejected') {
            const fs = require('fs');
            const [files] = await pool.execute('SELECT file_path FROM vault_files WHERE item_id = ?', [rows[0].id]);
            files.forEach(f => fs.unlink(f.file_path, () => {}));
        }

        res.json({ status: 'success', message: `"${rows[0].title}" set to ${status}` });
    } catch (err) {
        console.error('Admin vault status error:', err);
        res.status(500).json({ error: 'Status update failed' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  GET /admin/reports — List all reports          */
/* ═══════════════════════════════════════════════ */
router.get('/reports', async (req, res) => {
    try {
        const status = req.query.status || 'pending';

        const [reports] = await pool.execute(`
            SELECT vr.id, vr.reason, vr.details, vr.status AS report_status, vr.created_at,
                   u.username AS reporter, u.uuid AS reporter_uuid,
                   vi.uuid AS item_uuid, vi.title AS item_title, vi.slug AS item_slug,
                   author.username AS item_author
            FROM vault_reports vr
            JOIN users u ON u.id = vr.user_id
            JOIN vault_items vi ON vi.id = vr.item_id
            JOIN users author ON author.id = vi.user_id
            WHERE vr.status = ?
            ORDER BY vr.created_at DESC
            LIMIT 50
        `, [status]);

        res.json({ status: 'success', reports });
    } catch (err) {
        console.error('Admin reports error:', err);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  PUT /admin/reports/:id — Resolve a report      */
/* ═══════════════════════════════════════════════ */
router.put('/reports/:id', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['resolved', 'dismissed'].includes(status)) {
            return res.status(400).json({ error: 'Status must be resolved or dismissed' });
        }

        await pool.execute('UPDATE vault_reports SET status = ? WHERE id = ?', [status, req.params.id]);

        res.json({ status: 'success', message: `Report ${status}` });
    } catch (err) {
        console.error('Admin report resolve error:', err);
        res.status(500).json({ error: 'Failed to update report' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  GET /admin/sessions — Active sessions list     */
/* ═══════════════════════════════════════════════ */
router.get('/sessions', async (req, res) => {
    try {
        const [sessions] = await pool.execute(`
            SELECT s.id, s.ip_address, s.user_agent, s.created_at, s.expires_at,
                   u.uuid AS user_uuid, u.username, u.email, u.avatar_url, u.role
            FROM sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.expires_at > NOW()
            ORDER BY s.created_at DESC
            LIMIT 100
        `);

        res.json({ status: 'success', sessions });
    } catch (err) {
        console.error('Admin sessions error:', err);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  DELETE /admin/sessions/:id — Kill a session    */
/* ═══════════════════════════════════════════════ */
router.delete('/sessions/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM sessions WHERE id = ?', [req.params.id]);
        res.json({ status: 'success', message: 'Session terminated' });
    } catch (err) {
        console.error('Admin session delete error:', err);
        res.status(500).json({ error: 'Failed to terminate session' });
    }
});

module.exports = router;
