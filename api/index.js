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

// Test MongoDB connection
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    // Don't log the full connection string for security reasons
    if (process.env.MONGODB_URI) {
      console.log('MONGODB_URI starts with:', process.env.MONGODB_URI.substring(0, 20) + '...');
    }
    
    // Try to connect to MongoDB
    await connectDB();
    
    res.json({
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      message: mongoose.connection.readyState === 1 
        ? 'Successfully connected to MongoDB' 
        : 'Failed to connect to MongoDB',
      readyState: mongoose.connection.readyState
    });
  } catch (error) {
    console.error('MongoDB test error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error testing MongoDB connection',
      error: error.message
    });
  }
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
        return false;
      }
      
      // Check if the URI looks valid
      if (!mongoURI.startsWith('mongodb+srv://') && !mongoURI.startsWith('mongodb://')) {
        console.error('MONGODB_URI format appears invalid');
        return false;
      }
      
      console.log('Connecting to MongoDB...');
      
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000 // 5 seconds timeout 
      });
      
      console.log('MongoDB connected successfully');
      return true;
    } catch (error) {
      console.error('MongoDB connection error:', error.message);
      
      // More detailed error info for common issues
      if (error.message.includes('ENOTFOUND')) {
        console.error('Host not found - check if cluster name is correct');
      } else if (error.message.includes('Authentication failed')) {
        console.error('Authentication failed - check username and password');
      } else if (error.message.includes('timed out')) {
        console.error('Connection timed out - check network or firewall settings');
      }
      
      return false;
    }
  }
  
  return mongoose.connection.readyState === 1;
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