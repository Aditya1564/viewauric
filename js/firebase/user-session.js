/**
 * User Session Management
 * This module handles user session management across pages
 * - Verifies user authentication status
 * - Provides utility functions for accessing current user
 * - Handles redirects for protected pages
 */

import { onAuthChange, getCurrentUser } from './auth-service.js';
import { getUserProfile } from './database-service.js';

/**
 * Local storage key for user session
 */
const USER_SESSION_KEY = 'auric_user_session';

/**
 * Initialize user session management
 * This sets up listeners for auth state changes
 */
export const initUserSession = () => {
  console.log('Initializing user session management');
  
  // Set up auth state observer
  onAuthChange(async (user) => {
    if (user) {
      // User is signed in
      console.log('User authenticated:', user.uid);
      
      try {
        // Get user profile from database
        const { success, profile } = await getUserProfile(user.uid);
        
        if (success) {
          // Store minimal user data in sessionStorage
          const sessionData = {
            uid: user.uid,
            email: user.email,
            displayName: profile.displayName || user.displayName || 'User',
            photoURL: profile.photoURL || user.photoURL,
            loggedIn: true,
            lastActivity: new Date().toISOString()
          };
          
          // Save to local storage
          localStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionData));
          
          // Dispatch event for other parts of the app
          dispatchUserEvent('login', sessionData);
        }
      } catch (error) {
        console.error('Error initializing user session:', error);
      }
    } else {
      // User is signed out
      console.log('User signed out');
      localStorage.removeItem(USER_SESSION_KEY);
      
      // Dispatch event for other parts of the app
      dispatchUserEvent('logout');
    }
  });
};

/**
 * Check if user is logged in
 * 
 * @returns {boolean} - Whether user is logged in
 */
export const isUserLoggedIn = () => {
  // First check Firebase auth
  const currentUser = getCurrentUser();
  if (currentUser) return true;
  
  // Fallback to local storage
  try {
    const sessionData = localStorage.getItem(USER_SESSION_KEY);
    if (!sessionData) return false;
    
    const userSession = JSON.parse(sessionData);
    return !!userSession.loggedIn;
  } catch (error) {
    console.error('Error checking user login status:', error);
    return false;
  }
};

/**
 * Get current user session data
 * 
 * @returns {Object|null} - User session data or null if not logged in
 */
export const getUserSession = () => {
  try {
    const sessionData = localStorage.getItem(USER_SESSION_KEY);
    if (!sessionData) return null;
    
    return JSON.parse(sessionData);
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
};

/**
 * Update user session data
 * 
 * @param {Object} updateData - Data to update in session
 */
export const updateUserSession = (updateData) => {
  try {
    const sessionData = localStorage.getItem(USER_SESSION_KEY);
    if (!sessionData) return;
    
    const userSession = JSON.parse(sessionData);
    const updatedSession = {
      ...userSession,
      ...updateData,
      lastActivity: new Date().toISOString()
    };
    
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(updatedSession));
    
    // Dispatch event for other parts of the app
    dispatchUserEvent('update', updatedSession);
  } catch (error) {
    console.error('Error updating user session:', error);
  }
};

/**
 * Clear user session data (logout)
 */
export const clearUserSession = () => {
  localStorage.removeItem(USER_SESSION_KEY);
  dispatchUserEvent('logout');
};

/**
 * Dispatch custom event for user state changes
 * 
 * @param {string} action - Action that occurred (login, logout, update)
 * @param {Object} data - User data
 */
const dispatchUserEvent = (action, data = null) => {
  const event = new CustomEvent('userStateChange', {
    detail: { action, user: data }
  });
  document.dispatchEvent(event);
};

/**
 * Redirect to login page if user is not authenticated
 * 
 * @param {string} redirectUrl - URL to redirect to after login
 */
export const requireLogin = (redirectUrl = window.location.href) => {
  if (!isUserLoggedIn()) {
    // Set redirect URL in session storage
    sessionStorage.setItem('authRedirect', redirectUrl);
    
    // Redirect to login page
    window.location.href = '/login.html';
    return false;
  }
  return true;
};

/**
 * Handle redirect after login if there's a stored redirect URL
 * 
 * @returns {boolean} - Whether a redirect was performed
 */
export const handleLoginRedirect = () => {
  const redirectUrl = sessionStorage.getItem('authRedirect');
  if (redirectUrl) {
    sessionStorage.removeItem('authRedirect');
    window.location.href = redirectUrl;
    return true;
  }
  return false;
};