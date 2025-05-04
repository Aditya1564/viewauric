/**
 * Firebase Verification Script
 * This standalone script is used to test the Firebase connectivity and configuration
 */

console.log('Firebase Verification starting...');

// Try to check Firebase version
if (typeof firebase !== 'undefined') {
  console.log('Firebase SDK detected');
  
  // Log Firebase version if available
  if (firebase.SDK_VERSION) {
    console.log('Firebase SDK version:', firebase.SDK_VERSION);
  } else {
    console.warn('Could not determine Firebase SDK version');
  }
  
  // Create a test configuration (same as in firebase-config.js)
  const testConfig = {
    apiKey: "AIzaSyCrLCButDevLeILcBjrUCd9e7amXVjW-uI",
    authDomain: "auric-a0c92.firebaseapp.com",
    projectId: "auric-a0c92",
    storageBucket: "auric-a0c92.appspot.com",
    messagingSenderId: "878979958342",
    appId: "1:878979958342:web:e6092f7522488d21eaec47"
  };
  
  console.log('Test configuration:', testConfig);
  
  // Check if Firebase is already initialized
  if (firebase.apps && firebase.apps.length > 0) {
    console.log('Firebase already initialized with ' + firebase.apps.length + ' app(s)');
    
    // Get the first app
    const existingApp = firebase.apps[0];
    console.log('Existing app name:', existingApp.name);
    
    // Try to get auth from existing app
    try {
      const auth = existingApp.auth();
      console.log('Successfully got auth from existing app');
      
      // Try a simple auth operation
      auth.languageCode = 'en';
      console.log('Language code set successfully on existing auth instance');
      
      // Try to get current user (should be null if not logged in)
      const currentUser = auth.currentUser;
      console.log('Current user:', currentUser ? 'User found' : 'No user logged in');
      
    } catch (authError) {
      console.error('Error getting auth from existing app:', authError);
    }
    
  } else {
    console.log('No Firebase apps initialized yet, creating test app...');
    
    // Try to initialize Firebase
    try {
      const app = firebase.initializeApp(testConfig, 'verifyApp');
      console.log('Test Firebase app initialized successfully');
      
      // Try to initialize auth
      try {
        const auth = app.auth();
        console.log('Auth initialized successfully on test app');
        
        // Try a simple auth operation
        auth.languageCode = 'en';
        console.log('Language code set successfully');
        
        // Try retrieving a provider for Google sign in
        try {
          const googleProvider = new firebase.auth.GoogleAuthProvider();
          console.log('Google auth provider created successfully');
          
          // Add test scope
          googleProvider.addScope('profile');
          console.log('Successfully added scope to Google provider');
          
        } catch (providerError) {
          console.error('Error creating Google provider:', providerError);
        }
        
        // Delete the test app when done
        setTimeout(() => {
          app.delete().then(() => {
            console.log('Test app deleted successfully');
          }).catch(deleteError => {
            console.error('Error deleting test app:', deleteError);
          });
        }, 5000); // Wait 5 seconds before deleting
        
      } catch (authError) {
        console.error('Error initializing auth on test app:', authError);
      }
      
    } catch (appError) {
      console.error('Error initializing test Firebase app:', appError);
    }
  }
  
} else {
  console.error('Firebase SDK not loaded or not available');
}

console.log('Firebase verification complete - check console for results');

// Display results on page if possible
document.addEventListener('DOMContentLoaded', function() {
  const resultElement = document.createElement('div');
  resultElement.style.margin = '20px';
  resultElement.style.padding = '15px';
  resultElement.style.backgroundColor = '#f8f9fa';
  resultElement.style.border = '1px solid #ddd';
  resultElement.style.borderRadius = '4px';
  
  resultElement.innerHTML = '<h3>Firebase Verification</h3><p>Check the browser console (F12) for detailed verification results.</p>';
  
  // Add to page
  document.body.appendChild(resultElement);
});
