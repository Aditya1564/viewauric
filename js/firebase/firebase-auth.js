/**
 * Simplified Firebase Authentication
 * Handles user login, signup, and profile management
 * 
 * This module uses Firebase Compat API which is loaded via script tags in the HTML
 */

// Create a global FirebaseAuth object
window.FirebaseAuth = (function() {
  // Access the already initialized Firebase (or initialize it if not already done)
  let auth, db, googleProvider;
  
  function init() {
    if (!window.firebase) {
      console.error('Firebase not initialized');
      return false;
    }
    
    try {
      auth = firebase.auth();
      db = firebase.firestore();
      googleProvider = new firebase.auth.GoogleAuthProvider();
      return true;
    } catch (error) {
      console.error('Error initializing Firebase Auth:', error);
      return false;
    }
  }

  // Session Management
  /**
   * Save user session to localStorage
   * @param {Object} userData - User data to save
   */
  function saveSession(userData) {
    localStorage.setItem('userSession', JSON.stringify({
      ...userData,
      timestamp: Date.now()
    }));
  }

  /**
   * Get current user session from localStorage
   * @returns {Object|null} - User session or null if not logged in
   */
  function getSession() {
    const session = localStorage.getItem('userSession');
    return session ? JSON.parse(session) : null;
  }

  /**
   * Clear user session from localStorage
   */
  function clearSession() {
    localStorage.removeItem('userSession');
  }

  /**
   * Check if user is logged in
   * @returns {Boolean} - True if user is logged in
   */
  function isLoggedIn() {
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
  async function registerWithEmail(email, password, userData) {
    if (!init()) return { success: false, error: 'Firebase not initialized' };
    
    try {
      // Create Firebase Auth user
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore at the path: users/{userId}
      // Get name from email (part before @) if no display name provided
      const nameFromEmail = user.email ? user.email.split('@')[0] : '';
      const userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: userData.displayName || userData.name || nameFromEmail || 'User',
        createdAt: firebase.firestore.Timestamp.now(),
        updatedAt: firebase.firestore.Timestamp.now()
      };
      
      // This stores the user data at "users/{user.uid}" path in Firestore
      await db.collection("users").doc(user.uid).set(userProfile);
      
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
  async function loginWithEmail(email, password) {
    if (!init()) return { success: false, error: 'Firebase not initialized' };
    
    try {
      // Sign in with Firebase Auth
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Get or create user profile in Firestore at path: users/{user.uid}
      let userProfile;
      const userRef = db.collection("users").doc(user.uid);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        // User exists, update last login at users/{user.uid}
        userProfile = userDoc.data();
        await userRef.update({ 
          lastLogin: firebase.firestore.Timestamp.now(),
          updatedAt: firebase.firestore.Timestamp.now()
        });
      } else {
        // User doesn't exist in Firestore, create profile at users/{user.uid}
        // Get name from email (part before @) if no display name provided
        const nameFromEmail = user.email ? user.email.split('@')[0] : '';
        userProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || nameFromEmail || 'User',
          createdAt: firebase.firestore.Timestamp.now(),
          updatedAt: firebase.firestore.Timestamp.now(),
          lastLogin: firebase.firestore.Timestamp.now()
        };
        // This stores the user data at "users/{user.uid}" path
        await userRef.set(userProfile);
      }
      
      // Save session
      saveSession({
        uid: user.uid,
        email: user.email,
        displayName: userProfile.displayName,
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
  async function loginWithGoogle() {
    if (!init()) return { success: false, error: 'Firebase not initialized' };
    
    try {
      const userCredential = await auth.signInWithPopup(googleProvider);
      const user = userCredential.user;
      
      // Get or create user profile
      const userRef = db.collection("users").doc(user.uid);
      const userDoc = await userRef.get();
      
      let userProfile;
      if (userDoc.exists) {
        // Update existing user
        userProfile = userDoc.data();
        await userRef.update({
          lastLogin: firebase.firestore.Timestamp.now(),
          updatedAt: firebase.firestore.Timestamp.now()
        });
      } else {
        // Create new user profile
        userProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'User',
          photoURL: user.photoURL,
          createdAt: firebase.firestore.Timestamp.now(),
          updatedAt: firebase.firestore.Timestamp.now(),
          lastLogin: firebase.firestore.Timestamp.now()
        };
        await userRef.set(userProfile);
      }
      
      // Save session
      saveSession({
        uid: user.uid,
        email: user.email,
        displayName: userProfile.displayName,
        photoURL: userProfile.photoURL,
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
  async function logoutUser() {
    if (!init()) return { success: false, error: 'Firebase not initialized' };
    
    try {
      await auth.signOut();
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
  async function getUserProfile(userId) {
    if (!init()) return { success: false, error: 'Firebase not initialized' };
    
    try {
      // Access the user document at path: users/{userId}
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
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
  function observeAuthState(callback) {
    if (!init()) {
      console.error('Cannot observe auth state - Firebase not initialized');
      return () => {};
    }
    return auth.onAuthStateChanged(callback);
  }
  
  // Initialize when this script loads
  init();
  
  // Return the public API
  return {
    init,
    saveSession,
    getSession,
    clearSession,
    isLoggedIn,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logoutUser,
    getUserProfile,
    observeAuthState
  };
})();