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
        serverSelectionTimeoutMS: 15000 // Increased from 5000 to 15 seconds
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

// Add debug endpoint
app.get('/api/debug/mongo', async (req, res) => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    const uriExists = !!mongoURI;
    let uriPrefix = "not set";
    let validPrefix = false;
    
    if (uriExists) {
      uriPrefix = mongoURI.substring(0, 12) + '...'; // Show just prefix for security
      validPrefix = mongoURI.startsWith('mongodb+srv://') || mongoURI.startsWith('mongodb://');
    }
    
    // More detailed connection test
    let connectionResult = "Not attempted";
    let detailedDBInfo = {};
    
    if (uriExists && validPrefix) {
      try {
        if (mongoose.connection.readyState === 0) {
          await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 15000 // Increase timeout to 15 seconds
          });
        }
        
        // Try to write to a test collection to verify permissions
        const testCollection = mongoose.connection.db.collection('connection_tests');
        const writeResult = await testCollection.insertOne({
          test: true,
          date: new Date(),
          source: 'debug-endpoint'
        });
        
        // If we get here, write succeeded
        connectionResult = "Full connection successful with write operation";
        
        // Try to read the document back
        const readResult = await testCollection.findOne({ test: true });
        
        // Get database information
        const dbAdmin = mongoose.connection.db.admin();
        let buildInfo = { ok: false };
        try {
          buildInfo = await dbAdmin.buildInfo();
        } catch (adminError) {
          buildInfo = { 
            error: adminError.message,
            note: "This is normal if your user doesn't have admin privileges" 
          };
        }
        
        // Get database stats
        let dbStats = { ok: false };
        try {
          dbStats = await mongoose.connection.db.stats();
        } catch (statsError) {
          dbStats = { error: statsError.message };
        }
        
        // Get collection information
        let collections = [];
        try {
          collections = await mongoose.connection.db.listCollections().toArray();
        } catch (collectionsError) {
          collections = [{ error: collectionsError.message }];
        }
        
        detailedDBInfo = {
          databaseName: mongoose.connection.db.databaseName,
          collections: collections.map(c => c.name || c.error),
          writeResult: writeResult.acknowledged ? "Success" : "Failed",
          readResult: readResult ? "Success" : "Failed",
          dbStats: dbStats,
          buildInfo: {
            version: buildInfo.version,
            gitVersion: buildInfo.gitVersion
          }
        };
      } catch (connError) {
        connectionResult = `Connection failed: ${connError.message}`;
        
        // Add more detailed error info
        if (connError.message.includes('Authentication failed')) {
          connectionResult += ' - Check username and password in connection string';
        } else if (connError.message.includes('ENOTFOUND')) {
          connectionResult += ' - Host not found, check cluster name in connection string';
        } else if (connError.message.includes('timed out')) {
          connectionResult += ' - Connection timed out, check network settings and IP whitelist';
        } else if (connError.message.includes('user is not allowed')) {
          connectionResult += ' - User lacks necessary permissions for database operations';
        } else if (connError.message.includes('Access to storage')) {
          connectionResult += ' - Storage access not allowed, check collection permissions';
        }
      }
    }
    
    // Format MongoDB URI for diagnosis (without showing credentials)
    let uriDiagnosis = "Not available";
    if (uriExists) {
      try {
        const url = new URL(mongoURI);
        uriDiagnosis = {
          protocol: url.protocol,
          host: url.host,
          pathname: url.pathname,
          hasUsername: !!url.username,
          hasPassword: !!url.password,
          searchParams: Object.fromEntries(url.searchParams)
        };
      } catch (urlError) {
        uriDiagnosis = `Error parsing URI: ${urlError.message}`;
      }
    }
    
    res.json({
      uriExists,
      uriPrefix,
      validPrefix,
      uriDiagnosis,
      connectionResult,
      readyState: mongoose.connection.readyState,
      readyStateExplained: [
        'disconnected (0)',
        'connected (1)',
        'connecting (2)',
        'disconnecting (3)'
      ][mongoose.connection.readyState] || 'unknown',
      detailedDBInfo,
      nodeEnv: process.env.NODE_ENV || 'not set',
      vercelEnv: process.env.VERCEL_ENV || 'not set'
    });
  } catch (error) {
    res.status(500).json({
      error: `Debug endpoint error: ${error.message}`
    });
  }
});

// Export Express app for Vercel serverless
module.exports = app; 