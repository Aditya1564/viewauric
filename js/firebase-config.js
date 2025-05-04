// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyCrLCButDevLeILcBjrUCd9e7amXVjW-uI",
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID || "auric-a0c92"}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "auric-a0c92",
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID || "auric-a0c92"}.appspot.com`,
  appId: process.env.VITE_FIREBASE_APP_ID || "1:878979958342:web:e6092f7522488d21eaec47"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

export { auth, app };
