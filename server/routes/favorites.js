const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_super_secret_key';


// Middleware to authenticate token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Get all favorites
router.get('/check/:meal_id', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const mealId = req.params.meal_id;

  const sql = 'SELECT 1 FROM favorites WHERE user_id = ? AND meal_id = ? LIMIT 1'
  db.get(sql, [userId, mealId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ isFavorite: !!row });
  });
});



// Add a favorite
router.post('/', authenticateToken, (req, res) => {
    console.log('POST /api/favorites - Adding favorite');
    console.log('User:', req.user);
    console.log('Request body:', req.body);
    
    const { meal_id, meal_name, meal_thumb } = req.body;
    if (!meal_id || !meal_name) return res.status(400).json({ error: 'Missing meal data' });
  
    const sql =
      'INSERT INTO favorites (user_id, meal_id, meal_name, meal_thumb) VALUES (?, ?, ?, ?)';
    db.run(sql, [req.user.userId, meal_id, meal_name, meal_thumb], function (err) {
      if (err) {
        console.error('Database error adding favorite:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      console.log('Favorite added successfully');
      res.json({ message: 'Favorite added' });
    });
  });

  // Delete a favorite
  router.delete('/:meal_id', authenticateToken, (req, res) => {
    console.log('DELETE /api/favorites - Removing favorite');
    console.log('User:', req.user);
    console.log('Meal ID:', req.params.meal_id);
    
    const sql = 'DELETE FROM favorites WHERE meal_id = ? AND user_id = ?';
    db.run(sql, [req.params.meal_id, req.user.userId], function (err) {
      if (err) {
        console.error('Database error removing favorite:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        console.log('Favorite not found');
        return res.status(404).json({ error: 'Favorite not found' });
      }
      console.log('Favorite removed successfully');
      res.json({ message: 'Favorite removed' });
    });
  });

  router.get('/', authenticateToken, (req, res) => {
    const sql = 'SELECT * FROM favorites WHERE user_id = ?';
    db.all(sql, [req.user.userId], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    });
  });
  
  module.exports = router;