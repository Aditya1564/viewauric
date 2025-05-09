/**
 * Profile Handler
 * This module handles the user profile page functionality:
 * - Display user information
 * - Handle user orders display
 * - Manage addresses and payment methods
 * - Account settings and logout
 */

import { getCurrentUser, logoutUser } from './auth-service.js';
import { 
  getUserProfile, 
  updateUserProfile, 
  getUserOrders,
  addUserAddress,
  removeUserAddress,
  addPaymentMethod,
  removePaymentMethod
} from './database-service.js';
import { getUserSession, requireLogin, clearUserSession } from './user-session.js';

/**
 * Initialize the profile page
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing profile page handler');
  
  // Require login for this page
  if (!requireLogin()) {
    return;
  }
  
  // Get current user information
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    console.error('No authenticated user found');
    window.location.href = 'login.html';
    return;
  }
  
  try {
    // Get user profile from database
    const { success, profile } = await getUserProfile(currentUser.uid);
    
    if (success) {
      // Display user information
      displayUserInfo(profile);
      
      // Load user orders
      loadUserOrders(currentUser.uid);
      
      // Set up navigation tabs
      setupProfileNavigation();
      
      // Set up logout button
      setupLogoutButton();
      
      // Set up address management
      if (profile.addresses) {
        displayUserAddresses(profile.addresses);
      }
      
      // Set up payment methods
      if (profile.paymentMethods) {
        displayPaymentMethods(profile.paymentMethods);
      }
    } else {
      console.error('Failed to load user profile');
      showError('Failed to load your profile. Please try again later.');
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    showError('An error occurred while loading your profile. Please try again later.');
  }
});

/**
 * Display user information on the profile page
 * 
 * @param {Object} profile - User profile data
 */
function displayUserInfo(profile) {
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profileAvatar = document.getElementById('profileAvatar');
  
  if (profileName && profile.displayName) {
    profileName.textContent = profile.displayName;
  }
  
  if (profileEmail && profile.email) {
    profileEmail.textContent = profile.email;
  }
  
  if (profileAvatar) {
    if (profile.photoURL) {
      // If user has a photo URL, display it
      profileAvatar.innerHTML = `<img src="${profile.photoURL}" alt="${profile.displayName}" class="avatar-image">`;
    } else if (profile.displayName) {
      // Otherwise show the first letter of their name
      profileAvatar.textContent = profile.displayName.charAt(0).toUpperCase();
    } else {
      // Fallback
      profileAvatar.textContent = 'U';
    }
  }
}

/**
 * Load and display user orders
 * 
 * @param {string} userId - User ID
 */
async function loadUserOrders(userId) {
  const ordersContainer = document.getElementById('orders');
  if (!ordersContainer) return;
  
  try {
    const { success, orders } = await getUserOrders(userId);
    
    if (success && orders.length > 0) {
      // Clear any existing content
      ordersContainer.innerHTML = '<h2>My Orders</h2>';
      
      // Create HTML for each order
      orders.forEach(order => {
        const orderHTML = createOrderHTML(order);
        ordersContainer.insertAdjacentHTML('beforeend', orderHTML);
      });
    } else if (success && orders.length === 0) {
      ordersContainer.innerHTML = `
        <h2>My Orders</h2>
        <p class="empty-section-message">You haven't placed any orders yet.</p>
        <a href="index.html" class="shop-now-button">Start Shopping</a>
      `;
    } else {
      ordersContainer.innerHTML = `
        <h2>My Orders</h2>
        <p class="error-message">Failed to load your orders. Please try again later.</p>
      `;
    }
  } catch (error) {
    console.error('Error loading orders:', error);
    ordersContainer.innerHTML = `
      <h2>My Orders</h2>
      <p class="error-message">An error occurred while loading your orders. Please try again later.</p>
    `;
  }
}

/**
 * Create HTML for an order
 * 
 * @param {Object} order - Order data
 * @returns {string} - HTML string
 */
