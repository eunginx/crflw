// Test Firebase Authentication
require('dotenv').config({ path: '.env' });

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

async function testAuth() {
  try {
    console.log('=== Testing Firebase Authentication ===');
    
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    
    // Test with invalid credentials to see if auth is configured
    console.log('Testing auth configuration...');
    try {
      await signInWithEmailAndPassword(auth, 'test@example.com', 'password123');
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        console.log('✅ Authentication is properly configured!');
        console.log('   (User not found error is expected)');
      } else if (error.code === 'auth/configuration-not-found') {
        console.log('❌ Authentication not configured in Firebase Console');
        console.log('   Please enable Authentication in Firebase Console');
      } else {
        console.log('⚠️  Unexpected error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth();
