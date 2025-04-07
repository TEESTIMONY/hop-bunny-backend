/**
 * Test script for MongoDB connection issues
 */

// Test MongoDB connection
async function testMongoDBConnection() {
  const BACKEND_URL = 'https://hop-bunny-backend.vercel.app';
  
  console.log('Testing MongoDB connection...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/test-db`);
    const data = await response.json();
    
    console.log('MongoDB connection test result:', data);
    
    if (data.status === 'connected') {
      console.log('✅ MongoDB connection successful!');
    } else {
      console.error('❌ MongoDB connection failed!');
      console.error('Likely causes:');
      console.error('1. MONGODB_URI not set in Vercel environment variables');
      console.error('2. MONGODB_URI format is incorrect');
      console.error('3. MongoDB Atlas username/password is wrong');
      console.error('4. IP whitelist in MongoDB Atlas doesn\'t include 0.0.0.0/0');
    }
    
    return data;
  } catch (error) {
    console.error('Error testing MongoDB connection:', error);
    return { status: 'error', message: error.message };
  }
}

// Test registration with MongoDB
async function testRegistrationWithMongoDB() {
  console.log('Testing registration with MongoDB connection check...');
  
  // First test MongoDB connection
  const dbTest = await testMongoDBConnection();
  
  if (dbTest.status !== 'connected') {
    console.error('Cannot test registration - MongoDB not connected');
    return { success: false, reason: 'mongodb_not_connected' };
  }
  
  // If MongoDB is connected, try registration
  console.log('MongoDB connected, attempting registration...');
  
  // Call the existing debug register function
  if (typeof window.debugRegister === 'function') {
    await window.debugRegister();
  } else {
    console.error('debugRegister function not available');
  }
}

// Add to window for console testing
window.testMongoDBConnection = testMongoDBConnection;
window.testRegistrationWithMongoDB = testRegistrationWithMongoDB; 