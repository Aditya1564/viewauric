/**
 * Firebase Authentication Manager
 * This is a comprehensive module for handling all Firebase authentication operations
 * It provides methods for login, signup, profile management, and session handling
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCrLCButDevLeILcBjrUCd9e7amXVjW-uI",
  authDomain: "auric-a0c92.firebaseapp.com",
  projectId: "auric-a0c92",
  storageBucket: "auric-a0c92.appspot.com",
  messagingSenderId: "878979958342",
  appId: "1:878979958342:web:e6092f7522488d21eaec47"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Local session management
const SESSION_KEY = 'auric_user_session';

/**
 * Check if user is logged in
 * @returns {Boolean} - True if user is logged in
 */
export function isLoggedIn() {
  const session = getSession();
  return !!session && !!session.loggedIn;
}

/**
 * Get current user session from localStorage
 * @returns {Object|null} - User session or null if not logged in
 */
export function getSession() {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error("Error parsing session data:", error);
    return null;
  }
}

/**
 * Save user session to localStorage
 * @param {Object} userData - User data to save
 */
export function saveSession(userData) {
  try {
    userData.loggedIn = true;
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error("Error saving session data:", error);
  }
}

/**
 * Clear user session from localStorage
 */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Register a new user with email and password
 * @param {String} email - User email
 * @param {String} password - User password
 * @param {Object} userData - Additional user data (name, etc.)
 * @returns {Promise<Object>} - Created user data
 */
export async function registerWithEmail(email, password, userData) {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile in Firestore
    const userProfile = {
      uid: user.uid,
      email: user.email,
      displayName: userData.displayName || userData.name || 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      addresses: [],
      paymentMethods: [],
      orders: []
    };
    
    await setDoc(doc(db, "users", user.uid), userProfile);
    
    // Save session
    saveSession({
      uid: user.uid,
      email: user.email,
      displayName: userProfile.displayName,
      loggedIn: true
    });
    
    return { success: true, user: userProfile };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: error.message, code: error.code };
  }
}

/**
 * Sign in with email and password
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Promise<Object>} - User data
 */
export async function loginWithEmail(email, password) {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get or create user profile in Firestore
    let userProfile;
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // User exists, update last login
      userProfile = userDoc.data();
      await updateDoc(userRef, { lastLogin: new Date().toISOString() });
    } else {
      // User doesn't exist in Firestore, create profile
      userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        addresses: [],
        paymentMethods: [],
        orders: []
      };
      await setDoc(userRef, userProfile);
    }
    
    // Save session
    saveSession({
      uid: user.uid,
      email: user.email,
      displayName: userProfile.displayName,
      photoURL: user.photoURL,
      loggedIn: true
    });
    
    return { success: true, user: userProfile };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: error.message, code: error.code };
  }
}

/**
 * Sign in with Google
 * @returns {Promise<Object>} - User data
 */
export async function loginWithGoogle() {
  try {
    // Sign in with Google
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Get or create user profile in Firestore
    let userProfile;
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // User exists, update last login
      userProfile = userDoc.data();
      await updateDoc(userRef, { 
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // User doesn't exist in Firestore, create profile
      userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        addresses: [],
        paymentMethods: [],
        orders: []
      };
      await setDoc(userRef, userProfile);
    }
    
    // Save session
    saveSession({
      uid: user.uid,
      email: user.email,
      displayName: userProfile.displayName,
      photoURL: user.photoURL,
      loggedIn: true
    });
    
    return { success: true, user: userProfile };
  } catch (error) {
    console.error("Google login error:", error);
    return { success: false, error: error.message, code: error.code };
  }
}

/**
 * Log the user out
 * @returns {Promise<Boolean>} - Success status
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    clearSession();
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user profile from Firestore
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - User profile
 */
export async function getUserProfile(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { success: true, profile: userDoc.data() };
    } else {
      // User doesn't exist in Firestore
      console.error("User profile not found in Firestore");
      return { success: false, error: "User profile not found" };
    }
  } catch (error) {
    console.error("Error loading user profile:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update user profile in Firestore
 * @param {String} userId - User ID
 * @param {Object} data - Data to update
 * @returns {Promise<Object>} - Success status
 */
export async function updateUserProfile(userId, data) {
  try {
    const userRef = doc(db, "users", userId);
    data.updatedAt = new Date().toISOString();
    
    await updateDoc(userRef, data);
    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user orders from Firestore
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Orders data
 */
export async function getUserOrders(userId) {
  try {
    const ordersQuery = query(
      collection(db, "orders"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({id: doc.id, ...doc.data()});
    });
    
    return { success: true, orders };
  } catch (error) {
    console.error("Error loading user orders:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Set up auth state observer
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Function} - Unsubscribe function
 */
export function observeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

// Export Firebase instances for direct access if needed
export { auth, db, app };

// Export default object with all methods
export default {
  isLoggedIn,
  getSession,
  saveSession,
  clearSession,
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUserOrders,
  observeAuthState,
  auth,
  db,
  app
};