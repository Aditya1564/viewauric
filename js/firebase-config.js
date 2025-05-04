/**
 * Firebase Configuration Module
 * DO NOT MODIFY THIS FILE DIRECTLY
 */

// Firebase configuration with hardcoded values for reliability
const firebaseConfig = {
  apiKey: "AIzaSyCrLCButDevLeILcBjrUCd9e7amXVjW-uI",
  authDomain: "auric-a0c92.firebaseapp.com",
  projectId: "auric-a0c92",
  storageBucket: "auric-a0c92.appspot.com",
  messagingSenderId: "878979958342",
  appId: "1:878979958342:web:e6092f7522488d21eaec47"
};

// Initialize Firebase app
if (typeof firebase !== 'undefined') {
  // Check if Firebase is already initialized
  if (!firebase.apps.length) {
    // Initialize if not already initialized
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized from config.js');
  } else {
    console.log('Firebase already initialized');
  }
} else {
  console.error('Firebase SDK not loaded');
}

// Make auth instance available globally
const auth = firebase.auth ? firebase.auth() : null;
if (auth) {
  // Enable persistent login sessions
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
      console.log('Auth persistence set to LOCAL');
    })
    .catch(error => {
      console.error('Error setting persistence:', error);
    });
}

// Export configuration and auth instance for use in other modules
window.firebaseConfig = firebaseConfig;
window.firebaseAuth = auth;