function createOrderHTML(order) {
  const date = new Date(order.createdAt.seconds * 1000);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Start order card HTML
  let orderHTML = `
    <div class="order-card">
      <div class="order-header">
        <span class="order-id">Order #${order.orderId}</span>
        <span class="order-date">${formattedDate}</span>
      </div>
  `;
  
  // Add order items
  if (order.items && order.items.length > 0) {
    order.items.forEach(item => {
      orderHTML += `
        <div class="order-item">
          <img src="${item.image}" alt="${item.name}" class="order-item-image">
          <div class="order-item-details">
            <h4>${item.name}</h4>
            <span class="order-item-price">₹${parseFloat(item.price).toFixed(2)}</span>
          </div>
        </div>
      `;
    });
  }
  
  // Add order total and close card
  orderHTML += `
      <div class="order-total">Total: ₹${parseFloat(order.total).toFixed(2)}</div>
    </div>
  `;
  
  return orderHTML;
}

/**
 * Display user addresses
 * 
 * @param {Array} addresses - User addresses
 */
function displayUserAddresses(addresses) {
  const addressesContainer = document.getElementById('addresses');
  if (!addressesContainer) return;
  
  // Clear any existing content except the heading
  const heading = addressesContainer.querySelector('h2');
  addressesContainer.innerHTML = '';
  addressesContainer.appendChild(heading);
  
  if (addresses.length === 0) {
    addressesContainer.insertAdjacentHTML('beforeend', `
      <p class="empty-section-message">You haven't added any addresses yet.</p>
    `);
  } else {
    // Display each address
    addresses.forEach(address => {
      const addressHTML = `
        <div class="address-card" data-address-id="${address.id}">
          <div class="address-header">
            <span class="address-title">${address.name}</span>
            <div class="address-actions">
              <a href="#" class="edit-address" data-address-id="${address.id}">Edit</a>
              <a href="#" class="delete-address" data-address-id="${address.id}">Delete</a>
            </div>
          </div>
          <p>${address.street}<br>${address.city}, ${address.state} ${address.postalCode}<br>${address.country}</p>
        </div>
      `;
      
      addressesContainer.insertAdjacentHTML('beforeend', addressHTML);
    });
  }
  
  // Add new address button
  addressesContainer.insertAdjacentHTML('beforeend', `
    <button id="add-address-btn" class="btn-primary">Add New Address</button>
  `);
  
  // Set up event listeners for address management
  setupAddressEventListeners();
}

/**
 * Set up event listeners for address management
 */
function setupAddressEventListeners() {
  // Add address button
  const addAddressBtn = document.getElementById('add-address-btn');
  if (addAddressBtn) {
    addAddressBtn.addEventListener('click', () => {
      // Show address form modal
      // Implement this function if you have a modal for adding addresses
      showAddressModal();
    });
  }
  
  // Edit address links
  const editLinks = document.querySelectorAll('.edit-address');
  editLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const addressId = link.getAttribute('data-address-id');
      // Show address form modal with existing address data
      // Implement this function if you have a modal for editing addresses
      showAddressModal(addressId);
    });
  });
  
  // Delete address links
  const deleteLinks = document.querySelectorAll('.delete-address');
  deleteLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const addressId = link.getAttribute('data-address-id');
      
      // Confirm deletion
      if (confirm('Are you sure you want to delete this address?')) {
        try {
          const currentUser = getCurrentUser();
          if (!currentUser) return;
          
          const result = await removeUserAddress(currentUser.uid, addressId);
          
          if (result.success) {
            // Remove address card from DOM
            const addressCard = document.querySelector(`.address-card[data-address-id="${addressId}"]`);
            if (addressCard) {
              addressCard.remove();
            }
            
            // Refresh addresses if none left
            const remainingAddresses = document.querySelectorAll('.address-card');
            if (remainingAddresses.length === 0) {
              const { profile } = await getUserProfile(currentUser.uid);
              displayUserAddresses(profile.addresses || []);
            }
          } else {
            showError('Failed to delete address. Please try again.');
          }
        } catch (error) {
          console.error('Error deleting address:', error);
          showError('An error occurred while deleting the address. Please try again.');
        }
      }
    });
  });
}

/**
 * Display payment methods
 * 
 * @param {Array} paymentMethods - User payment methods
 */
