/**
 * Test functions for Firebase authentication
 * Run these in your browser console to troubleshoot
 */

// Test user registration with Firebase
async function testRegister() {
  const username = 'testuser' + Math.floor(Math.random() * 10000);
  const email = `${username}@example.com`;
  const password = 'password123';
  
  console.log(`Attempting to register with Firebase: ${username} (${email})`);
  
  try {
    // Create user with Firebase Authentication
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Update profile with username
    await user.updateProfile({
      displayName: username
    });
    
    // Add user to Firestore
    await firebase.firestore().collection('users').doc(user.uid).set({
      username,
      email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Firebase registration successful!');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('User ID:', user.uid);
    console.log('You can now use these credentials to log in');
    
    return { success: true, user, username, email, password };
  } catch (error) {
    console.error('❌ Firebase registration error:', error);
    return { success: false, error: error.message };
  }
}

// Test user login with Firebase
async function testLogin(email, password) {
  if (!email) {
    console.log('No email provided, using a randomly generated test user');
    const result = await testRegister();
    if (!result.success) {
      return { success: false, error: 'Failed to create test user' };
    }
    email = result.email;
    password = result.password;
  }
  
  console.log(`Attempting to login with Firebase: ${email}`);
  
  try {
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    console.log('✅ Firebase login successful!');
    console.log('User:', user);
    console.log('Display Name:', user.displayName);
    console.log('Email:', user.email);
    console.log('UID:', user.uid);
    
    return { success: true, user };
  } catch (error) {
    console.error('❌ Firebase login error:', error);
    return { success: false, error: error.message };
  }
}

// Test full flow - register and login with Firebase
async function testAuthFlow() {
  console.log('Testing complete Firebase authentication flow...');
  const registration = await testRegister();
  
  if (registration.success) {
    console.log('Firebase registration successful, attempting login...');
    await testLogin(registration.email, registration.password);
  } else {
    console.error('Auth flow stopped due to registration failure');
  }
}

// Test submitting a score
async function testSubmitScore() {
  const score = Math.floor(Math.random() * 1000);
  
  // Make sure we're logged in
  if (!firebase.auth().currentUser) {
    console.log('No user logged in, creating and logging in test user...');
    const result = await testAuthFlow();
    if (!result || !result.success) {
      console.error('Failed to log in test user');
      return { success: false };
    }
  }
  
  const user = firebase.auth().currentUser;
  console.log(`Submitting score ${score} for user ${user.displayName || user.email}`);
  
  try {
    // Add score to Firestore
    const scoreDoc = {
      userId: user.uid,
      username: user.displayName || user.email.split('@')[0],
      score,
      date: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const scoreRef = await firebase.firestore().collection('scores').add(scoreDoc);
    
    console.log('✅ Score submitted successfully!');
    console.log('Score ID:', scoreRef.id);
    console.log('Score:', score);
    
    return { success: true, scoreId: scoreRef.id, score };
  } catch (error) {
    console.error('❌ Score submission error:', error);
    return { success: false, error: error.message };
  }
}

// Test getting the leaderboard
async function testLeaderboard() {
  console.log('Fetching leaderboard from Firestore...');
  
  try {
    // Get top 10 scores
    const leaderboardRef = firebase.firestore().collection('scores')
      .orderBy('score', 'desc')
      .limit(10);
    
    const snapshot = await leaderboardRef.get();
    
    if (snapshot.empty) {
      console.log('Leaderboard is empty');
      return { success: true, scores: [] };
    }
    
    const scores = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        username: data.username,
        score: data.score,
        date: data.date ? new Date(data.date.seconds * 1000) : new Date()
      };
    });
    
    console.log('✅ Leaderboard fetched successfully!');
    console.log('Scores:', scores);
    
    return { success: true, scores };
  } catch (error) {
    console.error('❌ Leaderboard error:', error);
    return { success: false, error: error.message };
  }
}

// Add functions to window object for console testing
window.testRegister = testRegister;
window.testLogin = testLogin;
window.testAuthFlow = testAuthFlow;
window.testSubmitScore = testSubmitScore;
window.testLeaderboard = testLeaderboard;

// Debug registration process
async function debugRegister() {
  const username = 'testuser' + Math.floor(Math.random() * 10000);
  const email = `${username}@example.com`;
  const password = 'password123';
  
  console.log(`Sending debug registration request for: ${username}`);
  
  try {
    const response = await fetch('https://hop-bunny-backend.vercel.app/api/auth/debug-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, email, password }),
      mode: 'cors'
    });
    
    const data = await response.json();
    console.log('Debug registration response:', data);
    
    return { success: response.ok, data };
  } catch (error) {
    console.error('Debug registration error:', error);
    return { success: false, error: error.message };
  }
}

// Test MongoDB directly with minimal operation
async function testRegistrationWithMongoDB() {
  const username = 'testuser' + Math.floor(Math.random() * 10000);
  
  console.log(`Testing MongoDB with minimal registration for: ${username}`);
  
  try {
    const response = await fetch('https://hop-bunny-backend.vercel.app/api/debug/mongo', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      mode: 'cors'
    });
    
    const data = await response.json();
    console.log('MongoDB debug response:', data);
    
    return { success: response.ok, data };
  } catch (error) {
    console.error('MongoDB debug error:', error);
    return { success: false, error: error.message };
  }
}

// Add debug functions to window object
window.debugRegister = debugRegister;
window.testRegistrationWithMongoDB = testRegistrationWithMongoDB;

// Simple direct test with minimal dependencies
function directRegisterTest() {
  const username = 'directtest' + Math.floor(Math.random() * 10000);
  const email = `${username}@example.com`;
  const password = 'password123';
  
  console.log(`Attempting direct registration test for ${username}`);
  
  // Use fetch API directly with minimal options
  fetch('https://hop-bunny-backend.vercel.app/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  })
  .then(response => {
    console.log('Response status:', response.status);
    return response.text(); // Get raw response text first
  })
  .then(text => {
    console.log('Raw response:', text);
    // Try to parse as JSON if possible
    try {
      const data = JSON.parse(text);
      console.log('Parsed JSON response:', data);
      if (data.userId) {
        console.log('✅ Registration successful!');
      }
    } catch (e) {
      console.log('Response was not JSON:', e.message);
    }
  })
  .catch(error => {
    console.error('❌ Direct test error:', error);
  });
}

// Make function available globally
window.directRegisterTest = directRegisterTest;

// Test the simplified registration endpoint
function simplifiedRegisterTest() {
  const username = 'simple' + Math.floor(Math.random() * 10000);
  const email = `${username}@example.com`;
  const password = 'password123';
  
  console.log(`Testing simplified registration for ${username}`);
  
  fetch('https://hop-bunny-backend.vercel.app/api/auth/test-register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  })
  .then(response => {
    console.log('Response status:', response.status);
    return response.text();
  })
  .then(text => {
    console.log('Raw response:', text);
    try {
      const data = JSON.parse(text);
      console.log('Parsed response:', data);
      if (data.userId) {
        console.log('✅ Simplified registration successful!');
        console.log('User ID:', data.userId);
      }
    } catch (e) {
      console.log('Response was not JSON:', e.message);
    }
  })
  .catch(error => {
    console.error('❌ Simplified test error:', error);
  });
}

// Make all test functions available globally
window.simplifiedRegisterTest = simplifiedRegisterTest; 