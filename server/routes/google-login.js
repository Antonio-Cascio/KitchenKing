const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// POST /api/auth/google-login
router.post('/google-login', (req, res) => {
    const { email, name, googleId } = req.body;
    if (!email || !googleId) return res.status(400).json({ error: 'Missing fields' });
  
    const sql = 'SELECT * FROM users WHERE google_id = ? OR email = ?';
    db.get(sql, [googleId, email], (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
  
      if (user) {
        // User exists, return token
        const token = jwt.sign({ userId: user.id, username: user.username || user.email }, JWT_SECRET, {
          expiresIn: '1h',
        });
        return res.json({ token });
      } else {
        // Create new user
        const insertSql = 'INSERT INTO users (username, email, google_id) VALUES (?, ?, ?)';
        db.run(insertSql, [name, email, googleId], function (err) {
          if (err) return res.status(500).json({ error: 'Could not create user' });
  
          const token = jwt.sign({ userId: this.lastID, username: name }, JWT_SECRET, {
            expiresIn: '1h',
          });
          return res.json({ token });
        });
      }
    });
  });
  