/* ============================================
 * Vault Routes — /vault/*
 * Handles: browse, upload, download, vote, report, moderate
 * ============================================ */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/connection');
const { authRequired, authOptional, adminRequired } = require('../middleware/auth');

const router = express.Router();

/* ─── Upload directory setup ─── */
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'vault');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* ─── Allowed extensions ─── */
const ALLOWED = {
    source:     ['.py', '.lua', '.js', '.ts', '.cs', '.cpp', '.c', '.h', '.java', '.rb', '.go', '.php'],
    archive:    ['.zip', '.rar', '.7z'],
    executable: ['.exe', '.dll'],
    image:      ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
};
const ALL_ALLOWED = Object.values(ALLOWED).flat();

const MAX_SIZES = {
    source:     5  * 1024 * 1024,   // 5MB
    archive:    50 * 1024 * 1024,   // 50MB
    executable: 100 * 1024 * 1024,  // 100MB
    image:      5  * 1024 * 1024,   // 5MB
};

function getFileType(ext) {
    for (const [type, exts] of Object.entries(ALLOWED)) {
        if (exts.includes(ext)) return type;
    }
    return null;
}

/* ─── Multer config ─── */
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uuidv4()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB hard cap
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!ALL_ALLOWED.includes(ext)) {
            return cb(new Error(`File type ${ext} not allowed`));
        }
        cb(null, true);
    },
});

/* ─── Helper: build slug ─── */
function slugify(title) {
    return title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 200);
}

/* ─── Helper: get real IP ─── */
function getIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.headers['x-real-ip']
        || req.socket?.remoteAddress
        || 'Unknown';
}

/* ─── Helper: sanitize text (strip HTML tags) ─── */
function sanitize(str) {
    if (!str) return null;
    return String(str).replace(/<[^>]*>/g, '').trim().slice(0, 5000);
}

