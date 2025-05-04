/**
 * Firebase Configuration Module - v2.0.0
 * Handles Firebase initialization and provides global access to Firebase services
 * DO NOT MODIFY THIS FILE DIRECTLY
 */

// Create a namespace for Auric app services
window.Auric = window.Auric || {};

// Initialize Firebase configuration with reliable values
window.Auric.firebaseConfig = {
  apiKey: "AIzaSyCrLCButDevLeILcBjrUCd9e7amXVjW-uI",
  authDomain: "auric-a0c92.firebaseapp.com",
  projectId: "auric-a0c92",
  storageBucket: "auric-a0c92.appspot.com",
  messagingSenderId: "878979958342",
  appId: "1:878979958342:web:e6092f7522488d21eaec47"
};

// Function to initialize Firebase app and services
(function initFirebase() {
  try {
    // Verify Firebase library is loaded
    if (typeof firebase === 'undefined') {
      console.error('Firebase SDK not loaded');
      return;
    }
    
    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
      firebase.initializeApp(window.Auric.firebaseConfig);
      console.log('Firebase initialized successfully');
    } else {
      console.log('Firebase already initialized');
    }
    
    // Initialize auth and store in Auric namespace
    window.Auric.auth = firebase.auth();
    
    // Configure persistence to keep users logged in
    window.Auric.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => {
        console.log('Auth persistence set to LOCAL');
      })
      .catch(error => {
        console.error('Error setting persistence:', error);
      });
      
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
})();