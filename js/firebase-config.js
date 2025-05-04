/**
 * Firebase Configuration Module - v3.0.0
 * Handles Firebase initialization and provides global access to Firebase services
 * DO NOT MODIFY THIS FILE DIRECTLY
 */

// Create a namespace for Auric app services
window.Auric = window.Auric || {};

// Firebase configuration
// IMPORTANT: These are public keys that are meant to be visible on the client side
// https://stackoverflow.com/questions/37482366/is-it-safe-to-expose-firebase-apikey-to-the-public
const PROJECT_ID = "auric-a0c92";
const API_KEY = "AIzaSyCrLCButDevLeILcBjrUCd9e7amXVjW-uI";
const APP_ID = "1:878979958342:web:e6092f7522488d21eaec47";

// Create a dynamic authDomain that works in various environments
const authDomain = `${PROJECT_ID}.firebaseapp.com`;

// Advanced configuration with flexible auth domains
window.Auric.firebaseConfig = {
  apiKey: API_KEY,
  authDomain: authDomain,
  projectId: PROJECT_ID,
  storageBucket: `${PROJECT_ID}.appspot.com`,
  messagingSenderId: "878979958342",
  appId: APP_ID,
  // Add additional fields that might be required
  measurementId: null, // Analytics ID (if needed)
  databaseURL: null // Realtime Database URL (if needed)
};

// Add compatibility settings for OAuth operations
window.Auric.authSettings = {
  // Current domain for testing against authorized domains list
  currentDomain: window.location.hostname,
  // Flag for local testing (replit domain)
  isReplit: window.location.hostname.includes('replit'),
  // Flag for deployment environment
  isProduction: !window.location.hostname.includes('replit') && !window.location.hostname.includes('localhost'),
  // URL for emulator if needed
  emulatorUrl: null
};

// Function to initialize Firebase app and services with enhanced error handling
(function initFirebase() {
  try {
    // Verify Firebase library is loaded
    if (typeof firebase === 'undefined') {
      console.error('Firebase SDK not loaded');
      showInitError('Firebase SDK could not be loaded. Please check your internet connection or browser console.');
      return;
    }
    
    // Make sure we have all required configuration fields
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
    const missingFields = requiredFields.filter(field => !window.Auric.firebaseConfig[field]);
    
    if (missingFields.length > 0) {
      const errorMsg = `Missing required Firebase configuration: ${missingFields.join(', ')}`;
      console.error(errorMsg);
      showInitError(errorMsg);
      return;
    }
    
    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
      try {
        firebase.initializeApp(window.Auric.firebaseConfig);
        console.log('Firebase initialized successfully');
      } catch (initError) {
        console.error('Error initializing Firebase app:', initError);
        showInitError('Failed to initialize Firebase. Please check the console for details.');
        return;
      }
    } else {
      console.log('Firebase already initialized');
    }
    
    // Initialize auth and store in Auric namespace
    try {
      window.Auric.auth = firebase.auth();
      
      // Test authentication service with a simple operation
      window.Auric.auth.languageCode = 'en';
      
      // Configure persistence to keep users logged in
      window.Auric.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
          console.log('Auth persistence set to LOCAL');
        })
        .catch(error => {
          console.warn('Error setting persistence (non-critical):', error);
        });
    } catch (authError) {
      console.error('Error creating auth instance:', authError);
      showInitError('Authentication service initialization failed. Please check your Firebase configuration.');
      return;
    }
    
    // Verify initialization by listening for auth state
    window.Auric.auth.onAuthStateChanged(
      () => console.log('Auth state listener initialized successfully'),
      (error) => console.error('Auth state listener error:', error)
    );
      
  } catch (error) {
    console.error('Firebase initialization error:', error);
    showInitError('An unexpected error occurred during Firebase initialization.');
  }
})();

// Helper function to show initialization errors on the page
function showInitError(message) {
  // Add error to the page if possible
  document.addEventListener('DOMContentLoaded', function() {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
    
    // Show debug instructions if available
    const debugElement = document.getElementById('debug-instructions');
    if (debugElement) {
      debugElement.style.display = 'block';
    }
  });
}