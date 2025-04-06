require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS to accept requests from any origin
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204
}));

app.use(express.json());

// After middleware setup and before routes

// Handle OPTIONS preflight requests
app.options('*', (req, res) => {
  res.status(200).end();
});

// Database models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const scoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  score: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Score = mongoose.model('Score', scoreSchema);

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

// Routes

// Register a new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    res.status(201).json({ 
      message: 'User registered successfully',
      userId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'default_secret_change_this',
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit a score
app.post('/api/scores', authMiddleware, async (req, res) => {
  try {
    const { score } = req.body;
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
      score
    });
    
    await newScore.save();
    
    res.status(201).json({ message: 'Score saved successfully' });
  } catch (error) {
    console.error('Score submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaderboard (top 10 scores)
app.get('/api/leaderboard', async (req, res) => {
  try {
    // Get top 10 scores
    const topScores = await Score.find()
      .sort({ score: -1 })
      .limit(10);
    
    res.json(topScores);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's personal best score
app.get('/api/scores/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's top score
    const topScore = await Score.findOne({ userId })
      .sort({ score: -1 });
    
    res.json(topScore || { score: 0 });
  } catch (error) {
    console.error('Personal score error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a simple health check endpoint that doesn't require DB access
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'API is running',
    serverTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Default route - confirm API is working
app.get('/', (req, res) => {
  res.json({ message: 'Hop Bunny API is running!' });
});

// Test route specifically for checking CORS issues
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API connection successful', cors: 'enabled' });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Use MongoDB connection string from environment variables
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://your_mongodb_atlas_connection_string';
    console.log('Attempting to connect to MongoDB...');
    
    // Add connection options to handle deprecation warnings
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
    });
    
    console.log('Connected to MongoDB');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error.message);
    console.error('MongoDB connection string:', process.env.MONGODB_URI ? 'String exists but is not shown for security' : 'Connection string is missing');
    
    // Start server even if DB connection fails (for debugging API issues)
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} WITHOUT database connection`);
    });
  }
};

startServer(); 