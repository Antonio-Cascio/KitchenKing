const express = require('express');
const router = express.Router();
const db = require('../db.js');
const authenticateToken = require('../middleware/auth.js');


router.post('/', authenticateToken, (req, res) => {
    const user_id = req.user.userId; // from token
    const { recipe_id } = req.body;
  
    db.run(
      'INSERT OR IGNORE INTO likes (user_id, recipe_id) VALUES (?, ?)',
      [user_id, recipe_id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, like_id: this.lastID });
      }
    );
  });

  router.delete('/:recipe_id', authenticateToken, (req, res) => {
    const user_id = req.user.userId; // from token
    const { recipe_id } = req.params;
  
    db.run(
      'DELETE FROM likes WHERE user_id = ? AND recipe_id = ?',
      [user_id, recipe_id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });

router.get('/user/:recipe_id', authenticateToken, (req, res) => {
    const user_id = req.user.userId;
    const { recipe_id } = req.params;
  
    db.get(
      'SELECT 1 FROM likes WHERE user_id = ? AND recipe_id = ?',
      [user_id, recipe_id],
      (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ liked: !!row });
      }
    );
});

router.get('/:recipe_id', (req, res) => {
    const {recipe_id} = req.params;

    db.get (
        'SELECT COUNT(*) AS likeCount FROM likes WHERE recipe_id = ?',
        [recipe_id],
    (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, likeCount: row.likeCount });
    }
    );
});


module.exports = router;