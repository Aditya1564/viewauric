/**
 * Firebase Configuration
 * This file initializes the Firebase app with your project configuration.
 * It exports the initialized Firebase app to be used in other modules.
 */

// Import Firebase core functionality
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase configuration object
 * Contains the necessary API keys and identifiers for your Firebase project
 */
const firebaseConfig = {
  apiKey: "AIzaSyCrLCButDevLeILcBjrUCd9e7amXVjW-uI",
  authDomain: "auric-a0c92.firebaseapp.com",
  projectId: "auric-a0c92",
  storageBucket: "auric-a0c92.firebasestorage.app",
  messagingSenderId: "878979958342",
  appId: "1:878979958342:web:e6092f7522488d21eaec47",
  measurementId: "G-ZYZ750JHMB"
};

/**
 * Initialize Firebase application
 */
const app = initializeApp(firebaseConfig);

/**
 * Initialize and export Firebase authentication service
 * This will be used for all authentication operations (login, signup, etc.)
 */
export const auth = getAuth(app);

/**
 * Initialize and export Firestore database
 * This will be used for storing and retrieving user data
 */
export const db = getFirestore(app);

/**
 * Export the initialized Firebase app
 * This can be used to access other Firebase services as needed
 */
export default app;