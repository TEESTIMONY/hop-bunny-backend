/**
 * This file helps diagnose backend API issues
 * Run these functions from your browser console
 */

// Test what the backend is actually returning
async function checkBackendResponse() {
  const BACKEND_URL = 'https://hop-bunny-backend.vercel.app';
  
  console.log('Checking backend response...');
  
  try {
    // Check the root endpoint with no special headers
    const response = await fetch(`${BACKEND_URL}/`, {
      method: 'GET'
    });
    
    // Get the content type
    const contentType = response.headers.get('content-type');
    console.log('Response content type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      // It's JSON as expected
      const data = await response.json();
      console.log('JSON response:', data);
    } else {
      // It's not JSON, so let's see what it is
      const text = await response.text();
      console.log('Raw response (first 500 chars):', text.substring(0, 500));
      
      if (text.includes('<!DOCTYPE html>')) {
        console.error('❌ ERROR: Backend is returning HTML instead of JSON!');
        console.error('This suggests your API is not deployed correctly on Vercel.');
      }
    }
    
    return { status: response.status, statusText: response.statusText, contentType };
  } catch (error) {
    console.error('Error checking backend:', error);
    return { error: error.message };
  }
}

// Test registration with detailed error handling
async function debugRegister() {
  const username = 'testuser' + Math.floor(Math.random() * 10000);
  const email = `${username}@example.com`;
  const password = 'password123';
  
  console.log(`Debug registration attempt for: ${username}`);
  const BACKEND_URL = 'https://hop-bunny-backend.vercel.app';
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });
    
    // Check content type
    const contentType = response.headers.get('content-type');
    console.log('Response status:', response.status);
    console.log('Response content type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Registration JSON response:', data);
    } else {
      const text = await response.text();
      console.log('Raw response (first 500 chars):', text.substring(0, 500));
    }
  } catch (error) {
    console.error('Registration debug error:', error);
  }
}

// Add to window for console testing
window.checkBackendResponse = checkBackendResponse;
window.debugRegister = debugRegister; 