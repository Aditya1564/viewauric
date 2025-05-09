/**
 * Signup Handler
 * This module handles the signup page functionality:
 * - New user registration
 * - Google sign-in
 * - Form validation
 * - Error handling
 * - Redirect after signup
 */

import { registerUser, signInWithGoogle } from './auth-service.js';
import { getUserSession, handleLoginRedirect } from './user-session.js';

/**
 * Initialize the signup page
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing signup page handler');
  
  // Check if user is already logged in
  const userSession = getUserSession();
  if (userSession?.loggedIn) {
    console.log('User is already logged in, redirecting...');
    window.location.href = 'index.html';
    return;
  }
  
  // Set up form submission handler
  setupSignupForm();
  
  // Set up Google signup button
  setupGoogleSignup();
});

/**
 * Set up the signup form submission handler
 */
function setupSignupForm() {
  const signupForm = document.getElementById('signup-form');
  if (!signupForm) return;
  
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validate form data
    if (!validateSignupForm(name, email, password, confirmPassword)) return;
    
    // Disable form submission and show loading state
    setFormLoading(true);
    
    try {
      // Create user account
      const result = await registerUser(email, password, { name });
      
      if (result.success) {
        // Registration successful
        showSuccess('Account created successfully!');
        
        // Check for redirect
        const redirected = handleLoginRedirect();
        
        // Redirect to home page if no specific redirect
        if (!redirected) {
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1000);
        }
      } else {
        // Registration failed
        handleSignupError(result.code, result.error);
      }
    } catch (error) {
      console.error('Error during signup:', error);
      showError('An unexpected error occurred. Please try again.');
    } finally {
      // Re-enable form submission
      setFormLoading(false);
    }
  });
}

/**
 * Set up the Google signup button
 */
function setupGoogleSignup() {
  const googleSignupBtn = document.getElementById('google-signup');
  if (!googleSignupBtn) return;
  
  googleSignupBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Disable button and show loading state
    googleSignupBtn.disabled = true;
    googleSignupBtn.innerHTML = '<span class="spinner"></span> Connecting...';
    
    try {
      // Attempt Google sign-in
      const result = await signInWithGoogle();
      
      if (result.success) {
        // Google sign-in successful
        showSuccess('Google sign-up successful!');
        
        // Check for redirect
        const redirected = handleLoginRedirect();
        
        // Redirect to home page if no specific redirect
        if (!redirected) {
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1000);
        }
      } else {
        // Google sign-in failed
        handleSignupError(result.code, result.error);
      }
    } catch (error) {
      console.error('Error during Google sign-up:', error);
      showError('An unexpected error occurred. Please try again.');
    } finally {
      // Reset button state
      googleSignupBtn.disabled = false;
      googleSignupBtn.innerHTML = '<img src="https://cdn-icons-png.flaticon.com/128/300/300221.png" alt="Google"> Sign up with Google';
    }
  });
}

/**
 * Validate signup form data
 * 
 * @param {string} name - User's name
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} confirmPassword - Password confirmation
 * @returns {boolean} - Whether form data is valid
 */
function validateSignupForm(name, email, password, confirmPassword) {
  // Check name
  if (!name) {
    showError('Please enter your name');
    return false;
  }
  
  // Check email
  if (!email) {
    showError('Please enter your email address');
    return false;
  }
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('Please enter a valid email address');
    return false;
  }
  
  // Check password
  if (!password) {
    showError('Please enter a password');
    return false;
  }
  
  // Password strength validation
  if (password.length < 6) {
    showError('Password must be at least 6 characters long');
    return false;
  }
  
  // Password confirmation
  if (password !== confirmPassword) {
    showError('Passwords do not match');
    return false;
  }
  
  return true;
}

/**
 * Handle Firebase authentication errors
 * 
 * @param {string} errorCode - Firebase error code
 * @param {string} errorMessage - Error message
 */
function handleSignupError(errorCode, errorMessage) {
  let userMessage = 'Registration failed. Please try again.';
  
  // Handle specific error codes
  switch(errorCode) {
    case 'auth/email-already-in-use':
      userMessage = 'This email address is already in use. Please try logging in instead.';
      break;
    case 'auth/invalid-email':
      userMessage = 'Invalid email address format.';
      break;
    case 'auth/weak-password':
      userMessage = 'Password is too weak. Please choose a stronger password.';
      break;
    case 'auth/network-request-failed':
      userMessage = 'Network error. Please check your internet connection and try again.';
      break;
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      userMessage = 'Sign-up was cancelled. Please try again.';
      break;
    case 'auth/unauthorized-domain':
      userMessage = 'Sign-up not allowed from this domain. Please contact support.';
      break;
    default:
      // Show the actual error message for debugging (can be removed in production)
      userMessage = errorMessage || userMessage;
  }
  
  showError(userMessage);
  
  // Show debug info for certain errors
  if (errorCode === 'auth/unauthorized-domain' || 
      errorCode === 'auth/network-request-failed') {
    document.getElementById('debug-instructions').style.display = 'block';
  }
}

/**
 * Set form loading state
 * 
 * @param {boolean} isLoading - Whether form is in loading state
 */
function setFormLoading(isLoading) {
  const signupButton = document.getElementById('signup-button');
  if (!signupButton) return;
  
  if (isLoading) {
    signupButton.disabled = true;
    signupButton.innerHTML = '<span class="spinner"></span> Creating account...';
  } else {
    signupButton.disabled = false;
    signupButton.textContent = 'Create Account';
  }
}

/**
 * Show error message
 * 
 * @param {string} message - Error message
 */
function showError(message) {
  const errorMessageEl = document.getElementById('error-message');
  const successMessageEl = document.getElementById('success-message');
  
  if (errorMessageEl) {
    errorMessageEl.textContent = message;
    errorMessageEl.style.display = 'block';
    
    if (successMessageEl) {
      successMessageEl.style.display = 'none';
    }
    
    // Automatically hide error after 5 seconds
    setTimeout(() => {
      errorMessageEl.style.display = 'none';
    }, 5000);
  }
}

/**
 * Show success message
 * 
 * @param {string} message - Success message
 */
function showSuccess(message) {
  const errorMessageEl = document.getElementById('error-message');
  const successMessageEl = document.getElementById('success-message');
  
  if (successMessageEl) {
    successMessageEl.textContent = message;
    successMessageEl.style.display = 'block';
    
    if (errorMessageEl) {
      errorMessageEl.style.display = 'none';
    }
    
    // Automatically hide success message after 3 seconds
    setTimeout(() => {
      successMessageEl.style.display = 'none';
    }, 3000);
  }
}