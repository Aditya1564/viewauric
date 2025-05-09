/**
 * Login Handler
 * This module handles the login page functionality:
 * - Email/password login
 * - Google sign-in
 * - Form validation
 * - Error handling
 * - Redirect after login
 */

import { loginUser, signInWithGoogle, resetPassword } from './auth-service.js';
import { getUserSession, updateUserSession, handleLoginRedirect } from './user-session.js';

/**
 * Initialize the login page
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing login page handler');
  
  // Check if user is already logged in
  const userSession = getUserSession();
  if (userSession?.loggedIn) {
    console.log('User is already logged in, redirecting...');
    window.location.href = 'index.html';
    return;
  }
  
  // Set up form submission handler
  setupLoginForm();
  
  // Set up Google login button
  setupGoogleLogin();
  
  // Set up password reset functionality (if implemented)
  setupPasswordReset();
});

/**
 * Set up the login form submission handler
 */
function setupLoginForm() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Validate form data
    if (!validateLoginForm(email, password)) return;
    
    // Disable form submission and show loading state
    setFormLoading(true);
    
    try {
      // Attempt login
      const result = await loginUser(email, password);
      
      if (result.success) {
        // Login successful
        showSuccess('Login successful!');
        
        // Check for redirect
        const redirected = handleLoginRedirect();
        
        // Redirect to home page if no specific redirect
        if (!redirected) {
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1000);
        }
      } else {
        // Login failed
        handleLoginError(result.code, result.error);
      }
    } catch (error) {
      console.error('Error during login:', error);
      showError('An unexpected error occurred. Please try again.');
    } finally {
      // Re-enable form submission
      setFormLoading(false);
    }
  });
}

/**
 * Set up the Google login button
 */
function setupGoogleLogin() {
  const googleLoginBtn = document.getElementById('google-login');
  if (!googleLoginBtn) return;
  
  googleLoginBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Disable button and show loading state
    googleLoginBtn.disabled = true;
    googleLoginBtn.innerHTML = '<span class="spinner"></span> Connecting...';
    
    try {
      // Attempt Google sign-in
      const result = await signInWithGoogle();
      
      if (result.success) {
        // Login successful
        showSuccess('Google sign-in successful!');
        
        // Check for redirect
        const redirected = handleLoginRedirect();
        
        // Redirect to home page if no specific redirect
        if (!redirected) {
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1000);
        }
      } else {
        // Login failed
        handleLoginError(result.code, result.error);
      }
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      showError('An unexpected error occurred. Please try again.');
    } finally {
      // Reset button state
      googleLoginBtn.disabled = false;
      googleLoginBtn.innerHTML = '<img src="https://cdn-icons-png.flaticon.com/128/300/300221.png" alt="Google"> Sign in with Google';
    }
  });
}

/**
 * Set up password reset functionality (if implemented)
 */
function setupPasswordReset() {
  const resetLink = document.getElementById('forgot-password');
  if (!resetLink) return;
  
  resetLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Get email from form
    const email = document.getElementById('email').value.trim();
    
    if (!email) {
      showError('Please enter your email address first');
      return;
    }
    
    // Confirm password reset
    if (!confirm(`Send password reset email to ${email}?`)) {
      return;
    }
    
    try {
      // Send password reset email
      const result = await resetPassword(email);
      
      if (result.success) {
        showSuccess('Password reset email sent. Please check your inbox.');
      } else {
        handleLoginError(result.code, result.error);
      }
    } catch (error) {
      console.error('Error during password reset:', error);
      showError('An unexpected error occurred. Please try again.');
    }
  });
}

/**
 * Validate login form data
 * 
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {boolean} - Whether form data is valid
 */
function validateLoginForm(email, password) {
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
    showError('Please enter your password');
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
function handleLoginError(errorCode, errorMessage) {
  let userMessage = 'Login failed. Please check your credentials and try again.';
  
  // Handle specific error codes
  switch(errorCode) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      userMessage = 'Incorrect email or password. Please try again.';
      break;
    case 'auth/invalid-email':
      userMessage = 'Invalid email address format.';
      break;
    case 'auth/user-disabled':
      userMessage = 'This account has been disabled. Please contact support.';
      break;
    case 'auth/too-many-requests':
      userMessage = 'Too many unsuccessful login attempts. Please try again later or reset your password.';
      break;
    case 'auth/network-request-failed':
      userMessage = 'Network error. Please check your internet connection and try again.';
      break;
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      userMessage = 'Sign-in was cancelled. Please try again.';
      break;
    case 'auth/unauthorized-domain':
      userMessage = 'Sign-in not allowed from this domain. Please contact support.';
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
  const loginButton = document.getElementById('login-button');
  if (!loginButton) return;
  
  if (isLoading) {
    loginButton.disabled = true;
    loginButton.innerHTML = '<span class="spinner"></span> Logging in...';
  } else {
    loginButton.disabled = false;
    loginButton.textContent = 'Login';
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