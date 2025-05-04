/**
 * Auric E-commerce Authentication Module
 * 
 * This file contains all Firebase authentication functionality for user management
 * including login, signup, Google auth, and session handling.
 * 
 * @version 2.0.0
 * @author Auric Development Team
 */

/**
 * CONFIGURATION SECTION
 * Firebase configuration and auth instance are now imported from firebase-config.js
 */

// Get the auth instance from firebase-config.js
let auth = window.firebaseAuth;

// Check if auth is properly initialized
if (!auth && typeof firebase !== 'undefined') {
  console.log('Getting auth from firebase directly');
  auth = firebase.auth();
}

// Final verification
if (!auth) {
  console.error('Firebase auth is not available');
  // Display visible error on the page
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.textContent = 'There was a problem with the authentication service. Please refresh the page and try again.';
    errorElement.style.display = 'block';
  }
}

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
    console.error('Firebase config:', window.firebaseConfig);
    
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
    auth.signInWithEmailAndPassword(email, password)
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
    auth.createUserWithEmailAndPassword(email, password)
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
   * Google Login handler
   */
  handleGoogleLogin: function() {
    try {
      console.log('Google login handler called');
      const googleProvider = new firebase.auth.GoogleAuthProvider();
      
      // Add scopes for additional permissions
      googleProvider.addScope('profile');
      googleProvider.addScope('email');
      
      // Add custom parameters for authorization
      googleProvider.setCustomParameters({
        'prompt': 'select_account'
      });
      
      console.log('Google provider configured, starting redirect flow');
      // Use a redirect for mobile compatibility instead of popup
      auth.signInWithRedirect(googleProvider)
        .catch((error) => {
          console.error('Redirect error:', error);
          ErrorHandler.handleAuthError(error);
        });
    } catch (e) {
      console.error('Error in Google login handler:', e);
      UI.showError('Error initializing Google sign-in. Please try again later or use email sign-in.');
    }
  },
  
  /**
   * Google Signup handler - same as login since Google handles both cases
   */
  handleGoogleSignup: function() {
    // Call the Google login handler directly to handle both signup and login
    AuthHandlers.handleGoogleLogin();
  },
  
  /**
   * Handle return from Google redirect flow
   */
  handleGoogleRedirectResult: function() {
    try {
      console.log('Checking for Google redirect result');
      // Check for redirect result on page load
      auth.getRedirectResult()
        .then((result) => {
          console.log('Redirect result received:', result);
          if (result && result.user) {
            // Check if this is a new or existing user
            const isNewUser = result.additionalUserInfo?.isNewUser;
            console.log('User signed in via redirect, isNewUser:', isNewUser);
            
            if (isNewUser) {
              UI.showSuccess('Account created successfully! Redirecting to your account...');
            } else {
              UI.showSuccess('Welcome back! Redirecting to your account...');
            }
            
            // Redirect to profile page after successful signup/login
            UI.redirectAfterDelay('profile.html');
          } else {
            console.log('No user from redirect result');
          }
        })
        .catch((error) => {
          console.error('Error in redirect result:', error);
          // Only show error if it's not just the initial load
          if (error.code !== 'auth/credential-already-in-use') {
            ErrorHandler.handleAuthError(error);
          }
        });
    } catch (e) {
      console.error('Exception in handleGoogleRedirectResult:', e);
    }
  },
  
  /**
   * Logout handler
   */
  handleLogout: function() {
    auth.signOut()
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
      if (userIcon) {
        userIcon.setAttribute('title', 'My Account');
        userIcon.setAttribute('href', 'profile.html');
      }
      
      // If we're on the login or signup page and the user is already logged in,
      // redirect to profile page
      if (currentPath.includes('login.html') || currentPath.includes('signup.html')) {
        window.location.href = 'profile.html';
      }
    } else {
      // User is signed out
      if (userIcon) {
        userIcon.setAttribute('title', 'Login');
        userIcon.setAttribute('href', 'login.html');
      }
      
      // If we're on the profile page and the user is not logged in,
      // redirect to login page
      if (currentPath.includes('profile.html')) {
        window.location.href = 'login.html';
      }
    }
  },
  
  /**
   * Initializes the authentication state listener
   */
  init: function() {
    auth.onAuthStateChanged(SessionManager.handleAuthStateChange);
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

// Export the logout function for use in other scripts
window.logoutUser = AuthHandlers.handleLogout;
