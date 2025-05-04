/**
 * Google Authentication Module for Auric
 * Handles Google authentication using Firebase
 */

// Create or access the Auric namespace
window.Auric = window.Auric || {};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Google authentication module loaded');
  
  // Verify Firebase and Auth are available
  if (!window.Auric.auth) {
    console.error('Firebase auth not initialized');
    return;
  }
  
  // Set up Google auth elements
  setupGoogleAuth();
});

/**
 * Set up Google authentication elements
 */
function setupGoogleAuth() {
  // Get Google auth buttons
  const googleLoginBtn = document.getElementById('google-login');
  const googleSignupBtn = document.getElementById('google-signup');
  
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', handleGoogleAuth);
    console.log('Google login button initialized');
  }
  
  if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', handleGoogleAuth);
    console.log('Google signup button initialized');
  }
  
  // Check for redirect result
  checkRedirectResult();
}

/**
 * Handle Google authentication
 */
function handleGoogleAuth(e) {
  e.preventDefault();
  console.log('Google authentication started');
  
  try {
    // Create Google provider
    const googleProvider = new firebase.auth.GoogleAuthProvider();
    
    // Add scopes
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    
    // Set custom parameters
    googleProvider.setCustomParameters({
      'prompt': 'select_account'
    });
    
    // Perform the sign-in using popup (more reliable than redirect)
    window.Auric.auth.signInWithPopup(googleProvider)
      .then((result) => {
        console.log('Google authentication successful', result);
        
        // Check if this is a new or existing user
        const isNewUser = result.additionalUserInfo?.isNewUser;
        
        // Show success message
        const successMessage = isNewUser
          ? 'Account created successfully! Redirecting...'
          : 'Login successful! Redirecting...';
          
        showMessage(successMessage, 'success');
        
        // Redirect to profile page
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 1500);
      })
      .catch((error) => {
        console.error('Google authentication error:', error);
        handleAuthError(error);
      });
  } catch (e) {
    console.error('Error setting up Google authentication:', e);
    showMessage('Error initializing Google sign-in. Please try again.', 'error');
  }
}

/**
 * Check for Google redirect result
 */
function checkRedirectResult() {
  window.Auric.auth.getRedirectResult()
    .then((result) => {
      if (result && result.user) {
        console.log('Redirect authentication successful', result);
        
        // Check if this is a new or existing user
        const isNewUser = result.additionalUserInfo?.isNewUser;
        
        // Show success message
        const successMessage = isNewUser
          ? 'Account created successfully! Redirecting...'
          : 'Login successful! Redirecting...';
          
        showMessage(successMessage, 'success');
        
        // Redirect to profile page
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 1500);
      }
    })
    .catch((error) => {
      // Only show error if it's a real error, not just the initial load
      if (error.code && error.code !== 'auth/credential-already-in-use') {
        console.error('Redirect result error:', error);
        handleAuthError(error);
      }
    });
}

/**
 * Handle authentication errors
 */
function handleAuthError(error) {
  console.error('Authentication error:', error);
  
  let errorMessage = 'An error occurred during authentication.';
  
  const errorMap = {
    'auth/email-already-in-use': 'This email is already registered. Please login or use a different email.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/user-not-found': 'No account found with this email. Please sign up first.',
    'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
    'auth/popup-closed-by-user': 'The sign-in popup was closed before authentication was completed.',
    'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
    'auth/too-many-requests': 'Too many unsuccessful login attempts. Please try again later.',
    'auth/internal-error': 'An internal error occurred. Please try again later.',
    'auth/configuration-not-found': 'Authentication configuration not found. Please check the Firebase setup in your Firebase console.',
    'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations for your Firebase project. Add your domain in the Firebase console under Authentication > Settings > Authorized domains.'
  };
  
  if (error.code && errorMap[error.code]) {
    errorMessage = errorMap[error.code];
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  showMessage(errorMessage, 'error');
  
  // Show debug instructions if available
  const debugElement = document.getElementById('debug-instructions');
  if (debugElement) {
    debugElement.style.display = 'block';
  }
}

/**
 * Show message to the user
 */
function showMessage(message, type) {
  const errorElement = document.getElementById('error-message');
  const successElement = document.getElementById('success-message');
  
  if (!errorElement || !successElement) return;
  
  if (type === 'error') {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    successElement.style.display = 'none';
  } else {
    successElement.textContent = message;
    successElement.style.display = 'block';
    errorElement.style.display = 'none';
  }
}