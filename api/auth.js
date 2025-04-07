// Serverless authentication API endpoints
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Only create the model if it doesn't exist
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
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
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
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
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Debug registration route
router.post('/debug-register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 1. Basic validation
    const validationStatus = !username || !email || !password 
      ? 'Missing fields' 
      : 'Fields validated';
    
    // 2. Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 
      ? 'MongoDB connected' 
      : 'MongoDB disconnected';
    
    // 3. User existence check (don't wait for result)
    let userCheckStatus = 'Checking user existence...';
    let userExists = false;
    
    try {
      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      }).maxTimeMS(5000);
      
      userCheckStatus = existingUser 
        ? `User exists: ${existingUser.username}` 
        : 'User does not exist';
      userExists = !!existingUser;
    } catch (userCheckError) {
      userCheckStatus = `User check error: ${userCheckError.message}`;
    }
    
    // 4. Password hashing test (skip if validation failed)
    let hashStatus = 'Not attempted';
    if (password && !userExists) {
      try {
        const hashedPassword = await bcrypt.hash('test', 4); // Use 4 rounds for faster debugging
        hashStatus = `Hashing works: ${hashedPassword.substring(0, 10)}...`;
      } catch (hashError) {
        hashStatus = `Hashing error: ${hashError.message}`;
      }
    }
    
    res.json({
      debug: true,
      received: {
        username: username ? `${username.substring(0, 3)}...` : 'missing',
        email: email ? `${email.substring(0, 3)}...` : 'missing',
        password: password ? `${password.length} chars` : 'missing'
      },
      validation: validationStatus,
      database: dbStatus,
      userCheck: userCheckStatus,
      hashing: hashStatus,
      environment: process.env.NODE_ENV || 'development',
      vercelEnv: process.env.VERCEL_ENV || 'not set'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Debug route error',
      error: error.message,
      stack: error.stack
    });
  }
});

// Simplified test registration - bypasses some complexities
router.post('/test-register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Create a direct MongoDB document to test database writes
    const db = mongoose.connection.db;
    
    // Check if users collection exists, create it if not
    const collections = await db.listCollections({ name: 'users' }).toArray();
    if (collections.length === 0) {
      console.log('Creating users collection');
      await db.createCollection('users');
    }
    
    // Get the users collection
    const usersCollection = db.collection('users');
    
    // Create a simplified user document
    const userDoc = {
      username,
      email,
      password: 'simplified_test', // Not hashing for this test
      createdAt: new Date()
    };
    
    // Attempt to insert the document
    const result = await usersCollection.insertOne(userDoc);
    
    // Respond with success
    res.status(201).json({
      message: 'Test user created successfully',
      userId: result.insertedId.toString(),
      mongoResult: result
    });
  } catch (error) {
    console.error('Test registration error:', error);
    
    // Provide detailed error information
    res.status(500).json({
      message: 'Server error during test registration',
      error: error.message,
      mongoState: mongoose.connection.readyState,
      stack: error.stack
    });
  }
});

module.exports = router; 