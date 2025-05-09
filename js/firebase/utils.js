/**
 * Firebase Utilities
 * This module provides shared utility functions for the Firebase integration
 */

/**
 * Format currency value with Indian Rupee symbol and formatting
 * 
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted amount string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format date in a user-friendly format
 * 
 * @param {Date|number|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  // Handle Firebase Timestamp objects
  if (date && typeof date === 'object' && date.seconds) {
    date = new Date(date.seconds * 1000);
  } else if (typeof date === 'string') {
    date = new Date(date);
  } else if (typeof date === 'number') {
    date = new Date(date);
  }
  
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Generate a random order reference ID
 * 
 * @returns {string} - Order reference ID
 */
export const generateOrderReference = () => {
  const prefix = 'AURIC';
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Create a toast notification
 * 
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 * @param {number} duration - Duration in ms
 */
export const showToast = (message, type = 'info', duration = 3000) => {
  // Check if toast container exists, create if not
  let toastContainer = document.querySelector('.toast-container');
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
    
    // Add styles for the toast container
    const style = document.createElement('style');
    style.textContent = `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
      }
      
      .toast {
        min-width: 250px;
        margin-bottom: 10px;
        padding: 15px;
        border-radius: 4px;
        color: white;
        font-family: 'Lato', sans-serif;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        animation: slide-in 0.3s ease-out forwards;
      }
      
      .toast-success {
        background-color: #4CAF50;
      }
      
      .toast-error {
        background-color: #F44336;
      }
      
      .toast-info {
        background-color: #2196F3;
      }
      
      .toast-close {
        background: transparent;
        border: none;
        color: white;
        font-size: 16px;
        cursor: pointer;
        margin-left: 10px;
      }
      
      @keyframes slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes fade-out {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Add message and close button
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close">&times;</button>
  `;
  
  // Add toast to container
  toastContainer.appendChild(toast);
  
  // Add event listener to close button
  const closeButton = toast.querySelector('.toast-close');
  closeButton.addEventListener('click', () => {
    removeToast(toast);
  });
  
  // Automatically remove toast after duration
  setTimeout(() => {
    removeToast(toast);
  }, duration);
  
  // Function to remove toast with animation
  function removeToast(toast) {
    toast.style.animation = 'fade-out 0.3s forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }
};

/**
 * Create a loading spinner element
 * 
 * @returns {HTMLElement} - Spinner element
 */
export const createSpinner = () => {
  // Create spinner styles if not already added
  if (!document.getElementById('spinner-styles')) {
    const style = document.createElement('style');
    style.id = 'spinner-styles';
    style.textContent = `
      .spinner-container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
      }
      
      .spinner {
        width: 24px;
        height: 24px;
        border: 3px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top-color: #c8a97e;
        animation: spin 0.8s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Create spinner container
  const container = document.createElement('div');
  container.className = 'spinner-container';
  
  // Create spinner
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  
  // Append spinner to container
  container.appendChild(spinner);
  
  return container;
};

/**
 * Validate email format
 * 
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check password strength
 * 
 * @param {string} password - Password to check
 * @returns {Object} - Strength assessment
 */
export const checkPasswordStrength = (password) => {
  // Initialize result
  const result = {
    strong: false,
    score: 0,
    feedback: []
  };
  
  // Check length
  if (password.length < 6) {
    result.feedback.push('Password should be at least 6 characters');
  } else {
    result.score += 1;
  }
  
  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    result.feedback.push('Add lowercase letters');
  } else {
    result.score += 1;
  }
  
  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    result.feedback.push('Add uppercase letters');
  } else {
    result.score += 1;
  }
  
  // Check for numbers
  if (!/[0-9]/.test(password)) {
    result.feedback.push('Add numbers');
  } else {
    result.score += 1;
  }
  
  // Check for special characters
  if (!/[^A-Za-z0-9]/.test(password)) {
    result.feedback.push('Add special characters');
  } else {
    result.score += 1;
  }
  
  // Determine if password is strong
  result.strong = result.score >= 3;
  
  return result;
};

/**
 * Safely parse JSON with error handling
 * 
 * @param {string} jsonString - JSON string to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} - Parsed object or fallback
 */
export const safeJsonParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
};

/**
 * Safely stringify object to JSON with error handling
 * 
 * @param {*} value - Value to stringify
 * @param {string} fallback - Fallback string if stringification fails
 * @returns {string} - JSON string or fallback
 */
export const safeJsonStringify = (value, fallback = '{}') => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('Error stringifying object:', error);
    return fallback;
  }
};