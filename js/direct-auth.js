/**
 * Direct Firebase Authentication
 * Implements standard Firebase Auth methods for login, signup, and logout operations.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Elements for auth forms
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const logoutBtn = document.getElementById('logout-button');
  const googleLoginBtn = document.getElementById('google-login');
  const googleSignupBtn = document.getElementById('google-signup');
  
  // Elements for displaying messages
  const errorMessageEl = document.getElementById('error-message');
  const successMessageEl = document.getElementById('success-message');
  
  // Elements for user info in profile
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profileAvatar = document.getElementById('profileAvatar');
  
  // Utility functions
  
  /**
   * Display an error message to the user
   */
  function showError(message) {
    if (errorMessageEl) {
      errorMessageEl.textContent = message;
      errorMessageEl.style.display = 'block';
      errorMessageEl.className = 'error-message'; // Ensure the CSS class is applied
      errorMessageEl.setAttribute('role', 'alert'); // Accessibility enhancement
      
      if (successMessageEl) {
        successMessageEl.style.display = 'none';
      }
      
      // Scroll the error message into view if needed
      if (errorMessageEl.getBoundingClientRect().top < 0 || 
          errorMessageEl.getBoundingClientRect().bottom > window.innerHeight) {
        errorMessageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Hide error message after 8 seconds to ensure users have time to read it
      setTimeout(() => {
        errorMessageEl.style.display = 'none';
      }, 8000);
    } else {
      console.error(message);
      alert(message);
    }
  }
  
  /**
   * Display a success message to the user
   */
  function showSuccess(message) {
    if (successMessageEl) {
      successMessageEl.textContent = message;
      successMessageEl.style.display = 'block';
      
      if (errorMessageEl) {
        errorMessageEl.style.display = 'none';
      }
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        successMessageEl.style.display = 'none';
      }, 5000);
    } else {
      console.log(message);
      alert(message);
    }
  }
  
  /**
   * Handle errors from Firebase Auth
   */
  function handleFirebaseAuthError(error) {
    console.error('Firebase Auth Error:', error);
    let message = 'Authentication failed';
    
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No account found with this email address. Please sign up first.';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password. Please try again or use the forgot password option.';
        break;
      case 'auth/invalid-login-credentials':
        message = 'Invalid email or password. Please check your credentials and try again.';
        break;
      case 'auth/email-already-in-use':
        message = 'An account with this email already exists. Please login instead.';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters with a mix of letters, numbers, and symbols.';
        break;
      case 'auth/invalid-email':
        message = 'Please enter a valid email address (example@domain.com).';
        break;
      case 'auth/operation-not-allowed':
        message = 'This login method is not enabled. Please try another method or contact support.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your internet connection and try again.';
        break;
      case 'auth/too-many-requests':
        message = 'Too many unsuccessful login attempts. Please try again later or reset your password.';
        break;
      case 'auth/account-exists-with-different-credential':
        message = 'An account already exists with the same email but different sign-in credentials.';
        break;
      default:
        message = error.message || 'Authentication failed. Please try again with correct credentials.';
    }
    
    showError(message);
    return false;
  }
  
  /**
   * Email/Password Login handler
   */
  function handleEmailLogin(e) {
    if (e) e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      showError('Please enter both email and password');
      return;
    }
    
    // Show loading state
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
      loginButton.textContent = 'Logging in...';
      loginButton.disabled = true;
    }
    
    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log('Logged in user:', user.email);
        showSuccess('Login successful!');
        
        // Redirect to profile page
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 1000);
      })
      .catch((error) => {
        handleFirebaseAuthError(error);
      })
      .finally(() => {
        // Reset button state
        if (loginButton) {
          loginButton.textContent = 'Login';
          loginButton.disabled = false;
        }
      });
  }
  
  /**
   * Email/Password Signup handler
   */
  function handleEmailSignup(e) {
    if (e) e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password')?.value;
    
    if (!email || !password) {
      showError('Please enter both email and password');
      return;
    }
    
    if (confirmPassword && password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    
    // Show loading state
    const signupButton = document.getElementById('signup-button');
    if (signupButton) {
      signupButton.textContent = 'Creating account...';
      signupButton.disabled = true;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log('Created user:', user.email);
        showSuccess('Account created successfully!');
        
        // Redirect to profile page
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 1000);
      })
      .catch((error) => {
        handleFirebaseAuthError(error);
      })
      .finally(() => {
        // Reset button state
        if (signupButton) {
          signupButton.textContent = 'Sign Up';
          signupButton.disabled = false;
        }
      });
  }
  
  /**
   * Google Sign In handler
   */
  function handleGoogleSignIn(e) {
    if (e) e.preventDefault();
    
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    auth.signInWithPopup(provider)
      .then((result) => {
        const user = result.user;
        console.log('Google sign in successful:', user.email);
        showSuccess('Google sign in successful!');
        
        // Redirect to profile page
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 1000);
      })
      .catch((error) => {
        console.error('Google sign in error:', error);
        
        // If popup blocked, try redirect
        if (error.code === 'auth/popup-blocked') {
          showError('Popup was blocked. Trying redirect flow...');
          auth.signInWithRedirect(provider);
          return;
        }
        
        handleFirebaseAuthError(error);
      });
  }
  
  /**
   * Logout handler
   */
  function handleLogout(e) {
    if (e) e.preventDefault();
    
    auth.signOut()
      .then(() => {
        console.log('User signed out');
        showSuccess('Logged out successfully');
        
        // Redirect to home page
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      })
      .catch((error) => {
        console.error('Sign out error:', error);
        showError('Error signing out: ' + error.message);
      });
  }
  
  /**
   * Update profile page with user information
   */
  function updateProfileUI(user) {
    if (!profileName || !profileEmail || !profileAvatar) {
      return;
    }
    
    profileName.textContent = user.displayName || 'Auric Customer';
    profileEmail.textContent = user.email;
    
    // Set avatar with first letter of name or email
    const firstLetter = user.displayName
      ? user.displayName.charAt(0).toUpperCase()
      : user.email.charAt(0).toUpperCase();
      
    profileAvatar.textContent = firstLetter;
  }
  
  /**
   * Check authentication status and redirect accordingly
   */
  function checkAuthStatus() {
    const currentPath = window.location.pathname;
    
    auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in
        console.log('User is authenticated:', user.email);
        
        // Update user icon in navigation
        const userIcon = document.querySelector('.nav-icons .icon-link:nth-child(2)');
        if (userIcon) {
          userIcon.setAttribute('title', 'My Account');
          userIcon.setAttribute('href', 'profile.html');
        }
        
        // If we're on the login or signup page and user is already logged in,
        // redirect to profile page
        if (currentPath.includes('login.html') || currentPath.includes('signup.html')) {
          console.log('Redirecting authenticated user to profile');
          window.location.href = 'profile.html';
        }
        
        // If we're on the profile page, update the UI
        if (currentPath.includes('profile.html')) {
          updateProfileUI(user);
        }
      } else {
        // User is not signed in
        console.log('User is not authenticated');
        
        // Update user icon in navigation
        const userIcon = document.querySelector('.nav-icons .icon-link:nth-child(2)');
        if (userIcon) {
          userIcon.setAttribute('title', 'Login');
          userIcon.setAttribute('href', 'login.html');
        }
        
        // If we're on the profile page and user is not logged in,
        // redirect to login page
        if (currentPath.includes('profile.html')) {
          console.log('Redirecting unauthenticated user to login');
          window.location.href = 'login.html';
        }
      }
    });
  }
  
  // Attach event listeners
  if (loginForm) {
    loginForm.addEventListener('submit', handleEmailLogin);
  }
  
  if (signupForm) {
    signupForm.addEventListener('submit', handleEmailSignup);
  }
  
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', handleGoogleSignIn);
  }
  
  if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', handleGoogleSignIn);
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Initialize authentication status check
  checkAuthStatus();
});