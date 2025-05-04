/**
 * Auric E-commerce Authentication Module
 * 
 * This file contains all Firebase authentication functionality for user management
 * including login, signup, and session handling.
 * Note: Google authentication has been moved to a dedicated auth-google.js file.
 * 
 * @version 3.0.0
 * @author Auric Development Team
 */

/**
 * CONFIGURATION SECTION
 * Firebase auth instance is imported from the Auric namespace
 */

// Verify Auric namespace and auth are available
document.addEventListener('DOMContentLoaded', function() {
  if (!window.Auric || !window.Auric.auth) {
    console.error('Firebase auth is not available - Auric namespace not properly initialized');
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.textContent = 'Authentication service not available. Please refresh the page and try again.';
      errorElement.style.display = 'block';
    }
  } else {
    console.log('Firebase auth is ready through Auric namespace');
  }
});

/**
 * DOM ELEMENTS SECTION
 * Get references to all necessary DOM elements used in authentication process
 */
const ELEMENTS = {
  // Form elements
  loginForm: document.getElementById('login-form'),
  signupForm: document.getElementById('signup-form'),
  
  // Google auth buttons
  googleLoginBtn: document.getElementById('google-login'),
  googleSignupBtn: document.getElementById('google-signup'),
  
  // Message display elements
  errorMessageElement: document.getElementById('error-message'),
  successMessageElement: document.getElementById('success-message'),
  
  // Login/Signup buttons (for disabling during auth process)
  loginButton: document.getElementById('login-button'),
  signupButton: document.getElementById('signup-button')
};

/**
 * UTILITY FUNCTIONS SECTION
 * Helper functions for common operations
 */
const UI = {
  /**
   * Shows an error message to the user
   * @param {string} message - The error message to display
   */
  showError: function(message) {
    if (!ELEMENTS.errorMessageElement || !ELEMENTS.successMessageElement) return;
    
    ELEMENTS.errorMessageElement.textContent = message;
    ELEMENTS.errorMessageElement.style.display = 'block';
    ELEMENTS.successMessageElement.style.display = 'none';
  },
  
  /**
   * Shows a success message to the user
   * @param {string} message - The success message to display
   */
  showSuccess: function(message) {
    if (!ELEMENTS.errorMessageElement || !ELEMENTS.successMessageElement) return;
    
    ELEMENTS.successMessageElement.textContent = message;
    ELEMENTS.successMessageElement.style.display = 'block';
    ELEMENTS.errorMessageElement.style.display = 'none';
  },
  
  /**
   * Redirects user to a specific page after a delay
   * @param {string} path - The URL to redirect to
   * @param {number} delay - Delay in milliseconds before redirect
   */
  redirectAfterDelay: function(path, delay = 1500) {
    setTimeout(() => {
      window.location.href = path;
    }, delay);
  }
};

/**
 * ERROR HANDLING SECTION
 * Functions to handle authentication errors
 */
const ErrorHandler = {
  /**
   * Converts Firebase error codes to user-friendly messages
   * @param {Error} error - The Firebase auth error object
   */
  handleAuthError: function(error) {
    // Log detailed error information for debugging
    console.error('Authentication error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Firebase config:', window.Auric.firebaseConfig);
    
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
      'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations for your Firebase project. Add it in your Firebase console.'
    };
    
    if (error.code && errorMap[error.code]) {
      errorMessage = errorMap[error.code];
    } else {
      // If we don't have a specific message for this error code, show the Firebase error message
      errorMessage = error.message || 'An error occurred during authentication.';
    }
    
    UI.showError(errorMessage);
    
    // Show debug instructions if available
    const debugElement = document.getElementById('debug-instructions');
    if (debugElement) {
      debugElement.style.display = 'block';
    }
  }
};

/**
 * AUTHENTICATION HANDLERS SECTION
 * Contains all user authentication business logic
 */
const AuthHandlers = {
  /**
   * Email/Password Login handler
   * @param {Event} e - The submit event
   */
  handleEmailLogin: function(e) {
    e.preventDefault();
    
    const email = ELEMENTS.loginForm.querySelector('#email').value;
    const password = ELEMENTS.loginForm.querySelector('#password').value;
    
    // Disable button to prevent multiple submits
    if (ELEMENTS.loginButton) {
      ELEMENTS.loginButton.disabled = true;
    }
    
    // Sign in with Firebase
    window.Auric.auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Login successful
        UI.showSuccess('Login successful! Redirecting to your account...');
        
        // Redirect to profile page after successful login
        UI.redirectAfterDelay('profile.html');
      })
      .catch((error) => {
        ErrorHandler.handleAuthError(error);
        if (ELEMENTS.loginButton) {
          ELEMENTS.loginButton.disabled = false;
        }
      });
  },
  
  /**
   * Email/Password Signup handler
   * @param {Event} e - The submit event
   */
  handleEmailSignup: function(e) {
    e.preventDefault();
    
    const name = ELEMENTS.signupForm.querySelector('#name').value;
    const email = ELEMENTS.signupForm.querySelector('#email').value;
    const password = ELEMENTS.signupForm.querySelector('#password').value;
    const confirmPassword = ELEMENTS.signupForm.querySelector('#confirm-password').value;
    
    // Check if passwords match
    if (password !== confirmPassword) {
      UI.showError('Passwords do not match. Please try again.');
      return;
    }
    
    // Disable button to prevent multiple submits
    if (ELEMENTS.signupButton) {
      ELEMENTS.signupButton.disabled = true;
    }
    
    // Create user with Firebase
    window.Auric.auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Signup successful
        const user = userCredential.user;
        
        // Update the user's profile with their name
        return user.updateProfile({
          displayName: name
        }).then(() => {
          UI.showSuccess('Account created successfully! Redirecting to your profile...');
          
          // Redirect to profile page after successful signup
          UI.redirectAfterDelay('profile.html');
        });
      })
      .catch((error) => {
        ErrorHandler.handleAuthError(error);
        if (ELEMENTS.signupButton) {
          ELEMENTS.signupButton.disabled = false;
        }
      });
  },
  
  /**
   * Note: Google authentication handlers have been moved to auth-google.js
   * These methods are kept for backwards compatibility but delegate to the new module
   */
  handleGoogleLogin: function() {
    console.log('Google login handler called - deferring to auth-google.js');
    // This functionality is now handled by auth-google.js
    // This method is kept for backward compatibility
  },
  
  /**
   * Google Signup handler - has been moved to auth-google.js
   */
  handleGoogleSignup: function() {
    console.log('Google signup handler called - deferring to auth-google.js');
    // This functionality is now handled by auth-google.js
    // This method is kept for backward compatibility
  },
  
  /**
   * Handle return from Google redirect flow - has been moved to auth-google.js
   */
  handleGoogleRedirectResult: function() {
    console.log('Google redirect result check - deferring to auth-google.js');
    // This functionality is now handled by auth-google.js
    // This method is kept for backward compatibility
  },
  
  /**
   * Logout handler
   */
  handleLogout: function() {
    window.Auric.auth.signOut()
      .then(() => {
        // Sign-out successful
        window.location.href = 'login.html';
      })
      .catch((error) => {
        // An error happened
        console.error('Logout Error:', error);
      });
  }
};