/* ═══════════════════════════════════════════════ */
/*  GET /vault — List/search/filter items          */
/* ═══════════════════════════════════════════════ */
router.get('/', authOptional, async (req, res) => {
    try {
        const page    = Math.max(1, parseInt(req.query.page) || 1);
        const perPage = 20;
        const offset  = (page - 1) * perPage;

        const type    = req.query.type    || null;
        const game    = req.query.game    || null;
        const lang    = req.query.lang    || null;
        const premium = req.query.premium != null ? parseInt(req.query.premium) : null;
        const search  = req.query.search  || null;
        const sort    = req.query.sort    || 'newest';
        const userId  = req.query.user    || null;

        // Build WHERE clauses
        const conditions = ['vi.status = "approved"'];
        const params = [];

        if (type)    { conditions.push('vi.type = ?');       params.push(type); }
        if (game)    { conditions.push('vi.game = ?');       params.push(game); }
        if (lang)    { conditions.push('vi.language = ?');   params.push(lang); }
        if (premium != null) { conditions.push('vi.is_premium = ?'); params.push(premium); }
        if (userId)  { conditions.push('u.uuid = ?');        params.push(userId); }
        if (search)  {
            conditions.push('MATCH(vi.title, vi.description) AGAINST(? IN BOOLEAN MODE)');
            params.push(`${search}*`);
        }

        const WHERE = conditions.join(' AND ');

        // Sort
        const ORDER = {
            newest:    'vi.created_at DESC',
            oldest:    'vi.created_at ASC',
            popular:   'vi.download_count DESC',
            votes:     'vi.vote_score DESC',
            downloads: 'vi.download_count DESC',
        }[sort] || 'vi.created_at DESC';

        // Get items
        const [items] = await pool.execute(`
            SELECT
                vi.id, vi.uuid, vi.title, vi.slug, vi.description,
                vi.type, vi.game, vi.language, vi.tags,
                vi.thumbnail_url, vi.is_premium, vi.download_count,
                vi.vote_score, vi.view_count, vi.created_at,
                u.username, u.uuid AS author_uuid, u.avatar_url AS author_avatar,
                (SELECT stored_name FROM vault_files WHERE item_id = vi.id AND file_type != 'image' LIMIT 1) AS has_file,
                (vi.code_content IS NOT NULL AND vi.code_content != '') AS has_code
            FROM vault_items vi
            JOIN users u ON u.id = vi.user_id
            WHERE ${WHERE}
            ORDER BY ${ORDER}
            LIMIT ${perPage} OFFSET ${offset}
        `, params);

        // Get total count
        const [countRows] = await pool.execute(`
            SELECT COUNT(*) AS total
            FROM vault_items vi
            JOIN users u ON u.id = vi.user_id
            WHERE ${WHERE}
        `, params);

        // Get tab counts (ignoring type filter)
        const countParams = params.filter((_, i) => conditions[i + 1] !== `vi.type = ?`);
        const [tabCounts] = await pool.execute(`
            SELECT
                COUNT(*) AS all_count,
                SUM(type = 'code') AS code_count,
                SUM(type = 'script') AS script_count,
                SUM(type = 'project') AS project_count,
                SUM(type = 'tool') AS tool_count
            FROM vault_items vi
            JOIN users u ON u.id = vi.user_id
            WHERE vi.status = "approved"
            ${game    ? 'AND vi.game = ?' : ''}
            ${lang    ? 'AND vi.language = ?' : ''}
            ${premium != null ? 'AND vi.is_premium = ?' : ''}
        `, [
            ...(game    ? [game]    : []),
            ...(lang    ? [lang]    : []),
            ...(premium != null ? [premium] : []),
        ]);

        const total = countRows[0].total;

        res.json({
            status: 'success',
            items: items.map(i => ({
                ...i,
                tags: i.tags ? JSON.parse(i.tags) : [],
            })),
            pagination: {
                page,
                perPage,
                total,
                totalPages: Math.ceil(total / perPage),
            },
            counts: {
                all:     tabCounts[0].all_count     || 0,
                code:    tabCounts[0].code_count    || 0,
                script:  tabCounts[0].script_count  || 0,
                project: tabCounts[0].project_count || 0,
                tool:    tabCounts[0].tool_count    || 0,
            },
        });
    } catch (err) {
        console.error('Vault list error:', err);
        res.status(500).json({ error: 'Failed to fetch vault items' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  GET /vault/my-uploads — Current user's items   */
/* ═══════════════════════════════════════════════ */
router.get('/my-uploads', authRequired, async (req, res) => {
    try {
        const [items] = await pool.execute(`
            SELECT vi.*, vf.filename, vf.file_size, vf.file_type
            FROM vault_items vi
            LEFT JOIN vault_files vf ON vf.item_id = vi.id AND vf.file_type != 'image'
            WHERE vi.user_id = ?
            ORDER BY vi.created_at DESC
        `, [req.user.id]);

        res.json({
            status: 'success',
            items: items.map(i => ({ ...i, tags: i.tags ? JSON.parse(i.tags) : [] })),
        });
    } catch (err) {
        console.error('My uploads error:', err);
        res.status(500).json({ error: 'Failed to fetch uploads' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  GET /vault/pending — Admin: pending items      */
/* ═══════════════════════════════════════════════ */
router.get('/pending', authRequired, adminRequired, async (req, res) => {
    try {
        const [items] = await pool.execute(`
            SELECT vi.*, u.username, u.email,
                   vf.filename, vf.file_size, vf.file_type, vf.stored_name
            FROM vault_items vi
            JOIN users u ON u.id = vi.user_id
            LEFT JOIN vault_files vf ON vf.item_id = vi.id AND vf.file_type = 'executable'
            WHERE vi.status = 'pending'
            ORDER BY vi.created_at ASC
        `, []);

        res.json({ status: 'success', items });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch pending items' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  GET /vault/:slug — Single item detail          */
/* ═══════════════════════════════════════════════ */
router.get('/:slug', authOptional, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT
                vi.*,
                u.username, u.uuid AS author_uuid, u.avatar_url AS author_avatar
            FROM vault_items vi
            JOIN users u ON u.id = vi.user_id
            WHERE vi.slug = ? AND vi.status = 'approved'
            LIMIT 1
        `, [req.params.slug]);

        if (!rows.length) return res.status(404).json({ error: 'Item not found' });

        const item = rows[0];

        // Get files (excluding image)
        const [files] = await pool.execute(
            'SELECT id, filename, file_size, file_type FROM vault_files WHERE item_id = ? AND file_type != "image"',
            [item.id]
        );

        // Increment view count (fire and forget)
        pool.execute('UPDATE vault_items SET view_count = view_count + 1 WHERE id = ?', [item.id])
            .catch(() => {});

        // Get user's vote if logged in
        let userVote = null;
        if (req.user) {
            const [voteRows] = await pool.execute(
                'SELECT vote FROM vault_votes WHERE item_id = ? AND user_id = ?',
                [item.id, req.user.id]
            );
            if (voteRows.length) userVote = voteRows[0].vote;
        }

        res.json({
            status: 'success',
            item: {
                ...item,
                tags: item.tags ? JSON.parse(item.tags) : [],
                files,
                userVote,
            },
        });
    } catch (err) {
        console.error('Vault detail error:', err);
        res.status(500).json({ error: 'Failed to fetch item' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  POST /vault — Create new vault item            */
/* ═══════════════════════════════════════════════ */
router.post('/', authRequired, upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
]), async (req, res) => {
    const uploadedFiles = [];

    try {
        const { title, description, type, game, language, tags, code_content } = req.body;

        // Validation
        if (!title || !type) return res.status(400).json({ error: 'Title and type are required' });
        if (!['code', 'script', 'project', 'tool'].includes(type)) {
            return res.status(400).json({ error: 'Invalid type' });
        }
        if (type === 'code' && !code_content?.trim()) {
            return res.status(400).json({ error: 'Code content required for code type' });
        }
        if (type !== 'code' && !req.files?.file) {
            return res.status(400).json({ error: 'File upload required for this type' });
        }

        // Generate unique slug
        let slug = slugify(title);
        const [existing] = await pool.execute('SELECT id FROM vault_items WHERE slug = ?', [slug]);
        if (existing.length) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

        // Determine status — executables need admin approval
        let status = 'approved';
        if (req.files?.file) {
            const ext = path.extname(req.files.file[0].originalname).toLowerCase();
            if (ALLOWED.executable.includes(ext)) status = 'pending';
        }

        const itemUuid = uuidv4();

        // Parse tags
        let parsedTags = null;
        if (tags) {
            try {
                const tagArr = Array.isArray(tags) ? tags : JSON.parse(tags);
                parsedTags = JSON.stringify(tagArr.slice(0, 10).map(t => String(t).slice(0, 30)));
            } catch { parsedTags = null; }
        }

        // Insert item
        const [result] = await pool.execute(`
            INSERT INTO vault_items
                (uuid, user_id, title, slug, description, type, game, language, tags, code_content, is_premium, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        `, [
            itemUuid,
            req.user.id,
            sanitize(title).slice(0, 200),
            slug,
            sanitize(description),
            type,
            game || 'other',
            language || 'other',
            parsedTags,
            type === 'code' ? code_content?.slice(0, 100000) : null,
            status,
        ]);

        const itemId = result.insertId;

        // Save main file
        if (req.files?.file) {
            const f = req.files.file[0];
            const ext = path.extname(f.originalname).toLowerCase();
            const fileType = getFileType(ext);
            uploadedFiles.push(f.path);

            await pool.execute(`
                INSERT INTO vault_files (item_id, filename, stored_name, file_path, file_size, mime_type, file_type)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [itemId, f.originalname, f.filename, f.path, f.size, f.mimetype, fileType]);
        }

        // Save thumbnail
        if (req.files?.thumbnail) {
            const t = req.files.thumbnail[0];
            uploadedFiles.push(t.path);
            const publicPath = `/uploads/vault/${t.filename}`;

            await pool.execute(`
                INSERT INTO vault_files (item_id, filename, stored_name, file_path, file_size, mime_type, file_type)
                VALUES (?, ?, ?, ?, ?, ?, 'image')
            `, [itemId, t.originalname, t.filename, t.path, t.size, t.mimetype]);

            await pool.execute('UPDATE vault_items SET thumbnail_url = ? WHERE id = ?', [publicPath, itemId]);
        }

        res.status(201).json({
            status: 'success',
            message: status === 'pending'
                ? 'Upload submitted — pending admin approval (executables require review)'
                : 'Upload successful!',
            item: { uuid: itemUuid, slug, status },
        });

    } catch (err) {
        // Clean up any files that were saved
        uploadedFiles.forEach(f => fs.unlink(f, () => {}));
        console.error('Vault upload error:', err);
        res.status(500).json({ error: err.message || 'Upload failed' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  DELETE /vault/:id — Delete item                */
/* ═══════════════════════════════════════════════ */
router.delete('/:id', authRequired, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT vi.*, u.id AS owner_id FROM vault_items vi JOIN users u ON u.id = vi.user_id WHERE vi.uuid = ? LIMIT 1',
            [req.params.id]
        );

        if (!rows.length) return res.status(404).json({ error: 'Item not found' });
        const item = rows[0];

        // Only owner or admin can delete
        if (item.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Delete physical files
        const [files] = await pool.execute('SELECT file_path FROM vault_files WHERE item_id = ?', [item.id]);
        files.forEach(f => fs.unlink(f.file_path, () => {}));

        // DB cascade deletes files, downloads, votes, reports
        await pool.execute('DELETE FROM vault_items WHERE id = ?', [item.id]);

        res.json({ status: 'success', message: 'Item deleted' });
    } catch (err) {
        console.error('Vault delete error:', err);
        res.status(500).json({ error: 'Delete failed' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  GET /vault/:id/download — Download file        */
/* ═══════════════════════════════════════════════ */
router.get('/:id/download', authRequired, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM vault_items WHERE uuid = ? AND status = "approved" LIMIT 1',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Item not found' });
        const item = rows[0];

        // Premium check
        if (item.is_premium && req.user.role === 'user') {
            return res.status(403).json({ error: 'Premium content — upgrade your account' });
        }

        // Helper: build branded filename "Script Kittens - [Title].[ext]"
        function brandedFilename(title, originalName) {
            const ext = path.extname(originalName || '').toLowerCase();
            const clean = (title || 'file').replace(/[/\\:*?"<>|]/g, '').slice(0, 80).trim();
            return `Script Kittens - ${clean}${ext}`;
        }

        // For code snippets, return raw code as downloadable .txt
        if (item.type === 'code') {
            // Log download
            pool.execute(
                'INSERT INTO vault_downloads (item_id, user_id, ip_address) VALUES (?, ?, ?)',
                [item.id, req.user.id, getIP(req)]
            ).catch(() => {});
            pool.execute('UPDATE vault_items SET download_count = download_count + 1 WHERE id = ?', [item.id])
                .catch(() => {});

            const codeFilename = `Script Kittens - ${(item.title || item.slug).replace(/[/\\:*?"<>|]/g,'').slice(0,80).trim()}.txt`;
            return res.json({ status: 'success', code: item.code_content, filename: codeFilename, title: item.title });
        }

        // Get primary file
        const [files] = await pool.execute(
            'SELECT * FROM vault_files WHERE item_id = ? AND file_type != "image" LIMIT 1',
            [item.id]
        );
        if (!files.length) return res.status(404).json({ error: 'No file found for this item' });

        const file = files[0];
        if (!fs.existsSync(file.file_path)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        // Log download (fire and forget)
        pool.execute(
            'INSERT INTO vault_downloads (item_id, user_id, ip_address) VALUES (?, ?, ?)',
            [item.id, req.user.id, getIP(req)]
        ).catch(() => {});
        pool.execute('UPDATE vault_items SET download_count = download_count + 1 WHERE id = ?', [item.id])
            .catch(() => {});

        // Send with branded filename
        res.download(file.file_path, brandedFilename(item.title, file.filename));
    } catch (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Download failed' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  POST /vault/:id/vote — Upvote or downvote      */
/* ═══════════════════════════════════════════════ */
router.post('/:id/vote', authRequired, async (req, res) => {
    try {
        const vote = parseInt(req.body.vote);
        if (![1, -1].includes(vote)) return res.status(400).json({ error: 'Vote must be 1 or -1' });

        const [rows] = await pool.execute(
            'SELECT id FROM vault_items WHERE uuid = ? AND status = "approved" LIMIT 1',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Item not found' });
        const itemId = rows[0].id;

        // Check existing vote
        const [existing] = await pool.execute(
            'SELECT id, vote FROM vault_votes WHERE item_id = ? AND user_id = ?',
            [itemId, req.user.id]
        );

        let scoreDelta = 0;

        if (existing.length) {
            if (existing[0].vote === vote) {
                // Same vote — remove it
                await pool.execute('DELETE FROM vault_votes WHERE id = ?', [existing[0].id]);
                scoreDelta = -vote;
            } else {
                // Changed vote (e.g. up → down)
                await pool.execute('UPDATE vault_votes SET vote = ? WHERE id = ?', [vote, existing[0].id]);
                scoreDelta = vote * 2; // +2 or -2 swing
            }
        } else {
            // New vote
            await pool.execute(
                'INSERT INTO vault_votes (item_id, user_id, vote) VALUES (?, ?, ?)',
                [itemId, req.user.id, vote]
            );
            scoreDelta = vote;
        }

        await pool.execute('UPDATE vault_items SET vote_score = vote_score + ? WHERE id = ?', [scoreDelta, itemId]);

        const [updated] = await pool.execute('SELECT vote_score FROM vault_items WHERE id = ?', [itemId]);
        res.json({ status: 'success', vote_score: updated[0].vote_score });
    } catch (err) {
        console.error('Vote error:', err);
        res.status(500).json({ error: 'Vote failed' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  POST /vault/:id/report — Report item           */
/* ═══════════════════════════════════════════════ */
router.post('/:id/report', authRequired, async (req, res) => {
    try {
        const { reason, details } = req.body;
        const validReasons = ['malware', 'broken', 'stolen', 'inappropriate', 'other'];
        if (!validReasons.includes(reason)) return res.status(400).json({ error: 'Invalid reason' });

        const [rows] = await pool.execute(
            'SELECT id FROM vault_items WHERE uuid = ? LIMIT 1',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Item not found' });

        // Check if already reported by this user
        const [existing] = await pool.execute(
            'SELECT id FROM vault_reports WHERE item_id = ? AND user_id = ? AND status = "pending"',
            [rows[0].id, req.user.id]
        );
        if (existing.length) return res.status(409).json({ error: 'You already reported this item' });

        await pool.execute(
            'INSERT INTO vault_reports (item_id, user_id, reason, details) VALUES (?, ?, ?, ?)',
            [rows[0].id, req.user.id, reason, sanitize(details)]
        );

        res.json({ status: 'success', message: 'Report submitted — our team will review it' });
    } catch (err) {
        console.error('Report error:', err);
        res.status(500).json({ error: 'Report failed' });
    }
});

/* ═══════════════════════════════════════════════ */
/*  PUT /vault/:id/moderate — Admin: approve/reject */
/* ═══════════════════════════════════════════════ */
router.put('/:id/moderate', authRequired, adminRequired, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be approved or rejected' });
        }

        const [rows] = await pool.execute(
            'SELECT id FROM vault_items WHERE uuid = ? LIMIT 1',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Item not found' });

        await pool.execute('UPDATE vault_items SET status = ? WHERE id = ?', [status, rows[0].id]);

        // If rejected, delete files to save disk space
        if (status === 'rejected') {
            const [files] = await pool.execute('SELECT file_path FROM vault_files WHERE item_id = ?', [rows[0].id]);
            files.forEach(f => fs.unlink(f.file_path, () => {}));
        }

        res.json({ status: 'success', message: `Item ${status}` });
    } catch (err) {
        console.error('Moderate error:', err);
        res.status(500).json({ error: 'Moderation failed' });
    }
});

/* ─── Multer error handler ─── */
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err.message?.includes('not allowed')) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

module.exports = router;
