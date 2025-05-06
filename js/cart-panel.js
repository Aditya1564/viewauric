/**
 * Cart Panel - Standalone Module
 * Simple, reliable cart panel opening and closing functionality.
 * This is a bare-bones implementation that works independently of other systems.
 * Now includes direct cart panel content clearing functions for full clearing after checkout.
 */

// Execute when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Cart Panel module loaded');
  
  // Create a dedicated global function to clear the cart panel contents
  // This function will completely empty the cart panel without relying on localStorage or Firestore
  window.forceEmptyCartPanel = function() {
    console.log('EMERGENCY CART PANEL CONTENT CLEAR INITIATED');
    
    try {
      // Get all cart panel elements that might need clearing
      const cartItems = document.getElementById('cartItems');
      const cartCount = document.querySelector('.cart-count');
      const cartTotal = document.getElementById('cartTotal');
      const emptyCartMessage = document.querySelector('.empty-cart-message');
      
      // Clear the cart items container completely
      if (cartItems) {
        console.log('Clearing cart items container');
        // Add empty cart message if it doesn't exist
        if (!emptyCartMessage) {
          cartItems.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
        } else {
          // Make sure only the empty message remains
          cartItems.innerHTML = '';
          cartItems.appendChild(emptyCartMessage);
        }
      }
      
      // Hide and reset the cart count badge
      if (cartCount) {
        console.log('Resetting cart count badge');
        cartCount.textContent = '0';
        cartCount.style.display = 'none';
      }
      
      // Reset the cart total to zero
      if (cartTotal) {
        console.log('Resetting cart total');
        cartTotal.textContent = '₹0';
      }
      
      // Force check all checkout buttons and disable if needed
      const checkoutButtons = document.querySelectorAll('.checkout-btn, .proceed-to-checkout');
      checkoutButtons.forEach(btn => {
        btn.classList.add('disabled');
        btn.setAttribute('disabled', 'disabled');
      });
      
      console.log('Cart panel contents cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing cart panel:', error);
      return false;
    }
  };
  
  // Check if on checkout page - if so, simply return
  if (window.location.pathname.includes('checkout.html')) {
    console.log('On checkout page - skipping cart panel initialization');
    
    // Make the cart panel close function globally available
    window.closeCartPanelHandler = function(isInit) {
      console.log('Closing cart panel, isInit:', isInit);
      const cartPanel = document.querySelector('.cart-panel');
      const cartOverlay = document.querySelector('.cart-overlay');
      
      if (cartPanel && cartOverlay) {
        if (isInit) {
          console.log('Setting initial cart panel styles (hidden state)');
          cartPanel.style.right = '-100%';
          cartOverlay.style.display = 'none';
        } else {
          // First remove active classes to trigger CSS transitions
          cartPanel.classList.remove('active');
          cartOverlay.classList.remove('active');
          
          // Apply inline style for right
          cartPanel.style.right = '-100%';
          
          // Hide overlay after transition completes
          setTimeout(() => {
            cartOverlay.style.display = 'none';
          }, 300); // Match this time to CSS transition duration
          
          // Re-enable scrolling
          document.body.style.overflow = '';
        }
      }
    };
    
    return;
  }
  
  // DOM elements
  const cartToggle = document.querySelector('.cart-toggle');
  const cartPanel = document.querySelector('.cart-panel');
  const cartOverlay = document.querySelector('.cart-overlay');
  const closeCartBtn = document.querySelector('.close-cart-btn');
  const continueShopping = document.querySelector('.cart-panel-buttons .view-cart-btn');
  
  // Only initialize if required elements exist
  if (cartToggle && cartPanel && cartOverlay) {
    console.log('Cart panel elements found - initializing standalone functionality');
    
    // Make sure the panel starts closed
    cartPanel.style.right = '-100%';
    cartOverlay.style.display = 'none';
    
    // Open cart panel when cart icon is clicked
    cartToggle.addEventListener('click', function(event) {
      event.preventDefault();
      console.log('Cart toggle clicked - opening panel');
      cartPanel.style.right = '0';
      cartPanel.classList.add('active');
      cartOverlay.style.display = 'block';
      cartOverlay.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    });
    
    // Define a reusable close function to ensure consistent behavior
    function closeCartPanelHandler() {
      console.log('Closing cart panel from standalone handler');
      
      // First remove active classes to trigger CSS transitions
      cartPanel.classList.remove('active');
      cartOverlay.classList.remove('active');
      
      // Apply inline style for right
      cartPanel.style.right = '-100%';
      
      // Hide overlay after transition completes
      setTimeout(() => {
        cartOverlay.style.display = 'none';
      }, 300); // Match this time to CSS transition duration
      
      // Re-enable scrolling
      document.body.style.overflow = '';
      
      // Return focus to the page for accessibility
      document.body.focus();
    }
    
    // Make the function globally available
    window.closeCartPanelHandler = closeCartPanelHandler;
    
    // Close cart panel when X button is clicked
    if (closeCartBtn) {
      closeCartBtn.addEventListener('click', function() {
        console.log('Close button clicked - closing panel');
        closeCartPanelHandler();
      });
    }
    
    // Close cart panel when clicking overlay
    cartOverlay.addEventListener('click', function() {
      console.log('Overlay clicked - closing panel');
      closeCartPanelHandler();
    });
    
    // Close cart panel when Continue Shopping button is clicked
    if (continueShopping) {
      continueShopping.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Continue shopping clicked - closing panel');
        closeCartPanelHandler();
      });
    }
  } else {
    console.error('Cart panel elements not found:', {
      cartToggle: !!cartToggle,
      cartPanel: !!cartPanel,
      cartOverlay: !!cartOverlay
    });
  }
});