/**
 * SESSION MANAGEMENT SECTION
 * Handles checking user login state and redirects accordingly
 */
const SessionManager = {
  /**
   * Handles changes in authentication state
   * @param {Object|null} user - Firebase user object or null if signed out
   */
  handleAuthStateChange: function(user) {
    const userIcon = document.querySelector('.nav-icons .icon-link:nth-child(2)');
    const currentPath = window.location.pathname;
    
    if (user) {
      // User is signed in
      console.log('User authenticated:', user.email || user.uid);
      
      if (userIcon) {
        userIcon.setAttribute('title', 'My Account');
        userIcon.setAttribute('href', 'profile.html');
      }
      
      // If we're on the login or signup page and the user is already logged in,
      // redirect to profile page
      if (currentPath.includes('login.html') || currentPath.includes('signup.html')) {
        console.log('Redirecting authenticated user from auth page to profile');
        window.location.href = 'profile.html';
      }
    } else {
      // User is signed out
      console.log('User is not authenticated');
      
      if (userIcon) {
        userIcon.setAttribute('title', 'Login');
        userIcon.setAttribute('href', 'login.html');
      }
      
      // If we're on the profile page and the user is not logged in,
      // redirect to login page
      if (currentPath.includes('profile.html')) {
        console.log('Redirecting unauthenticated user from profile to login');
        window.location.href = 'login.html';
      }
    }
  },
  
  /**
   * Checks if a user is already authenticated
   * @returns {Promise<boolean>} Promise that resolves with auth state
   */
  isUserAuthenticated: function() {
    return new Promise((resolve) => {
      // Use the AuthHelper if available for better compatibility
      if (window.Auric && window.Auric.AuthHelper && window.Auric.AuthHelper.getCurrentUser) {
        window.Auric.AuthHelper.getCurrentUser().then(user => {
          console.log('Auth check using AuthHelper:', !!user);
          resolve(!!user);
        });
      } else {
        // Fall back to one-time auth state check
        const unsubscribe = window.Auric.auth.onAuthStateChanged((user) => {
          unsubscribe();
          console.log('Auth check using standard method:', !!user);
          resolve(!!user);
        });
      }
    });
  },
  
  /**
   * Initializes the authentication state listener
   */
  init: function() {
    window.Auric.auth.onAuthStateChanged(SessionManager.handleAuthStateChange);
    console.log('Auth state listener initialized successfully');
    
    // Set auth persistence to LOCAL for better user experience
    window.Auric.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => {
        console.log('Auth persistence set to LOCAL');
      })
      .catch((error) => {
        console.warn('Could not set auth persistence:', error);
      });
  }
};

/**
 * INITIALIZATION SECTION
 * Setup all event listeners and initialize auth state monitoring
 */
function initAuth() {
  // Set up login form event listener
  if (ELEMENTS.loginForm) {
    ELEMENTS.loginForm.addEventListener('submit', AuthHandlers.handleEmailLogin);
  }
  
  // Set up signup form event listener
  if (ELEMENTS.signupForm) {
    ELEMENTS.signupForm.addEventListener('submit', AuthHandlers.handleEmailSignup);
  }
  
  // Set up Google login button event listener
  if (ELEMENTS.googleLoginBtn) {
    ELEMENTS.googleLoginBtn.addEventListener('click', AuthHandlers.handleGoogleLogin);
  }
  
  // Set up Google signup button event listener
  if (ELEMENTS.googleSignupBtn) {
    ELEMENTS.googleSignupBtn.addEventListener('click', AuthHandlers.handleGoogleSignup);
  }
  
  // Handle redirect result from Google authentication
  AuthHandlers.handleGoogleRedirectResult();
  
  // Initialize session management
  SessionManager.init();
}

// Initialize all authentication functionality when the page loads
document.addEventListener('DOMContentLoaded', initAuth);

// Export auth functionality to the Auric namespace
window.Auric = window.Auric || {};
window.Auric.logoutUser = AuthHandlers.handleLogout;

// Legacy export for backward compatibility
window.logoutUser = window.Auric.logoutUser;
