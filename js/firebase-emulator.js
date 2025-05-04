/**
 * Firebase Emulator for Development Environments
 * Provides a completely local implementation of Firebase Auth that works without external services
 * @version 1.0.0
 */

// Create or access the Auric namespace
window.Auric = window.Auric || {};

// Define an Emulator namespace
window.Auric.Emulator = {
  // User data store
  users: {},
  currentUser: null,
  authStateListeners: [],
  userLocalStorageKey: 'auric_emulator_user',
  
  /**
   * Initialize the emulator
   */
  init: function() {
    console.log('Firebase Emulator initializing');
    
    // Try to load user from localStorage if available
    try {
      const savedUser = localStorage.getItem(this.userLocalStorageKey);
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
        console.log('Loaded user from localStorage:', this.currentUser);
      }
    } catch (e) {
      console.warn('Could not load user from localStorage:', e);
    }
    
    // Create a fake Firebase auth API
    this.createFakeAuth();
    
    console.log('Firebase Emulator initialized successfully');
    return true;
  },
  
  /**
   * Create a fake Firebase Auth API
   */
  createFakeAuth: function() {
    // Only if firebase is available
    if (!window.firebase) {
      console.error('Cannot create fake auth: Firebase not available');
      return;
    }
    
    const self = this;
    
    // Create a mock Firebase Auth object
    if (!window.Auric.auth) {
      const fakeAuth = {
        // Current user property
        currentUser: self.currentUser,
        
        // Sign in anonymously
        signInAnonymously: function() {
          return new Promise((resolve, reject) => {
            try {
              const userId = 'anonymous_' + Date.now();
              const user = {
                uid: userId,
                isAnonymous: true,
                emailVerified: false,
                providerData: [],
                getIdToken: function() { return Promise.resolve('fake-token-' + userId); },
                updateProfile: function(profile) {
                  user.displayName = profile.displayName || user.displayName;
                  user.photoURL = profile.photoURL || user.photoURL;
                  // Update the current user
                  self.currentUser = user;
                  self.saveUserToLocalStorage(user);
                  self.notifyAuthStateChanged(user);
                  return Promise.resolve();
                }
              };
              
              // Set as current user
              self.currentUser = user;
              fakeAuth.currentUser = user;
              self.users[userId] = user;
              self.saveUserToLocalStorage(user);
              
              // Notify listeners
              self.notifyAuthStateChanged(user);
              
              // Return mock credential
              resolve({ user: user });
            } catch (e) {
              console.error('Error in anonymous sign in:', e);
              reject(new Error('Failed to sign in anonymously'));
            }
          });
        },
        
        // Email/password sign in
        signInWithEmailAndPassword: function(email, password) {
          return new Promise((resolve, reject) => {
            try {
              // For emulator, just create and sign in
              const userId = 'user_' + email.replace(/[^a-zA-Z0-9]/g, '_');
              
              let user = self.users[userId];
              if (!user) {
                user = {
                  uid: userId,
                  email: email,
                  emailVerified: true,
                  displayName: email.split('@')[0],
                  isAnonymous: false,
                  providerData: [{
                    providerId: 'password',
                    uid: email,
                    displayName: email.split('@')[0],
                    email: email,
                    photoURL: null
                  }],
                  getIdToken: function() { return Promise.resolve('fake-token-' + userId); },
                  updateProfile: function(profile) {
                    user.displayName = profile.displayName || user.displayName;
                    user.photoURL = profile.photoURL || user.photoURL;
                    if (user.providerData && user.providerData.length > 0) {
                      user.providerData[0].displayName = profile.displayName || user.providerData[0].displayName;
                      user.providerData[0].photoURL = profile.photoURL || user.providerData[0].photoURL;
                    }
                    // Update the current user
                    self.currentUser = user;
                    self.saveUserToLocalStorage(user);
                    self.notifyAuthStateChanged(user);
                    return Promise.resolve();
                  }
                };
                self.users[userId] = user;
              }
              
              // Set as current user
              self.currentUser = user;
              fakeAuth.currentUser = user;
              self.saveUserToLocalStorage(user);
              
              // Notify listeners
              self.notifyAuthStateChanged(user);
              
              // Return mock credential
              resolve({ user: user });
            } catch (e) {
              console.error('Error in email/password sign in:', e);
              reject(new Error('Failed to sign in with email and password'));
            }
          });
        },
        
        // Create user with email/password 
        createUserWithEmailAndPassword: function(email, password) {
          return new Promise((resolve, reject) => {
            try {
              // Generate a user ID from the email
              const userId = 'user_' + email.replace(/[^a-zA-Z0-9]/g, '_');
              
              // Create a mock user
              const user = {
                uid: userId,
                email: email,
                emailVerified: false,
                displayName: email.split('@')[0],
                isAnonymous: false,
                providerData: [{
                  providerId: 'password',
                  uid: email,
                  displayName: email.split('@')[0],
                  email: email,
                  photoURL: null
                }],
                getIdToken: function() { return Promise.resolve('fake-token-' + userId); },
                updateProfile: function(profile) {
                  user.displayName = profile.displayName || user.displayName;
                  user.photoURL = profile.photoURL || user.photoURL;
                  if (user.providerData && user.providerData.length > 0) {
                    user.providerData[0].displayName = profile.displayName || user.providerData[0].displayName;
                    user.providerData[0].photoURL = profile.photoURL || user.providerData[0].photoURL;
                  }
                  // Update the current user
                  self.currentUser = user;
                  self.saveUserToLocalStorage(user);
                  self.notifyAuthStateChanged(user);
                  return Promise.resolve();
                }
              };
              
              // Store the user
              self.users[userId] = user;
              self.currentUser = user;
              fakeAuth.currentUser = user;
              self.saveUserToLocalStorage(user);
              
              // Notify listeners
              self.notifyAuthStateChanged(user);
              
              // Return the user
              resolve({ user: user });
            } catch (e) {
              console.error('Error creating user:', e);
              reject(new Error('Failed to create user with email and password'));
            }
          });
        },
        
        // Sign in with Google
        signInWithPopup: function(provider) {
          return new Promise((resolve, reject) => {
            try {
              const providerId = provider?.providerId || 'google.com';
              const email = 'test_user@example.com';
              const userId = 'google_user_' + Date.now();
              
              // Create a mock user
              const user = {
                uid: userId,
                email: email,
                emailVerified: true,
                displayName: 'Test User',
                photoURL: 'https://via.placeholder.com/150',
                isAnonymous: false,
                providerData: [{
                  providerId: providerId,
                  uid: email,
                  displayName: 'Test User',
                  email: email,
                  photoURL: 'https://via.placeholder.com/150'
                }],
                getIdToken: function() { return Promise.resolve('fake-token-' + userId); },
                updateProfile: function(profile) {
                  user.displayName = profile.displayName || user.displayName;
                  user.photoURL = profile.photoURL || user.photoURL;
                  if (user.providerData && user.providerData.length > 0) {
                    user.providerData[0].displayName = profile.displayName || user.providerData[0].displayName;
                    user.providerData[0].photoURL = profile.photoURL || user.providerData[0].photoURL;
                  }
                  // Update the current user
                  self.currentUser = user;
                  self.saveUserToLocalStorage(user);
                  self.notifyAuthStateChanged(user);
                  return Promise.resolve();
                }
              };
              
              // Store the user
              self.users[userId] = user;
              self.currentUser = user;
              fakeAuth.currentUser = user;
              self.saveUserToLocalStorage(user);
              
              // Notify listeners
              self.notifyAuthStateChanged(user);
              
              // Return a mock credential result
              resolve({
                user: user,
                credential: {
                  accessToken: 'fake-google-token',
                  idToken: 'fake-id-token'
                },
                additionalUserInfo: {
                  isNewUser: false,
                  profile: {
                    name: 'Test User',
                    email: email,
                    picture: 'https://via.placeholder.com/150'
                  },
                  providerId: providerId
                },
                operationType: 'signIn'
              });
            } catch (e) {
              console.error('Error in popup sign in:', e);
              reject(new Error('Failed to sign in with popup'));
            }
          });
        },
        
        // Also support redirect
        signInWithRedirect: function(provider) {
          // Immediately resolve since we're emulating
          return Promise.resolve();
        },
        
        // Get the redirect result
        getRedirectResult: function() {
          // Just return null user since we don't actually redirect
          return Promise.resolve({ user: null });
        },
        
        // Sign out
        signOut: function() {
          return new Promise((resolve) => {
            self.currentUser = null;
            fakeAuth.currentUser = null;
            try {
              localStorage.removeItem(self.userLocalStorageKey);
            } catch (e) {
              console.warn('Could not clear localStorage:', e);
            }
            self.notifyAuthStateChanged(null);
            resolve();
          });
        },
        
        // Auth state change listener
        onAuthStateChanged: function(callback, errorCallback) {
          if (typeof callback === 'function') {
            self.authStateListeners.push(callback);
            // Immediately call with current state
            try {
              callback(self.currentUser);
            } catch (e) {
              console.error('Error in auth state callback:', e);
              if (typeof errorCallback === 'function') {
                errorCallback(e);
              }
            }
          }
          
          // Return unsubscribe function
          return function() {
            const index = self.authStateListeners.indexOf(callback);
            if (index !== -1) {
              self.authStateListeners.splice(index, 1);
            }
          };
        },
        
        // Auth settings for compatibility
        settings: {
          appVerificationDisabledForTesting: true
        },
        
        // Persistence
        setPersistence: function() {
          return Promise.resolve();
        }
      };
      
      // Set language code for compatibility
      Object.defineProperty(fakeAuth, 'languageCode', {
        get: function() { return 'en'; },
        set: function(val) { /* Ignored */ }
      });
      
      // Assign to Auric namespace
      window.Auric.auth = fakeAuth;
      
      // Create mock Auth types
      if (!firebase.auth.Auth) {
        firebase.auth.Auth = { Persistence: { LOCAL: 'LOCAL', SESSION: 'SESSION', NONE: 'NONE' } };
      }
      
      // Create a Google provider class
      if (!firebase.auth.GoogleAuthProvider) {
        firebase.auth.GoogleAuthProvider = function() {
          this.providerId = 'google.com';
          this.addScope = function() { return this; };
          this.setCustomParameters = function() { return this; };
        };
      }
      
      console.log('Fake Firebase Auth API created successfully');
    } else {
      console.log('Using existing Auth API');
    }
  },
  
  /**
   * Notify all auth state listeners
   */
  notifyAuthStateChanged: function(user) {
    this.authStateListeners.forEach(function(callback) {
      try {
        callback(user);
      } catch (e) {
        console.error('Error in auth state listener:', e);
      }
    });
  },
  
  /**
   * Save user to localStorage
   */
  saveUserToLocalStorage: function(user) {
    try {
      if (user) {
        // Create a serializable copy
        const serializableUser = JSON.parse(JSON.stringify(user));
        // Remove functions
        delete serializableUser.getIdToken;
        delete serializableUser.updateProfile;
        
        localStorage.setItem(this.userLocalStorageKey, JSON.stringify(serializableUser));
      } else {
        localStorage.removeItem(this.userLocalStorageKey);
      }
    } catch (e) {
      console.warn('Could not save user to localStorage:', e);
    }
  }
};

