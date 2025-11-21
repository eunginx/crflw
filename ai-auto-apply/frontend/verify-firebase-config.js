// Load environment variables from .env file
require('dotenv').config({ path: '.env' });

console.log('=== Firebase Configuration ===');
console.log('Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID);
console.log('Auth Domain:', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN);
console.log('API Key:', process.env.REACT_APP_FIREBASE_API_KEY ? 'Set' : 'Missing');
console.log('App ID:', process.env.REACT_APP_FIREBASE_APP_ID ? 'Set' : 'Missing');
console.log('Sender ID:', process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ? 'Set' : 'Missing');

// Test Firebase initialization
try {
  const { initializeApp } = require('firebase/app');
  const { getAuth } = require('firebase/auth');
  
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  };

  console.log('\n=== Testing Firebase Initialization ===');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  console.log('✅ Firebase app initialized successfully');
  console.log('✅ Firebase Auth initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
}
