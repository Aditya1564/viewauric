/**
 * Cart Panel - Standalone Module
 * Simple, reliable cart panel opening and closing functionality.
 * This is a bare-bones implementation that works independently of other systems.
 */

// Execute when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Cart Panel module loaded');
  
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