// Serverless scores API endpoints
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Score schema
const scoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  score: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

// Only create the models if they don't exist
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Score = mongoose.models.Score || mongoose.model('Score', scoreSchema);

// Auth middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_change_this');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Submit a score
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { score } = req.body;
    
    if (score === undefined || score === null) {
      return res.status(400).json({ message: 'Score is required' });
    }
    
    const userId = req.user.id;
    
    // Get the username
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Save score
    const newScore = new Score({
      userId,
      username: user.username,
      score: Number(score)
    });
    
    await newScore.save();
    
    res.status(201).json({ message: 'Score saved successfully' });
  } catch (error) {
    console.error('Score submission error:', error);
    res.status(500).json({ message: 'Server error during score submission' });
  }
});

// Get leaderboard (top 10 scores)
router.get('/leaderboard', async (req, res) => {
  try {
    // Get top 10 scores
    const topScores = await Score.find()
      .sort({ score: -1 })
      .limit(10);
    
    res.json(topScores);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
});

// Get user's personal best score
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's top score
    const topScore = await Score.findOne({ userId })
      .sort({ score: -1 });
    
    res.json(topScore || { score: 0 });
  } catch (error) {
    console.error('Personal score error:', error);
    res.status(500).json({ message: 'Server error fetching personal score' });
  }
});

module.exports = router; 