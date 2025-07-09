const express = require('express');
const router = express.Router();
const db = require('../db.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_super_secret_key'; // In real apps, store in env vars

// Signup
router.post('/signup', (req, res) => {
    const { username, password } = req.body;
    
    // Validation
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    
    // Username validation: 4-20 characters, letters, numbers, underscores only
    if (!/^[a-zA-Z0-9_]{4,20}$/.test(username)) {
        return res.status(400).json({ error: 'Username must be 4-20 characters long and contain only letters, numbers, and underscores' });
    }
    
    // Password validation: at least 8 characters, letters, numbers, special characters
    if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]{8,}$/.test(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long and contain only letters, numbers, and special characters' });
    }
  
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ error: 'Server error' });
  
      const sql = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';
      db.run(sql, [username, hash], function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Username already taken' });
          }
          return res.status(500).json({ error: 'Database error' });
        }
        const token = jwt.sign({ userId: this.lastID, username: username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
      });
    });
  });

  // Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  
      bcrypt.compare(password, user.password_hash, (err, result) => {
        if (err || !result) return res.status(400).json({ error: 'Invalid credentials' });
  
        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
          expiresIn: '1h',
        });
        res.json({ token });
      });
    });
  });

  module.exports = router;