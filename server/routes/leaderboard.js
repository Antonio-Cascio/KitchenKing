const express = require('express');
const router = express.Router();
const db = require('../db');

// Get leaderboard data - most popular recipes
router.get('/', async (req, res) => {
    try {
        // Full leaderboard query with all engagement metrics
        const query = `
            SELECT 
                all_recipes.ar_recipe_id AS recipe_id,
                COUNT(DISTINCT l.id) as like_count,
                COUNT(DISTINCT c.id) as comment_count,
                AVG(CASE WHEN c.rating IS NOT NULL THEN c.rating END) as avg_rating,
                COUNT(CASE WHEN c.rating IS NOT NULL THEN 1 END) as rating_count
            FROM (
                SELECT recipe_id AS ar_recipe_id FROM likes
                UNION
                SELECT recipe_id AS ar_recipe_id FROM comments
            ) AS all_recipes
            LEFT JOIN likes l ON all_recipes.ar_recipe_id = l.recipe_id
            LEFT JOIN comments c ON all_recipes.ar_recipe_id = c.recipe_id
            GROUP BY all_recipes.ar_recipe_id
            HAVING COUNT(DISTINCT l.id) > 0 OR COUNT(DISTINCT c.id) > 0
            ORDER BY 
                (COUNT(DISTINCT l.id) * 2 + COUNT(DISTINCT c.id) * 3 + COALESCE(AVG(CASE WHEN c.rating IS NOT NULL THEN c.rating END), 0) * 10) DESC,
                COUNT(DISTINCT l.id) DESC,
                COUNT(DISTINCT c.id) DESC,
                all_recipes.ar_recipe_id ASC
            LIMIT 20
        `;

        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Database error fetching leaderboard:', err);
                return res.status(500).json({ error: err.message });
            }

            // Calculate engagement score for each recipe
            const leaderboard = rows.map((row, index) => ({
                rank: index + 1,
                recipe_id: row.recipe_id,
                like_count: row.like_count || 0,
                comment_count: row.comment_count || 0,
                avg_rating: row.avg_rating ? Math.round(row.avg_rating * 10) / 10 : 0,
                rating_count: row.rating_count || 0,
                engagement_score: Math.round(
                    (row.like_count * 2 + row.comment_count * 3 + (row.avg_rating || 0) * 10) * 10
                ) / 10
            }));

            res.json(leaderboard);
        });
    } catch (error) {
        console.error('Error in leaderboard route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get top rated recipes
router.get('/top-rated', async (req, res) => {
    try {
        const query = `
            SELECT 
                recipe_id,
                AVG(rating) as avg_rating,
                COUNT(rating) as rating_count
            FROM comments 
            WHERE rating IS NOT NULL
            GROUP BY recipe_id
            HAVING COUNT(rating) >= 1
            ORDER BY avg_rating DESC, rating_count DESC
            LIMIT 10
        `;

        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Database error fetching top rated:', err);
                return res.status(500).json({ error: err.message });
            }

            const topRated = rows.map((row, index) => ({
                rank: index + 1,
                recipe_id: row.recipe_id,
                avg_rating: Math.round(row.avg_rating * 10) / 10,
                rating_count: row.rating_count
            }));

            res.json(topRated);
        });
    } catch (error) {
        console.error('Error in top-rated route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get most liked recipes
router.get('/most-liked', async (req, res) => {
    try {
        const query = `
            SELECT 
                recipe_id,
                COUNT(*) as like_count
            FROM likes 
            GROUP BY recipe_id
            ORDER BY like_count DESC
            LIMIT 10
        `;

        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Database error fetching most liked:', err);
                return res.status(500).json({ error: err.message });
            }

            const mostLiked = rows.map((row, index) => ({
                rank: index + 1,
                recipe_id: row.recipe_id,
                like_count: row.like_count
            }));

            res.json(mostLiked);
        });
    } catch (error) {
        console.error('Error in most-liked route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;