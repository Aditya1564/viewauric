/**
 * Direct Cart Implementation
 * This is a simplified standalone cart implementation that 
 * bypasses all other cart systems to ensure functionality
 */

(function() {
  console.log('*** DIRECT CART SYSTEM INITIALIZING ***');

  // Define global cart functions that will override any other implementations
  window.openCartDirectly = function() {
    console.log('DIRECT CART: Opening cart panel');
    
    var cartPanel = document.querySelector('.cart-panel');
    var cartOverlay = document.querySelector('.cart-overlay');
    
    if (!cartPanel || !cartOverlay) {
      console.error('DIRECT CART: Cart elements not found!');
      return;
    }
    
    // Force display with !important styles
    cartPanel.setAttribute('style', 
      'right: 0 !important;' +
      'display: flex !important;' + 
      'visibility: visible !important;' +
      'z-index: 999999 !important;' +
      'opacity: 1 !important;' +
      'transform: none !important;' +
      'pointer-events: auto !important;'
    );
    cartPanel.classList.add('active');
    
    // Show overlay
    cartOverlay.setAttribute('style',
      'display: block !important;' +
      'visibility: visible !important;' +
      'z-index: 999998 !important;' +
      'opacity: 1 !important;'
    );
    cartOverlay.classList.add('active');
    
    // Prevent scrolling
    document.body.style.overflow = 'hidden';
    
    console.log('DIRECT CART: Cart opened successfully');
  };
  
  window.closeCartDirectly = function() {
    console.log('DIRECT CART: Closing cart panel');
    
    var cartPanel = document.querySelector('.cart-panel');
    var cartOverlay = document.querySelector('.cart-overlay');
    
    if (cartPanel) {
      cartPanel.setAttribute('style', 
        'right: -400px !important;' +
        'visibility: hidden !important;'
      );
      cartPanel.classList.remove('active');
    }
    
    if (cartOverlay) {
      cartOverlay.setAttribute('style',
        'display: none !important;' +
        'visibility: hidden !important;'
      );
      cartOverlay.classList.remove('active');
    }
    
    // Restore scrolling
    document.body.style.overflow = '';
    
    console.log('DIRECT CART: Cart closed successfully');
  };
  
  // Ensure our functions are used everywhere
  window.openCart = window.openCartDirectly;
  window.closeCart = window.closeCartDirectly;
  
  // Function to add event listeners
  function setupDirectCartListeners() {
    console.log('DIRECT CART: Setting up event listeners');
    
    // Cart open buttons
    var cartButtons = document.querySelectorAll(
      '.cart-toggle, .cart-icon-container, #cartToggleButton, .mobile-cart-toggle'
    );
    
    cartButtons.forEach(function(button) {
      // Remove existing listeners
      var newButton = button.cloneNode(true);
      if (button.parentNode) {
        button.parentNode.replaceChild(newButton, button);
      }
      
      // Add our direct listener
      newButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('DIRECT CART: Cart button clicked');
        window.openCartDirectly();
        return false;
      });
    });
    
    // Cart close button
    var closeButtons = document.querySelectorAll('.close-cart-btn');
    closeButtons.forEach(function(button) {
      // Remove existing listeners
      var newButton = button.cloneNode(true);
      if (button.parentNode) {
        button.parentNode.replaceChild(newButton, button);
      }
      
      // Add our direct listener
      newButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('DIRECT CART: Close button clicked');
        window.closeCartDirectly();
        return false;
      });
    });
    
    // Cart overlay
    var overlay = document.querySelector('.cart-overlay');
    if (overlay) {
      // Remove existing listeners
      var newOverlay = overlay.cloneNode(true);
      if (overlay.parentNode) {
        overlay.parentNode.replaceChild(newOverlay, overlay);
      }
      
      // Add our direct listener
      newOverlay.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('DIRECT CART: Overlay clicked');
        window.closeCartDirectly();
        return false;
      });
    }
    
    console.log('DIRECT CART: Event listeners set up successfully');
  }
  
  // Set up immediately and on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDirectCartListeners);
  } else {
    setupDirectCartListeners();
  }
  
  // Run again after window load
  window.addEventListener('load', setupDirectCartListeners);
  
  // Run setup now
  setupDirectCartListeners();
  
  console.log('*** DIRECT CART SYSTEM INITIALIZED ***');
})();