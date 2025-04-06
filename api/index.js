// Serverless API for Vercel
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./auth');
const scoresRoutes = require('./scores');

// Initialize Express app
const app = express();

// Debug requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Configure CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204
}));

// Handle OPTIONS preflight requests
app.options('*', (req, res) => {
  res.status(204).end();
});

// Parse JSON requests
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'API is running in serverless mode',
    serverTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Default route - confirm API is working
app.get('/', (req, res) => {
  res.json({ message: 'Hop Bunny API is running in serverless mode!' });
});

// Test route specifically for checking CORS issues
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API connection successful', cors: 'enabled' });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoresRoutes);

// Connect to MongoDB if not connected
const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    try {
      const mongoURI = process.env.MONGODB_URI;
      if (!mongoURI) {
        console.error('MONGODB_URI environment variable not set');
        return;
      }
      
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('MongoDB connected');
    } catch (error) {
      console.error('MongoDB connection error:', error.message);
    }
  }
};

// Connect to MongoDB before handling requests
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Export Express app for Vercel serverless
module.exports = app; 