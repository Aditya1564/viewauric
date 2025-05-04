/**
 * Pure Emulator for Firebase Auth
 * A completely standalone implementation of Firebase Auth that works without any external dependencies
 * @version 1.0.0
 */

// Create or access the Auric namespace
window.Auric = window.Auric || {};

// Define the PureEmulator namespace
window.Auric.PureEmulator = {
  // User management
  users: {},
  currentUser: null,
  authStateListeners: [],
  initialized: false,
  
  // Local storage key
  userStorageKey: 'auric_emulator_user',
  
  /**
   * Initialize the pure emulator
   */
  init: function() {
    if (this.initialized) {
      return true;
    }
    
    console.log('Pure Emulator for Firebase Auth initializing');
    
    // Try to load user from localStorage if available
    try {
      const savedUser = localStorage.getItem(this.userStorageKey);
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
        console.log('Loaded user from localStorage:', this.currentUser);
      }
    } catch (e) {
      console.warn('Could not load user from localStorage:', e);
    }
    
    // Create our fake auth API
    this.createFakeAuth();
    
    // Mark as initialized
    this.initialized = true;
    
    console.log('Pure Emulator initialized successfully');
    return true;
  },
  
  /**
   * Create a completely fake Firebase Auth API that doesn't rely on the real Firebase
   */
  createFakeAuth: function() {
    const self = this;
    
    // Create a fake Firebase namespace if needed
    if (!window.firebase) {
      window.firebase = {
        initializeApp: function() { return {}; },
        apps: [{}]
      };
    }
    
    // Create a fake Auth object
    if (!window.firebase.auth) {
      window.firebase.auth = function() {
        return self.createAuthInstance();
      };
      
      // Add static properties
      window.firebase.auth.Auth = { Persistence: { LOCAL: 'LOCAL', SESSION: 'SESSION', NONE: 'NONE' } };
      window.firebase.auth.GoogleAuthProvider = function() {
        this.providerId = 'google.com';
        this.addScope = function() { return this; };
        this.setCustomParameters = function() { return this; };
      };
      window.firebase.auth.browserPopupRedirectResolver = {};
    }
    
    // Create the Auric.auth object for our namespace
    window.Auric.auth = this.createAuthInstance();
    
    console.log('Fake Firebase Auth API created successfully');
  },
  
  /**
   * Create an Auth instance
   */
  createAuthInstance: function() {
    const self = this;
    
    return {
      // Current user property
      currentUser: self.currentUser,
      
      // Settings object for compatibility
      settings: {
        appVerificationDisabledForTesting: true
      },
      
      // Sign in anonymously
      signInAnonymously: function() {
        return self.signInAnonymously();
      },
      
      // Email/password sign in
      signInWithEmailAndPassword: function(email, password) {
        return self.signInWithEmailAndPassword(email, password);
      },
      
      // Create user with email/password
      createUserWithEmailAndPassword: function(email, password) {
        return self.createUserWithEmailAndPassword(email, password);
      },
      
      // Sign in with popup
      signInWithPopup: function(provider) {
        return self.signInWithPopup(provider ? provider.providerId : 'google.com');
      },
      
      // Sign in with redirect
      signInWithRedirect: function(provider) {
        console.log('Redirect sign-in called, using popup instead');
        return self.signInWithPopup(provider ? provider.providerId : 'google.com');
      },
      
      // Get redirect result
      getRedirectResult: function() {
        return Promise.resolve({ user: null });
      },
      
      // Sign out
      signOut: function() {
        return self.signOut();
      },
      
      // Auth state change listener
      onAuthStateChanged: function(callback) {
        return self.addAuthStateListener(callback);
      },
      
      // Set persistence (does nothing in emulator)
      setPersistence: function() {
        return Promise.resolve();
      },
      
      // Language code
      languageCode: 'en'
    };
  },
  
  /**
   * Sign in anonymously
   */
  signInAnonymously: function() {
    const self = this;
    
    return new Promise((resolve) => {
      const userId = 'anonymous_' + Date.now();
      const user = self.createUserObject({
        uid: userId,
        isAnonymous: true,
        emailVerified: false,
        providerData: []
      });
      
      // Set as current user
      self.setCurrentUser(user);
      
      // Return success
      resolve({ user: user });
    });
  },
  
  /**
   * Sign in with email and password
   */
  signInWithEmailAndPassword: function(email, password) {
    const self = this;
    
    return new Promise((resolve) => {
      // For emulator, we'll create a user if it doesn't exist
      const userId = 'user_' + email.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Check if user exists
      let user = self.users[userId];
      if (!user) {
        // Create new user
        user = self.createUserObject({
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
          }]
        });
        self.users[userId] = user;
      }
      
      // Set as current user
      self.setCurrentUser(user);
      
      // Return success
      resolve({ user: user });
    });
  },
  
  /**
   * Create user with email and password
   */
  createUserWithEmailAndPassword: function(email, password) {
    const self = this;
    
    return new Promise((resolve) => {
      // Generate a user ID from the email
      const userId = 'user_' + email.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Create a mock user
      const user = self.createUserObject({
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
        }]
      });
      
      // Store the user
      self.users[userId] = user;
      self.setCurrentUser(user);
      
      // Return the user
      resolve({ user: user });
    });
  },
  
  /**
   * Sign in with popup
   */
  signInWithPopup: function(providerId) {
    const self = this;
    providerId = providerId || 'google.com';
    
    return new Promise((resolve) => {
      const email = 'test_user@example.com';
      const userId = 'google_user_' + Date.now();
      
      // Create a mock user
      const user = self.createUserObject({
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
        }]
      });
      
      // Store the user
      self.users[userId] = user;
      self.setCurrentUser(user);
      
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
    });
  },
  
  /**
   * Sign out
   */
  signOut: function() {
    const self = this;
    
    return new Promise((resolve) => {
      self.setCurrentUser(null);
      resolve();
    });
  },
  
  /**
   * Add auth state listener
   */
  addAuthStateListener: function(callback) {
    const self = this;
    
    if (typeof callback === 'function') {
      self.authStateListeners.push(callback);
      // Immediately call with current state
      try {
        callback(self.currentUser);
      } catch (e) {
        console.error('Error in auth state callback:', e);
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
  
  /**
   * Set current user and notify listeners
   */
  setCurrentUser: function(user) {
    const self = this;
    
    self.currentUser = user;
    if (window.firebase && window.firebase.auth) {
      const auth = window.firebase.auth();
      auth.currentUser = user;
    }
    if (window.Auric && window.Auric.auth) {
      window.Auric.auth.currentUser = user;
    }
    
    self.saveUserToLocalStorage(user);
    self.notifyAuthStateChanged(user);
  },
  
  /**
   * Notify all auth state listeners
   */
  notifyAuthStateChanged: function(user) {
    const self = this;
    
    self.authStateListeners.forEach(function(callback) {
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
    const self = this;
    
    try {
      if (user) {
        // Create a serializable copy without functions
        const serializableUser = JSON.parse(JSON.stringify(user));
        localStorage.setItem(self.userStorageKey, JSON.stringify(serializableUser));
      } else {
        localStorage.removeItem(self.userStorageKey);
      }
    } catch (e) {
      console.warn('Could not save user to localStorage:', e);
    }
  },
  
  /**
   * Create a user object with common functions
   */
  createUserObject: function(data) {
    const self = this;
    
    // Basic user object
    const user = {
      uid: data.uid,
      email: data.email || null,
      emailVerified: !!data.emailVerified,
      displayName: data.displayName || null,
      photoURL: data.photoURL || null,
      isAnonymous: !!data.isAnonymous,
      providerData: data.providerData || [],
      
      // Methods
      getIdToken: function() {
        return Promise.resolve('fake-token-' + data.uid);
      },
      
      updateProfile: function(profile) {
        user.displayName = profile.displayName || user.displayName;
        user.photoURL = profile.photoURL || user.photoURL;
        
        if (user.providerData && user.providerData.length > 0) {
          user.providerData[0].displayName = profile.displayName || user.providerData[0].displayName;
          user.providerData[0].photoURL = profile.photoURL || user.providerData[0].photoURL;
        }
        
        // Update the current user
        self.setCurrentUser(user);
        return Promise.resolve();
      }
    };
    
    return user;
  }
};

// Initialize automatically on load
document.addEventListener('DOMContentLoaded', function() {
  const isReplit = window.location.hostname.includes('replit') || 
                   window.location.hostname.includes('5000') || 
                   window.location.hostname === 'localhost';
  
  // Initialize for all development environments
  if (isReplit) {
    console.log('Development environment detected, initializing Pure Emulator');
    window.Auric.PureEmulator.init();
  }
});