/**
 * Auric E-commerce Authentication Module
 * 
 * This file contains all Firebase authentication functionality for user management
 * including login, signup, Google auth, and session handling.
 * 
 * @version 1.0.0
 * @author Auric Development Team
 */

/**
 * CONFIGURATION SECTION
 * Contains all Firebase configuration and initialization code
 */
const firebaseConfig = {
  apiKey: "AIzaSyCrLCButDevLeILcBjrUCd9e7amXVjW-uI",
  authDomain: "auric-a0c92.firebaseapp.com",
  projectId: "auric-a0c92",
  storageBucket: "auric-a0c92.appspot.com",
  appId: "1:878979958342:web:e6092f7522488d21eaec47"
};

// Initialize Firebase and get auth instance
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

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
      'auth/popup-closed-by-user': 'The sign-in popup was closed before authentication was completed.'
    };
    
    if (error.code && errorMap[error.code]) {
      errorMessage = errorMap[error.code];
    }
    
    UI.showError(errorMessage);
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
    const googleProvider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(googleProvider)
      .then((result) => {
        // Google login successful
        UI.showSuccess('Login successful! Redirecting to your account...');
        
        // Redirect to profile page after successful login
        UI.redirectAfterDelay('profile.html');
      })
      .catch((error) => {
        ErrorHandler.handleAuthError(error);
      });
  },
  
  /**
   * Google Signup handler
   */
  handleGoogleSignup: function() {
    const googleProvider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(googleProvider)
      .then((result) => {
        // Check if this is a new or existing user
        const isNewUser = result.additionalUserInfo.isNewUser;
        
        if (isNewUser) {
          UI.showSuccess('Account created successfully! Redirecting to your account...');
        } else {
          UI.showSuccess('Welcome back! Redirecting to your account...');
        }
        
        // Redirect to profile page after successful signup
        UI.redirectAfterDelay('profile.html');
      })
      .catch((error) => {
        ErrorHandler.handleAuthError(error);
      });
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
  
  // Initialize session management
  SessionManager.init();
}

// Initialize all authentication functionality when the page loads
document.addEventListener('DOMContentLoaded', initAuth);

// Export the logout function for use in other scripts
window.logoutUser = AuthHandlers.handleLogout;
