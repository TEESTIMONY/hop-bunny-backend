// Simplified backend for Vercel serverless functions
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// Configure CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// Handle OPTIONS preflight requests
app.options('*', (req, res) => {
  res.status(200).end();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'API is running in serverless mode',
    serverTime: new Date().toISOString()
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

// Export the Express app
module.exports = app; 