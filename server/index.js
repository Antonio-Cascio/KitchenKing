const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const favoritesRoutes = require('./routes/favorites');
const likesRoutes = require('./routes/likes');
const commentsRoutes = require('./routes/comments');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/comments', commentsRoutes);

app.listen(3001, () => {
  console.log('Server running on port 3001');
});