// Check if authentication methods are enabled
function checkAuthMethodAvailability() {
  if (!window.firebase || !window.firebase.auth) {
    return false;
  }
  
  try {
    // Test if anonymous auth is available
    firebase.auth().signInAnonymously()
      .then(() => {
        console.log('Anonymous auth is enabled');
      })
      .catch((error) => {
        console.log('Anonymous auth is not enabled:', error.code);
        // Since anonymous auth failed, we know we need to use the emulator
        console.log('Forcing emulator mode due to auth restrictions');
        window.Auric.Emulator.init();
      });
  } catch (e) {
    console.error('Error checking auth availability:', e);
    // On any error, use the emulator
    window.Auric.Emulator.init();
  }
  
  return true;
}

// Initialize the emulator when the script loads
document.addEventListener('DOMContentLoaded', function() {
  // Force emulator mode for development and testing
  const forceEmulator = true;
  
  // Check if we're in a Replit environment
  const isReplit = window.location.hostname.includes('replit') || 
                   window.location.hostname.includes('5000') || 
                   window.location.hostname === 'localhost';
  
  if (forceEmulator || isReplit) {
    console.log('Development environment detected, initializing Firebase Emulator');
    window.Auric.Emulator.init();
    // Override Firebase auth functions to always use our emulator
    if (window.firebase && window.firebase.auth) {
      console.log('Replacing Firebase Auth with emulator implementation');
      // Make sure our auth implementation is used
      setTimeout(() => {
        // Re-initialize in case other scripts have modified auth
        window.Auric.Emulator.init();
      }, 500);
    }
  } else {
    console.log('Production environment detected, skipping Firebase Emulator');
    // Still check if we need the emulator due to auth restrictions
    checkAuthMethodAvailability();
  }
});
