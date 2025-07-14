const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');



router.post('/', authenticateToken, (req, res) => {
    const { recipe_id, content, rating } = req.body;
    const user_id = req.user.userId;

    console.log('POST /comments - Request body:', req.body);
    console.log('User ID:', user_id);

    if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    db.run(
        'INSERT INTO comments (user_id, recipe_id, content, rating) VALUES (?, ?, ?, ?)',
        [user_id, recipe_id, content, rating],
        function (err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: err.message });
            }
            console.log('Comment inserted successfully, ID:', this.lastID);
            res.json({ success: true, comment_id: this.lastID });
        }
    );
});

router.get('/:recipe_id', authenticateToken, (req, res) => {
    const { recipe_id } = req.params;

    console.log('GET /comments/:recipe_id - Recipe ID:', recipe_id);

    db.all(
        `SELECT c.id, c.content, c.created_at, u.username, c.rating
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.recipe_id = ?
         ORDER BY c.id DESC`,
        [recipe_id],
        (err, rows) => {
            if (err) {
                console.error('Database error fetching comments:', err);
                return res.status(500).json({ error: err.message });
            }
            console.log('Comments fetched:', rows);
            res.json(rows);
        }
    );
});

// Get average rating for a recipe
router.get('/:recipe_id/average-rating', (req, res) => {
    const { recipe_id } = req.params;

    db.get(
        `SELECT AVG(rating) as averageRating, COUNT(rating) as ratingCount
         FROM comments 
         WHERE recipe_id = ? AND rating IS NOT NULL`,
        [recipe_id],
        (err, row) => {
            if (err) {
                console.error('Database error fetching average rating:', err);
                return res.status(500).json({ error: err.message });
            }
            const result = {
                averageRating: row.averageRating ? Math.round(row.averageRating * 10) / 10 : 0,
                ratingCount: row.ratingCount || 0
            };
            console.log('Average rating for recipe', recipe_id, ':', result);
            res.json(result);
        }
    );
});


router.delete('/:comment_id', authenticateToken, (req, res) => {
    const { comment_id } = req.params;
    const user_id = req.user.userId;

    db.get(
        'SELECT user_id FROM comments WHERE id = ?',
        [comment_id],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'Comment not found' });
            if (row.user_id !== user_id) return res.status(403).json({ error: 'Unauthorized' });

            db.run(
                'DELETE FROM comments WHERE id = ?',
                [comment_id],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ success: true });
                }
            );
        }
    );
});

router.put('/:comment_id', authenticateToken, (req, res) => {
    const { comment_id } = req.params;
    const { content, rating } = req.body;
    const user_id = req.user.userId;

    if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    db.get('SELECT user_id FROM comments WHERE id = ?', [comment_id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Comment not found' });
        if (row.user_id !== user_id) return res.status(403).json({ error: 'Unauthorized' });

        db.run(
            'UPDATE comments SET content = ?, rating = ? WHERE id = ?',
            [content, rating, comment_id],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, comment_id: comment_id, content, username: req.user.username });
            }
        );
    });
});

module.exports = router;