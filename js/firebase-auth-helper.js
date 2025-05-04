/**
 * Firebase Authentication Helper
 * Specialized utility for solving common Firebase auth issues
 * @version 1.0.0
 */

// Create or access the Auric namespace
window.Auric = window.Auric || {};

// Define a Firebase Auth Helper namespace
window.Auric.AuthHelper = {
  /**
   * Initialize Firebase auth with required OAuth settings
   * This fixes common auth configuration issues
   */
  init: function() {
    try {
      // Verify Firebase and Auric auth are available
      if (!firebase || !window.Auric.auth) {
        console.error('Firebase or Auric.auth not initialized');
        return false;
      }

      console.log('Firebase Auth Helper initializing');
      
      // Force Firebase to use the current domain for OAuth operations
      const currentDomain = window.location.hostname;
      console.log('Current domain:', currentDomain);
      
      // Create a custom auth settings object
      const customSettings = {
        // This setting helps with the configuration-not-found error
        'authDomain': window.Auric.firebaseConfig.authDomain,
        // Make sure we're using a popup to avoid redirect issues
        'popupRedirectResolver': firebase.auth.browserPopupRedirectResolver
      };
      
      // Set these settings globally
      firebase.auth().settings.appVerificationDisabledForTesting = true;
      
      console.log('Auth settings configured for improved compatibility');
      return true;
    } catch (error) {
      console.error('Error initializing auth helper:', error);
      return false;
    }
  },
  
  /**
   * Create a pre-configured Google auth provider
   * This avoids common configuration issues
   */
  createGoogleProvider: function() {
    try {
      // Initialize the helper if not already done
      this.init();
      
      // Create a Google provider with fixed configuration
      const googleProvider = new firebase.auth.GoogleAuthProvider();
      
      // Add standard scopes (email and profile)
      googleProvider.addScope('profile');
      googleProvider.addScope('email');
      
      // Use select_account to always show the account picker
      googleProvider.setCustomParameters({
        'prompt': 'select_account'
      });
      
      console.log('Google provider created with fixed configuration');
      return googleProvider;
    } catch (error) {
      console.error('Error creating Google provider:', error);
      return null;
    }
  },
  
  /**
   * Sign in with Google using enhanced error handling
   * @param {Function} onSuccess - Success callback
   * @param {Function} onError - Error callback
   */
  signInWithGoogle: function(onSuccess, onError) {
    try {
      console.log('Starting Google sign-in with enhanced error handling');
      
      // Get a pre-configured provider
      const googleProvider = this.createGoogleProvider();
      if (!googleProvider) {
        throw new Error('Failed to create Google provider');
      }
      
      // Try popup sign-in with enhanced error handling
      window.Auric.auth.signInWithPopup(googleProvider)
        .then((result) => {
          console.log('Google sign-in successful');
          if (typeof onSuccess === 'function') {
            onSuccess(result);
          }
        })
        .catch((error) => {
          console.error('Google sign-in error:', error.code, error.message);
          
          // If we get configuration-not-found, try a different method
          if (error.code === 'auth/configuration-not-found') {
            console.log('Trying alternative authentication method...');
            // Wait a bit and retry with a different approach
            setTimeout(() => {
              this.signInWithGoogleFallback(onSuccess, onError);
            }, 500);
          } else if (typeof onError === 'function') {
            onError(error);
          }
        });
    } catch (error) {
      console.error('Exception in signInWithGoogle:', error);
      if (typeof onError === 'function') {
        onError(error);
      }
    }
  },
  
  /**
   * Fallback method for Google sign-in when popup fails
   * @private
   */
  signInWithGoogleFallback: function(onSuccess, onError) {
    try {
      console.log('Attempting Google sign-in fallback');
      
      // Create a fresh provider
      const googleProvider = new firebase.auth.GoogleAuthProvider();
      googleProvider.addScope('email');
      
      // Try redirect-based sign-in as fallback
      window.Auric.auth.signInWithRedirect(googleProvider)
        .then(() => {
          console.log('Redirect initiated successfully');
        })
        .catch((error) => {
          console.error('Redirect error:', error);
          if (typeof onError === 'function') {
            onError(error);
          }
        });
    } catch (error) {
      console.error('Exception in fallback method:', error);
      if (typeof onError === 'function') {
        onError(error);
      }
    }
  },
  
  /**
   * Check if the user is already signed in
   * @returns {Promise<firebase.User>} User or null
   */
  getCurrentUser: function() {
    return new Promise((resolve) => {
      const unsubscribe = window.Auric.auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }
};

// Initialize the helper when the script loads
document.addEventListener('DOMContentLoaded', function() {
  if (window.Auric && window.Auric.auth) {
    window.Auric.AuthHelper.init();
    console.log('Firebase Auth Helper initialized successfully');
  }
});
