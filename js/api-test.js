/**
 * Test script to check API connectivity
 * Open your browser console and run testAPI() to check if your backend is accessible
 */

async function testAPI() {
  // Your Vercel deployment URL
  const BACKEND_URL = 'https://hop-bunny-backend.vercel.app';
  
  console.log('Testing API connectivity...');
  console.log(`API URL: ${BACKEND_URL}`);
  
  try {
    // Test the basic endpoint
    console.log('Testing root endpoint...');
    const rootResponse = await fetch(`${BACKEND_URL}/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors'
    });
    
    if (!rootResponse.ok) {
      throw new Error(`API root test failed with status: ${rootResponse.status}`);
    }
    
    const rootData = await rootResponse.json();
    console.log('Root endpoint response:', rootData);
    
    // Test the CORS-specific test endpoint
    console.log('Testing CORS test endpoint...');
    const testResponse = await fetch(`${BACKEND_URL}/api/test`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors'
    });
    
    if (!testResponse.ok) {
      throw new Error(`API test endpoint failed with status: ${testResponse.status}`);
    }
    
    const testData = await testResponse.json();
    console.log('Test endpoint response:', testData);
    
    console.log('✅ API CONNECTION SUCCESSFUL ✅');
    return { success: true, rootData, testData };
  } catch (error) {
    console.error('❌ API CONNECTION FAILED ❌');
    console.error(error);
    
    if (error.message.includes('Failed to fetch')) {
      console.log('This appears to be a CORS issue or the server is unreachable.');
      console.log('TROUBLESHOOTING STEPS:');
      console.log('1. Make sure your API is deployed correctly on Vercel');
      console.log('2. Verify your BACKEND_URL is correct in this file');
      console.log('3. Check that CORS is properly configured on your backend');
      console.log('4. Ensure your MongoDB connection is working');
    }
    
    return { success: false, error: error.message };
  }
}

// Export the test function
window.testAPI = testAPI; 