function displayPaymentMethods(paymentMethods) {
  const paymentsContainer = document.getElementById('payments');
  if (!paymentsContainer) return;
  
  // Clear any existing content except the heading
  const heading = paymentsContainer.querySelector('h2');
  paymentsContainer.innerHTML = '';
  paymentsContainer.appendChild(heading);
  
  if (paymentMethods.length === 0) {
    paymentsContainer.insertAdjacentHTML('beforeend', `
      <p class="empty-section-message">You haven't added any payment methods yet.</p>
    `);
  } else {
    // Display each payment method
    paymentMethods.forEach(payment => {
      const paymentHTML = `
        <div class="payment-card" data-payment-id="${payment.id}">
          <div class="payment-header">
            <span class="payment-title">${payment.type}</span>
            <div class="payment-actions">
              <a href="#" class="delete-payment" data-payment-id="${payment.id}">Delete</a>
            </div>
          </div>
          <p>XXXX XXXX XXXX ${payment.last4}<br>Expiry: ${payment.expiryMonth}/${payment.expiryYear}</p>
        </div>
      `;
      
      paymentsContainer.insertAdjacentHTML('beforeend', paymentHTML);
    });
  }
  
  // Add new payment method button
  paymentsContainer.insertAdjacentHTML('beforeend', `
    <button id="add-payment-btn" class="btn-primary">Add Payment Method</button>
  `);
  
  // Set up event listeners for payment method management
  setupPaymentMethodEventListeners();
}

/**
 * Set up event listeners for payment method management
 */
function setupPaymentMethodEventListeners() {
  // Add payment method button
  const addPaymentBtn = document.getElementById('add-payment-btn');
  if (addPaymentBtn) {
    addPaymentBtn.addEventListener('click', () => {
      // Show payment method form modal
      // Implement this function if you have a modal for adding payment methods
      showPaymentMethodModal();
    });
  }
  
  // Delete payment method links
  const deleteLinks = document.querySelectorAll('.delete-payment');
  deleteLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const paymentId = link.getAttribute('data-payment-id');
      
      // Confirm deletion
      if (confirm('Are you sure you want to delete this payment method?')) {
        try {
          const currentUser = getCurrentUser();
          if (!currentUser) return;
          
          const result = await removePaymentMethod(currentUser.uid, paymentId);
          
          if (result.success) {
            // Remove payment method card from DOM
            const paymentCard = document.querySelector(`.payment-card[data-payment-id="${paymentId}"]`);
            if (paymentCard) {
              paymentCard.remove();
            }
            
            // Refresh payment methods if none left
            const remainingPayments = document.querySelectorAll('.payment-card');
            if (remainingPayments.length === 0) {
              const { profile } = await getUserProfile(currentUser.uid);
              displayPaymentMethods(profile.paymentMethods || []);
            }
          } else {
            showError('Failed to delete payment method. Please try again.');
          }
        } catch (error) {
          console.error('Error deleting payment method:', error);
          showError('An error occurred while deleting the payment method. Please try again.');
        }
      }
    });
  });
}

/**
 * Set up profile navigation tabs
 */
function setupProfileNavigation() {
  const profileNavItems = document.querySelectorAll('.profile-nav-item');
  const profileSections = document.querySelectorAll('.profile-section');
  
  profileNavItems.forEach(item => {
    item.addEventListener('click', function() {
      // Remove active class from all items
      profileNavItems.forEach(navItem => navItem.classList.remove('active'));
      profileSections.forEach(section => section.classList.remove('active'));
      
      // Add active class to clicked item
      this.classList.add('active');
      
      // Show corresponding section
      const targetId = this.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.add('active');
      }
    });
  });
}

/**
 * Set up logout button
 */
function setupLogoutButton() {
  const logoutButton = document.getElementById('logout-button');
  if (!logoutButton) return;
  
  logoutButton.addEventListener('click', async () => {
    try {
      // Sign out from Firebase
      const result = await logoutUser();
      
      if (result.success) {
        // Clear local session data
        clearUserSession();
        
        // Redirect to home page
        window.location.href = 'index.html';
      } else {
        showError('Failed to log out. Please try again.');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      showError('An error occurred during logout. Please try again.');
    }
  });
}

/**
 * Show error message
 * 
 * @param {string} message - Error message
 */
function showError(message) {
  // You can implement a toast or notification system here
  alert(message);
}