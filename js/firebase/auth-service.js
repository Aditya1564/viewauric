/**
 * Firebase Authentication Service
 * This module handles all authentication-related functionality:
 * - User registration (email/password)
 * - User login (email/password)
 * - Google sign-in
 * - Password reset
 * - User session management
 */

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "firebase/auth";

import { auth } from "./firebase-config.js";
import { createUserProfile, getUserProfile } from "./database-service.js";

/**
 * Register a new user with email and password
 * Also creates a user profile in the database
 * 
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {Object} userData - Additional user data (name, etc.)
 * @returns {Promise<Object>} - User credentials
 */
export const registerUser = async (email, password, userData) => {
  try {
    // Create authentication record
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile in database
    await createUserProfile(user.uid, {
      uid: user.uid,
      email: user.email,
      displayName: userData.name,
      createdAt: new Date().toISOString(),
      ...userData
    });
    
    return { user, success: true };
  } catch (error) {
    console.error("Error in user registration:", error);
    return { error: error.message, code: error.code, success: false };
  }
};

/**
 * Sign in existing user with email and password
 * 
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} - User credentials
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, success: true };
  } catch (error) {
    console.error("Error in user login:", error);
    return { error: error.message, code: error.code, success: false };
  }
};

/**
 * Sign in or sign up user with Google
 * Creates a profile if the user is new
 * 
 * @returns {Promise<Object>} - User credentials
 */
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Check if this is a new user
    const isNewUser = result._tokenResponse?.isNewUser;
    
    if (isNewUser) {
      // Create a new user profile for Google sign-ins
      await createUserProfile(result.user.uid, {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        createdAt: new Date().toISOString()
      });
    }
    
    return { user: result.user, success: true, isNewUser };
  } catch (error) {
    console.error("Error in Google sign-in:", error);
    return { error: error.message, code: error.code, success: false };
  }
};

/**
 * Log out the current user
 * 
 * @returns {Promise<Object>} - Success status
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Error in logout:", error);
    return { error: error.message, success: false };
  }
};

/**
 * Send a password reset email to the user
 * 
 * @param {string} email - User's email address
 * @returns {Promise<Object>} - Success status
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error("Error in password reset:", error);
    return { error: error.message, code: error.code, success: false };
  }
};

/**
 * Get the current authenticated user
 * 
 * @returns {Object|null} - Current user or null if not authenticated
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Set up an auth state observer
 * The provided callback will be called whenever the auth state changes
 * 
 * @param {Function} callback - Function to call on auth state change
 * @returns {Function} - Unsubscribe function
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Check if user is authenticated
 * 
 * @returns {boolean} - True if user is authenticated
 */
export const isAuthenticated = () => {
  return !!auth.currentUser;
};

/**
 * Get user's ID token for backend authentication
 * 
 * @returns {Promise<string>} - JWT token
 */
export const getUserIdToken = async () => {
  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }
  
  return await auth.currentUser.getIdToken();
};