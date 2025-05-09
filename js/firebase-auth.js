/**
 * Simplified Firebase Authentication
 * Handles user login, signup, and profile management
 */

import { 
  initializeApp 
} from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  Timestamp 
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCrLCButDevLeILcBjrUCd9e7amXVjW-uI",
  authDomain: "auric-a0c92.firebaseapp.com",
  projectId: "auric-a0c92",
  storageBucket: "auric-a0c92.appspot.com",
  messagingSenderId: "878979958342",
  appId: "1:878979958342:web:e6092f7522488d21eaec47",
  measurementId: "G-ZYZ750JHMB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Session Management
/**
 * Save user session to localStorage
 * @param {Object} userData - User data to save
 */
export function saveSession(userData) {
  localStorage.setItem('userSession', JSON.stringify({
    ...userData,
    timestamp: Date.now()
  }));
}

/**
 * Get current user session from localStorage
 * @returns {Object|null} - User session or null if not logged in
 */
export function getSession() {
  const session = localStorage.getItem('userSession');
  return session ? JSON.parse(session) : null;
}

/**
 * Clear user session from localStorage
 */
export function clearSession() {
  localStorage.removeItem('userSession');
}

/**
 * Check if user is logged in
 * @returns {Boolean} - True if user is logged in
 */
export function isLoggedIn() {
  const session = getSession();
  return !!session && session.loggedIn === true;
}

// Authentication Functions
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
    
    // Create user profile in Firestore at the path: users/{userId}
    const userProfile = {
      uid: user.uid,
      email: user.email,
      displayName: userData.displayName || userData.name || 'User',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    // This stores the user data at "users/{user.uid}" path in Firestore
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
    
    // Get or create user profile in Firestore at path: users/{user.uid}
    let userProfile;
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // User exists, update last login at users/{user.uid}
      userProfile = userDoc.data();
      await updateDoc(userRef, { 
        lastLogin: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } else {
      // User doesn't exist in Firestore, create profile at users/{user.uid}
      userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastLogin: Timestamp.now()
      };
      // This stores the user data at "users/{user.uid}" path
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
    
    // Get or create user profile in Firestore at path: users/{user.uid}
    let userProfile;
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // User exists, update last login at users/{user.uid}
      userProfile = userDoc.data();
      await updateDoc(userRef, { 
        lastLogin: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } else {
      // User doesn't exist in Firestore, create profile at users/{user.uid}
      userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastLogin: Timestamp.now()
      };
      // This stores the user data at "users/{user.uid}" path
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
 * Retrieves user data from the path: users/{userId}
 * 
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - User profile
 */
export async function getUserProfile(userId) {
  try {
    // Access the user document at path: users/{userId}
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: "User profile not found" };
    }
    
    return { success: true, profile: userDoc.data() };
  } catch (error) {
    console.error("Error getting user profile:", error);
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