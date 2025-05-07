/**
 * Auric Cart System
 * Implements cart functionality with localStorage for anonymous users and Firebase Firestore for authenticated users.
 * 
 * Features:
 * - Add items to cart (both anonymous and authenticated)
 * - Remove items from cart
 * - Update item quantities
 * - Sync localStorage cart to Firestore when user logs in
 * - Sliding cart panel for easier access
 * - Display cart items and totals
 * - Persistent cart across page loads and sessions
 * - Clear cart only after successful order completion
 */

// Initialize the forced cart clear needed flag
// This flag is used across the entire site to coordinate cart clearing
// It should only be set to true when an order is successfully completed
if (typeof window.FORCE_CART_CLEAR_NEEDED === 'undefined') {
  window.FORCE_CART_CLEAR_NEEDED = false;
  console.log('Flag check: Preserving cart data across page reloads');
}

// For development/testing - Debug function to reset the cart completely
// Cart debugging functions
window.cartDebug = {
  // Reset the cart completely - ENHANCED to work with checkout
  resetCart: function() {
    // First set emergency flags to prevent race conditions
    localStorage.setItem('cartEmergencyCleared', 'true');
    localStorage.setItem('cartEmergencyClearTime', Date.now().toString());
    localStorage.setItem('pendingCartClear', 'true');
    
    // Clear all localStorage cart data
    localStorage.removeItem('auricCart');
    localStorage.removeItem('auricCartItems');
    localStorage.removeItem('cartItems');
    localStorage.removeItem('cart');
    localStorage.removeItem('checkout-cart');
    console.log('Cart has been reset in localStorage.');
    
    // If user is logged in, also clear Firestore cart
    if (firebase.auth().currentUser) {
      const userId = firebase.auth().currentUser.uid;
      firebase.firestore().collection('carts').doc(userId).set({
        items: [],
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        operation: 'clear',
        version: Date.now().toString(),
        deviceId: localStorage.getItem('auricCartDeviceId') || `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        clearTimestamp: Date.now(),
        emergencyClear: true
      })
      .then(() => {
        console.log('Cart has been reset in Firestore.');
        console.log('Page will reload now.');
        
        // Direct DOM manipulation to ensure UI is updated
        try {
          const elements = [
            { selector: '#cartItems', action: 'innerHTML', value: '<p class="empty-cart-message">Your cart is empty</p>' },
            { selector: '#sliding-cart-items', action: 'innerHTML', value: '<p class="empty-cart-message">Your cart is empty</p>' },
            { selector: '.cart-count', action: 'textContent', value: '0' },
            { selector: '.cart-count', action: 'style.display', value: 'none' },
            { selector: '.subtotal-amount', action: 'textContent', value: '₹0.00' },
            { selector: '#cartTotal', action: 'textContent', value: '₹0' }
          ];
          
          elements.forEach(function(item) {
            try {
              var el = document.querySelector(item.selector);
              if (el) {
                if (item.action === 'innerHTML') {
                  el.innerHTML = item.value;
                } else if (item.action === 'textContent') {
                  el.textContent = item.value;
                } else if (item.action === 'style.display') {
                  el.style.display = item.value;
                }
                console.log('Successfully cleared ' + item.selector);
              }
            } catch(err) {
              console.error('Error clearing ' + item.selector + ': ' + err.message);
            }
          });
        } catch (e) {
          console.error('Error updating UI after cart reset:', e);
        }
        
        setTimeout(() => window.location.reload(), 500);
      })
      .catch(error => {
        console.error('Error resetting Firestore cart:', error);
        window.location.reload();
      });
    } else {
      setTimeout(() => window.location.reload(), 500);
    }
  },
  
  // Add a test item to the cart manually
  addTestItem: function() {
    const testItem = {
      productId: "TEST-ITEM",
      name: "Test Product",
      price: 1999,
      image: "/images/product-category/IMG_20250504_150241.jpg",
      quantity: 1
    };
    
    // Get current cart
    let cart = [];
    const savedCart = localStorage.getItem('auricCart');
    if (savedCart) {
      try {
        cart = JSON.parse(savedCart);
      } catch (e) {
        console.error("Error parsing cart:", e);
        cart = [];
      }
    }
    
    // Add the test item
    cart.push(testItem);
    
    // Save back to localStorage
    localStorage.setItem('auricCart', JSON.stringify(cart));
    
    console.log("Test item added to cart. Page will reload.");
    setTimeout(() => window.location.reload(), 500);
  },
  
  // Show the current cart in console
  showCart: function() {
    console.group("Current Cart Contents");
    
    // Show localStorage cart
    const savedCart = localStorage.getItem('auricCart');
    if (savedCart) {
      try {
        const localCart = JSON.parse(savedCart);
        console.log("LocalStorage Cart:", localCart);
      } catch (e) {
        console.error("Error parsing localStorage cart:", e);
      }
    } else {
      console.log("LocalStorage cart is empty.");
    }
    
    // Show Firestore cart if logged in
    if (firebase.auth().currentUser) {
      const userId = firebase.auth().currentUser.uid;
      firebase.firestore().collection('carts').doc(userId).get()
        .then(doc => {
          if (doc.exists && doc.data().items) {
            console.log("Firestore Cart:", doc.data().items);
          } else {
            console.log("Firestore cart is empty.");
          }
        })
        .catch(error => {
          console.error("Error getting Firestore cart:", error);
        });
    } else {
      console.log("User not logged in - no Firestore cart.");
    }
    
    console.groupEnd();
  }
};

// COMPLETELY REWRITTEN AGAIN for even more robust deletion handling
window.cartDebug.forceSyncWithServer = function() {
  if (firebase.auth().currentUser) {
    const userId = firebase.auth().currentUser.uid;
    console.log("Forcing synchronization with server for user:", userId);
    
    // Show user feedback
    const notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 5px; z-index: 10000; transition: opacity 0.3s;';
    notification.textContent = 'Syncing cart with server...';
    document.body.appendChild(notification);
    
    // Force a load from Firestore with retry
    const maxRetries = 3;
    let retryCount = 0;
    
    // Special function that ALWAYS syncs bidirectionally
    const syncBidirectional = async () => {
      try {
        // Step 1: Get the latest server state
        const doc = await db.collection('carts').doc(userId).get();
        
        // If we have deleted items recently, we need to ensure the server reflects that
        const storedDeletedItems = localStorage.getItem('auricCartDeletedItems');
        let hasRecentDeletions = false;
        let recentlyDeletedItems = [];
        
        if (storedDeletedItems) {
          try {
            const deletedItems = JSON.parse(storedDeletedItems);
            // Check if any deletions have happened in the last 10 minutes
            const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
            recentlyDeletedItems = deletedItems.filter(item => item.timestamp > tenMinutesAgo);
            hasRecentDeletions = recentlyDeletedItems.length > 0;
            
            if (hasRecentDeletions) {
              console.log(`Recent deletions detected (${recentlyDeletedItems.length} items)`);
              notification.textContent = 'Syncing deleted items...';
            }
          } catch (e) {
            console.error('Error parsing deleted items:', e);
          }
        }
        
        // Step 2: Get server items if available
        let serverItems = [];
        if (doc.exists && doc.data().items) {
          serverItems = doc.data().items;
          console.log('Retrieved server cart with', serverItems.length, 'items');
        }
        
        // Step 3: First, update our local state with server items
        // BUT only if we don't have recent deletions (to avoid restoring deleted items)
        if (!hasRecentDeletions && serverItems.length > 0) {
          // Check if server has more items than we do or newer timestamp
          const serverCartVersion = doc.exists ? doc.data().cartVersion || '0' : '0';
          const localCartVersion = localStorage.getItem('auricCartVersion') || '0';
          
          if (parseInt(serverCartVersion) > parseInt(localCartVersion)) {
            console.log('Server has newer cart version, updating local cart');
            window.AuricCart.items = serverItems;
            localStorage.setItem('auricCartVersion', serverCartVersion);
            window.AuricCart.saveCartToLocalStorage();
          }
        } 
        // Step 4: If we have deleted items, filter them out from our cart
        else if (hasRecentDeletions) {
          console.log('Processing deleted items', recentlyDeletedItems);
          
          // Get deleted product IDs
          const deletedProductIds = recentlyDeletedItems.map(item => item.productId);
          
          // Filter out deleted items from our cart (if they somehow got restored)
          window.AuricCart.items = window.AuricCart.items.filter(item => 
            !deletedProductIds.includes(item.productId)
          );
          
          // Set delete operation flag
          window.AuricCart.lastOperation = 'delete';
          
          // Save to localStorage
          window.AuricCart.saveCartToLocalStorage();
        }
        
        // Step 5: Push our current state to server, overwriting whatever was there
        // This is crucial for deletion sync
        console.log('Pushing final cart state to server with', window.AuricCart.items.length, 'items');
        window.AuricCart.showSyncStatus('Pushing changes to server...');
        
        await window.AuricCart.saveCartToFirestore(userId);
        
        // Step 6: Update UI and show success
        window.AuricCart.updateCartUI();
        window.AuricCart.renderCartItems();
        
        notification.textContent = 'Cart synchronized successfully!';
        notification.style.background = 'rgba(0,128,0,0.8)';
        
        // Clear deleted items tracking after a successful sync
        if (hasRecentDeletions) {
          localStorage.removeItem('auricCartDeletedItems');
        }
        
        // Fade out notification
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => {
            notification.remove();
          }, 500);
        }, 3000);
        
        console.log("Bidirectional sync complete. Cart has", window.AuricCart.items.length, "items.");
        
      } catch (error) {
        console.error("Error during bidirectional sync:", error);
        
        // Retry logic with exponential backoff
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
          
          notification.textContent = `Sync attempt ${retryCount} failed. Retrying in ${delay/1000}s...`;
          
          console.log(`Retrying sync in ${delay}ms (attempt ${retryCount} of ${maxRetries})`);
          setTimeout(() => syncBidirectional(), delay);
        } else {
          console.error("Failed to sync after", maxRetries, "attempts");
          
          // Show error notification
          notification.textContent = 'Could not sync with server. Please try again later.';
          notification.style.background = 'rgba(220,0,0,0.8)';
          
          // Fade out notification
          setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
              notification.remove();
            }, 500);
          }, 5000);
        }
      }
    };
    
    // Start the bidirectional sync process
    syncBidirectional();
    
  } else {
    console.log("User not logged in, cannot force server sync");
    alert("You must be logged in to sync your cart between devices.");
  }
};

// Legacy function for backward compatibility
window.resetCart = window.cartDebug.resetCart;

// Direct minimal cart panel functionality - as a global fallback
function setupDirectCartToggle() {
  console.log('Setting up direct cart toggle as additional failsafe');
  
  // Skip if on checkout page
  if (window.location.pathname.includes('checkout.html')) {
    console.log("On checkout page - skipping direct cart toggle setup");
    return;
  }
  
  // Find elements needed for basic cart panel operation
  const cartToggle = document.querySelector('.cart-toggle');
  const cartPanel = document.querySelector('.cart-panel');
  const cartOverlay = document.querySelector('.cart-overlay');
  const closeCartBtn = document.querySelector('.close-cart-btn');
  const continueShopping = document.querySelector('.cart-panel-buttons .view-cart-btn');
  
  if (cartToggle && cartPanel && cartOverlay) {
    // Handle opening the cart panel
    cartToggle.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Direct cart toggle clicked');
      
      // Show panel and overlay
      cartPanel.style.right = '0';
      cartPanel.classList.add('active');
      cartOverlay.style.display = 'block';
      cartOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    
    // Handle closing via close button
    if (closeCartBtn) {
      closeCartBtn.addEventListener('click', function() {
        cartPanel.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    }
    
    // Handle closing via overlay
    cartOverlay.addEventListener('click', function() {
      cartPanel.classList.remove('active');
      cartOverlay.classList.remove('active');
      document.body.style.overflow = '';
    });
    
    // Handle continue shopping button
    if (continueShopping) {
      continueShopping.addEventListener('click', function(e) {
        e.preventDefault();
        cartPanel.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    }
  } else {
    console.error('Direct cart toggle setup failed - missing elements');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded - Initializing Cart System');
  
  // Set up direct cart toggle as a fallback
  setTimeout(() => {
    setupDirectCartToggle();
  }, 500);
  
  // Cart namespace to avoid global scope pollution
  const AuricCart = {
    // Cart state
    items: [],
    
    // We'll select DOM elements at initialization time to ensure they're loaded
    cartCountElement: null,
    cartTotalElement: null,
    slidingCartItemsContainer: null,
    addToCartButtons: null,
    cartPanel: null,
    cartOverlay: null,
    cartToggle: null,
    closeCartBtn: null,
    
    // Initialize DOM element references
    initDomElements: function() {
      this.cartCountElement = document.querySelector('.cart-count');
      this.cartTotalElement = document.querySelector('.subtotal-amount');
      this.slidingCartItemsContainer = document.getElementById('sliding-cart-items');
      this.addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
      this.cartPanel = document.querySelector('.cart-panel');
      this.cartOverlay = document.querySelector('.cart-overlay');
      this.cartToggle = document.querySelector('.cart-toggle');
      this.closeCartBtn = document.querySelector('.close-cart-btn');
      
      console.log('DOM elements initialized:', {
        cartToggle: !!this.cartToggle,
        cartPanel: !!this.cartPanel,
        cartOverlay: !!this.cartOverlay,
        closeCartBtn: !!this.closeCartBtn
      });
    },
    
    /**
     * Initialize the cart system
     */
    init: function() {
      // Initialize DOM elements references
      this.initDomElements();
      
      // Get cart from localStorage or Firebase based on authentication status
      this.loadCart();
      
      // Ensure cart panel is closed at initialization
      this.closeCartPanel(true); // Pass true to skip animation
      
      // Update cart UI
      this.updateCartUI();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Setup sliding cart panel
      this.setupCartPanel();
      
      // Setup auth state change listener for syncing
      this.setupAuthListener();
      
      console.log('Cart system initialized');
      
      // Direct attachment of click event to cart toggle (fallback method)
      // Skip this on checkout page
      if (!window.location.pathname.includes('checkout.html')) {
        const cartToggleElement = document.querySelector('.cart-toggle');
        if (cartToggleElement) {
          console.log('Adding direct click event to cart toggle as fallback');
          cartToggleElement.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Cart toggle clicked (direct), opening panel');
            this.openCartPanel();
          });
        }
      }
    },
    
    /**
     * Setup sliding cart panel functionality
     */
    setupCartPanel: function() {
      // Skip this on checkout page
      if (window.location.pathname.includes('checkout.html')) {
        console.log('On checkout page - skipping cart panel initialization');
        return;
      }
      
      console.log('Setting up cart panel with elements:', {
        cartToggle: this.cartToggle,
        closeCartBtn: this.closeCartBtn,
        cartOverlay: this.cartOverlay,
        cartPanel: this.cartPanel
      });
      
      // Toggle cart panel when clicking cart icon
      if (this.cartToggle) {
        console.log('Adding click event listener to cart toggle');
        this.cartToggle.addEventListener('click', (e) => {
          e.preventDefault();
          console.log('Cart toggle clicked, opening panel');
          this.openCartPanel();
        });
      } else {
        console.error('Cart toggle element not found');
      }
      
      // Close cart when clicking close button
      if (this.closeCartBtn) {
        this.closeCartBtn.addEventListener('click', () => {
          this.closeCartPanel();
        });
      }
      
      // Close cart when clicking overlay
      if (this.cartOverlay) {
        this.cartOverlay.addEventListener('click', () => {
          this.closeCartPanel();
        });
      }
      
      // Setup Continue Shopping button
      const continueShopping = document.querySelector('.cart-panel-buttons .view-cart-btn');
      if (continueShopping) {
        continueShopping.addEventListener('click', (e) => {
          e.preventDefault();
          this.closeCartPanel();
        });
      }
      
      // Checkout functionality - redirects to checkout page with auth check
      const checkoutButton = document.querySelector('.cart-panel-buttons .checkout-btn');
      if (checkoutButton) {
        checkoutButton.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Check if cart has items
          if (this.items.length === 0) {
            alert('Your cart is empty. Please add items before proceeding to checkout.');
            return;
          }
          
          // Check if user is authenticated before proceeding to checkout
          const isLoggedIn = this.checkUserIsAuthenticated();
          
          // Save current cart to localStorage to ensure it's available on checkout page
          this.saveCartToLocalStorage();
          
          // If logged in, proceed to checkout, otherwise redirect to signup
          if (isLoggedIn) {
            // Set a session flag that checkout was triggered while authenticated
            localStorage.setItem('checkoutAuthState', 'authenticated');
            window.location.href = 'checkout.html';
          } else {
            // Inform user they need to create an account first
            const confirmLogin = confirm('You need to create an account before checking out. Would you like to create an account now?');
            if (confirmLogin) {
              localStorage.setItem('redirectAfterAuth', 'checkout.html');
              window.location.href = 'signup.html';
            }
          }
        });
      }
      
      // Helper method to check if user is authenticated
      this.checkUserIsAuthenticated = function() {
        // Check for Firebase auth
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
          return true;
        }
        
        // Check localStorage flags
        const localUser = localStorage.getItem('currentUser');
        const userLoggedIn = localStorage.getItem('userLoggedIn');
        const userEmailInStorage = localStorage.getItem('userEmail');
        
        if ((localUser && localUser !== 'null') || 
            userLoggedIn === 'true' || 
            (userEmailInStorage && userEmailInStorage !== 'null')) {
          return true;
        }
        
        // Check for any Firebase auth in localStorage
        const firebaseAuthKey = 'firebase:authUser:';
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(firebaseAuthKey)) {
              const value = localStorage.getItem(key);
              const userData = JSON.parse(value);
              if (userData && userData.email) {
                return true;
              }
            }
          }
        } catch (e) {
          console.error('Error checking Firebase auth in localStorage:', e);
        }
        
        return false;
      };
    },
    
    /**
     * Open the sliding cart panel
     */
    openCartPanel: function() {
      console.log('Opening cart panel...');
      
      // Re-fetch elements in case they were not available at initialization
      const panel = this.cartPanel || document.querySelector('.cart-panel');
      const overlay = this.cartOverlay || document.querySelector('.cart-overlay');
      
      if (panel && overlay) {
        console.log('Cart panel elements found, setting active state');
        
        // Remove any inline styles that might interfere
        panel.style.right = '';
        overlay.style.display = '';
        
        // Add active classes
        panel.classList.add('active');
        overlay.classList.add('active');
        
        // Prevent scrolling
        document.body.style.overflow = 'hidden';
        
        // Re-render cart items
        this.renderCartItems();
      } else {
        console.error('Cannot open cart panel - elements not found:', {
          panel: !!panel,
          overlay: !!overlay
        });
      }
    },
    
    /**
     * Close the sliding cart panel
     * @param {boolean} isInit - Whether this is being called during initialization
     */
    closeCartPanel: function(isInit) {
      console.log('Closing cart panel, isInit:', isInit);
      
      // Re-fetch elements in case they were not available at initialization
      const panel = this.cartPanel || document.querySelector('.cart-panel');
      const overlay = this.cartOverlay || document.querySelector('.cart-overlay');
      
      if (panel && overlay) {
        // First remove active classes to trigger CSS transitions
        panel.classList.remove('active');
        overlay.classList.remove('active');
        
        // Set explicit styles - always set these for better reliability
        if (isInit) {
          console.log('Setting initial cart panel styles (hidden state)');
          panel.style.right = '-100%';
          overlay.style.display = 'none';
        } else {
          // For normal closing, add inline styles to ensure proper closing
          panel.style.right = '-100%';
          
          // Hide overlay after transition finishes
          setTimeout(() => {
            overlay.style.display = 'none';
          }, 300); // Match this time to CSS transition duration
        }
        
        // Re-enable scrolling
        document.body.style.overflow = '';
      } else {
        console.error('Cannot close cart panel - elements not found:', {
          panel: !!panel,
          overlay: !!overlay
        });
      }
    },
    
    /**
     * Load cart items from localStorage or Firestore based on authentication status
     */
    loadCart: function() {
      // Check if auth is defined, and load cart accordingly
      if (typeof auth !== 'undefined' && auth) {
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          // User is logged in, load from Firestore
          this.loadCartFromFirestore(currentUser.uid);
          return;
        }
      } 
      
      // User is anonymous or auth is not available, load from localStorage
      console.log('User is not authenticated');
      this.loadCartFromLocalStorage();
    },
    
    /**
     * Load cart from localStorage for anonymous users
     */
    loadCartFromLocalStorage: function() {
      // Check multiple localStorage keys for cart data
      let savedCart = localStorage.getItem('auricCartItems'); // Try checkout key first
      
      // If not found in auricCartItems, try auricCart
      if (!savedCart) {
        savedCart = localStorage.getItem('auricCart');
      }
      
      if (savedCart) {
        try {
          let loadedItems = JSON.parse(savedCart);
          
          // Ensure all items have valid quantity values
          loadedItems = loadedItems.map(item => {
            // Force quantity to be 1 if it's invalid or not provided
            if (!item.quantity || isNaN(item.quantity) || item.quantity < 1) {
              item.quantity = 1;
            }
            return item;
          });
          
          this.items = loadedItems;
          
          // Save to both localStorage keys for consistency
          localStorage.setItem('auricCart', JSON.stringify(this.items));
          localStorage.setItem('auricCartItems', JSON.stringify(this.items));
          
          console.log('Cart loaded from localStorage:', this.items);
        } catch (error) {
          console.error('Error parsing cart from localStorage:', error);
          this.items = [];
        }
      } else {
        this.items = [];
        
        // For testing, remove this in production
        // localStorage.setItem('auricCart', JSON.stringify([]));
      }
    },
    
    /**
     * Load cart from Firestore for authenticated users - COMPLETELY REVISED
     * Always treats Firestore as the source of truth
     * Now with emergency cart clearing protection
     */
    loadCartFromFirestore: function(userId) {
      // SIMPLIFICATION: Only check for orderCompleted flag
      // No need for complex window flags
      const orderCompleted = localStorage.getItem('orderCompleted') === 'true';
      
      if (orderCompleted) {
        console.log('Order was completed - clearing cart');
        
        // Clear our cart
        this.items = [];
        
        // Clear localStorage
        localStorage.removeItem('auricCart');
        localStorage.removeItem('auricCartItems');
        localStorage.setItem('auricCart', JSON.stringify([]));
        
        // Cancel the loading process
        this.isLoadingFromFirestore = false;
        
        // Update the UI to show empty cart
        this.updateCartUI();
        this.renderCartItems();
        
        return false;
      }
      
      console.log('Loading cart from Firestore');
      
      // Set a loading flag to prevent race conditions
      this.isLoadingFromFirestore = true;
      
      // Use Firestore as the source of truth when user is logged in
      db.collection('carts').doc(userId).get()
        .then((doc) => {
          // Double-check order completion flag in case it changed
          if (localStorage.getItem('orderCompleted') === 'true') {
            console.log('Order was completed - clearing cart');
            this.items = [];
            this.isLoadingFromFirestore = false;
            this.updateCartUI();
            this.renderCartItems();
            return;
          }
          
          if (doc.exists && doc.data().items) {
            // Get items from Firestore
            const firestoreItems = doc.data().items;
            console.log('Firestore cart items loaded:', firestoreItems.length);
            
            // Ensure all items have valid quantity values
            const validatedItems = firestoreItems.map(item => {
              // Force quantity to be 1 if it's invalid or not provided
              if (!item.quantity || isNaN(item.quantity) || item.quantity < 1) {
                console.log('Fixed invalid quantity for item:', item.name);
                item.quantity = 1;
              }
              return item;
            });
            
            // Update our cart with Firestore data
            this.items = validatedItems;
            
            // Save to localStorage as backup with Firestore timestamp
            const firestoreTimestamp = doc.data().updatedAt ? doc.data().updatedAt.toMillis() : Date.now();
            localStorage.setItem('auricCart', JSON.stringify(this.items));
            localStorage.setItem('auricCartItems', JSON.stringify(this.items)); // Save to both keys
            localStorage.setItem('auricCartTimestamp', firestoreTimestamp.toString());
            localStorage.setItem('auricCartLastSync', Date.now().toString());
            
            console.log('Cart loaded from Firestore and saved to localStorage');
          } else {
            console.log('No cart found in Firestore, checking localStorage');
            
            // Try to use localStorage cart if Firestore cart doesn't exist
            const savedCart = localStorage.getItem('auricCart');
            if (savedCart) {
              try {
                const localItems = JSON.parse(savedCart);
                if (localItems.length > 0) {
                  console.log('Using localStorage cart and saving to Firestore');
                  this.items = localItems;
                  
                  // Save to Firestore immediately for sync
                  this.saveCartToFirestore(userId);
                } else {
                  console.log('Empty cart in localStorage');
                  this.items = [];
                }
              } catch (e) {
                console.error('Error parsing localStorage cart:', e);
                this.items = [];
              }
            } else {
              console.log('No cart found in Firestore or localStorage');
              this.items = [];
              
              // Create empty cart in Firestore
              this.saveCartToFirestore(userId);
            }
          }
          
          // Update UI with whatever cart we've loaded
          this.updateCartUI();
          
          // Clear loading flag
          this.isLoadingFromFirestore = false;
        })
        .catch((error) => {
          console.error('Error loading cart from Firestore:', error);
          
          // Fallback to localStorage only if Firestore fails
          this.loadCartFromLocalStorage();
          this.updateCartUI();
          
          // Set flag to try again later when online
          this.pendingFirestoreSync = true;
          
          // Set up listener for when we're back online
          window.addEventListener('online', () => {
            if (this.pendingFirestoreSync && auth.currentUser) {
              console.log('Back online, retrying Firestore cart load');
              this.loadCartFromFirestore(auth.currentUser.uid);
            }
          }, { once: true });
          
          // Clear loading flag
          this.isLoadingFromFirestore = false;
        });
    },
    
    /**
     * Save cart to localStorage for anonymous users
     */
    saveCartToLocalStorage: function() {
      // Save cart items to both storage keys for consistent access
      localStorage.setItem('auricCart', JSON.stringify(this.items));
      localStorage.setItem('auricCartItems', JSON.stringify(this.items));
      
      // Save current timestamp for synchronization comparisons
      const currentTime = new Date().getTime();
      localStorage.setItem('auricCartTimestamp', currentTime.toString());
      
      console.log('Cart saved to localStorage:', this.items);
    },
    
    /**
     * Save cart to Firestore for authenticated users
     * Enhanced with better error handling and offline support
     * COMPLETELY REVISED: Now using reset & replace approach for more reliable sync
     * @returns {Promise} A promise that resolves when the save operation is complete
     */
    saveCartToFirestore: function(userId) {
      if (!userId) {
        console.error('Cannot save to Firestore: No user ID provided');
        return Promise.reject(new Error('No user ID provided'));
      }
      
      // SIMPLIFICATION: ONLY check for actual order completion
      // No more complex flags - just check if an order was completed
      const orderCompleted = localStorage.getItem('orderCompleted') === 'true';
      
      // CRITICAL: Only clear cart if an order was actually completed
      if (orderCompleted) {
        console.log('EMERGENCY DETECTED: Using forced empty cart in saveCartToFirestore');
        console.log('Order completed - clearing cart');
        
        // Set flag to prevent our own writes from triggering a sync loop
        this.isUpdatingFirestore = true;
        
        // Create special emergency device ID to track the emergency clear
        this.deviceId = 'emergency_clear_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('auricCartDeviceId', this.deviceId);
        
        // Write an empty cart to Firestore with special emergency flags
        return db.collection('carts').doc(userId).set({
          items: [],
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastOperation: 'emergency_clear',
          operationTimestamp: Date.now(),
          lastSyncedDevice: navigator.userAgent,
          deviceId: this.deviceId,
          lastSyncedAt: new Date().toISOString(),
          cartVersion: Date.now().toString(),
          itemCount: 0,
          emergencyClear: true,
          emergencyClearTime: Date.now(),
          emergencyClearReason: 'order_completed'
        }, { merge: false })
        .then(() => {
          console.log('EMERGENCY CLEAR: Empty cart saved to Firestore successfully');
          
          // Clear updating flag after a short delay
          setTimeout(() => {
            this.isUpdatingFirestore = false;
          }, 500);
          
          return Promise.resolve();
        })
        .catch((error) => {
          console.error('Error saving empty cart to Firestore during emergency clear:', error);
          this.isUpdatingFirestore = false;
          return Promise.reject(error);
        });
      }
      
      console.log('Attempting to save cart to Firestore for user:', userId);
      
      // First, ensure we are saving to localStorage as backup
      this.saveCartToLocalStorage();
      
      // Check if the network is online
      if (!navigator.onLine) {
        console.warn('Browser is offline, cart saved to localStorage only');
        // Set a flag to sync when back online
        this.pendingFirestoreSync = true;
        return Promise.reject(new Error('Browser is offline'));
      }
      
      // Set flag to prevent our own writes from triggering a sync loop
      this.isUpdatingFirestore = true;
      
      // Get or create a device ID for this device
      const deviceId = this.deviceId || localStorage.getItem('auricCartDeviceId');
      if (!this.deviceId && deviceId) {
        this.deviceId = deviceId;
      } else if (!deviceId) {
        this.deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('auricCartDeviceId', this.deviceId);
      }
      
      // Create a cart version based on timestamp for conflict resolution
      const cartVersion = Date.now().toString();
      localStorage.setItem('auricCartVersion', cartVersion);
      
      // Instead of updating the Firestore document, we'll COMPLETELY REPLACE it
      // This ensures deletion operations are properly synced across devices
      return db.collection('carts').doc(userId).set({
        items: this.items,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastOperation: this.lastOperation || 'update', // Track what kind of operation was last performed
        operationTimestamp: Date.now(),
        lastSyncedDevice: navigator.userAgent, // Track which device made the last update
        deviceId: this.deviceId, // Include device ID for better tracking
        lastSyncedAt: new Date().toISOString(),
        cartVersion: cartVersion, // Use a timestamp as version
        itemCount: this.items.length // Quick access to item count
      }, { merge: false }) // Don't merge, completely replace
      .then(() => {
        console.log('Cart saved to Firestore successfully (complete replacement)');
        // Clear any pending sync flag
        this.pendingFirestoreSync = false;
        
        // Update the local last sync time
        localStorage.setItem('auricCartLastSync', Date.now().toString());
        
        // Clear updating flag after a short delay to ensure the snapshot has time to fire
        setTimeout(() => {
          this.isUpdatingFirestore = false;
          this.lastOperation = null; // Reset the operation tracker
        }, 500);
        
        return Promise.resolve();
      })
      .catch((error) => {
        console.error('Error saving cart to Firestore:', error);
        
        // Set a flag to retry syncing later
        this.pendingFirestoreSync = true;
        
        // Clear updating flag
        this.isUpdatingFirestore = false;
        
        // Check if we need to set up a listener for when we're back online
        if (error.code === 'unavailable' || error.code === 'failed-precondition') {
          console.log('Setting up online listener to retry saving cart');
          
          // Set up one-time event listener for when we're back online
          window.addEventListener('online', () => {
            if (this.pendingFirestoreSync) {
              console.log('Back online, retrying Firestore cart save');
              this.saveCartToFirestore(userId);
            }
          }, { once: true });
        }
        
        return Promise.reject(error);
      });
    },
    
    /**
     * Sync localStorage cart with Firestore when user logs in
     * Enhanced with better error handling and retry logic
     */
    syncCartOnLogin: function(userId) {
      console.log('Syncing cart for user:', userId);
      
      // Set up retry mechanism
      const maxRetries = 3;
      let retryCount = 0;
      
      const attemptSync = () => {
        console.log(`Attempt ${retryCount + 1} to sync cart with Firestore`);
        
        // First, we always load the localStorage cart as a fallback
        const localStorageCart = localStorage.getItem('auricCart');
        let localItems = [];
        if (localStorageCart) {
          try {
            localItems = JSON.parse(localStorageCart);
            console.log('Local cart items loaded:', localItems.length);
          } catch (error) {
            console.error('Error parsing cart from localStorage:', error);
          }
        }
        
        // Set the items from localStorage first so we have something to show immediately
        if (localItems.length > 0 && this.items.length === 0) {
          this.items = [...localItems];
          this.updateCartUI();
        }
        
        // Then try to get the cart from Firestore
        db.collection('carts').doc(userId).get()
          .then((doc) => {
            let firestoreItems = [];
            if (doc.exists && doc.data().items) {
              firestoreItems = doc.data().items;
              console.log('Firestore cart items loaded:', firestoreItems.length);
            }
            
            // Merge the carts (giving priority to Firestore for duplicates)
            // This ensures we don't lose items if the connection is intermittent
            const mergedItems = this.mergeCarts(localItems, firestoreItems);
            
            // Update the cart with merged items
            this.items = mergedItems;
            
            // Only save back to Firestore if we have items to save
            if (mergedItems.length > 0) {
              // Save the merged cart to Firestore
              this.saveCartToFirestore(userId);
            }
            
            // Update the UI
            this.updateCartUI();
            
            console.log('Cart synced successfully after login');
          })
          .catch((error) => {
            console.error('Error syncing cart on login:', error);
            
            // If we encounter a network error, retry with exponential backoff
            if (error.code === 'unavailable' && retryCount < maxRetries) {
              retryCount++;
              const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
              console.log(`Will retry in ${delay}ms (attempt ${retryCount} of ${maxRetries})`);
              
              setTimeout(attemptSync, delay);
            } else {
              // If we've exhausted retries or it's not a network error, use localStorage as fallback
              console.log('Using localStorage cart as fallback due to Firestore error');
              this.items = [...localItems];
              this.updateCartUI();
              
              // Set a flag to retry syncing when the page is next interacted with
              this.pendingSync = true;
            }
          });
      };
      
      // Start the sync process
      attemptSync();
    },
    
    /**
     * Merge two carts, giving priority to the second cart for duplicates
     * With validation to ensure quantity is always at least 1
     */
    mergeCarts: function(cart1, cart2) {
      const mergedCart = [...cart1];
      
      // Fix quantities in cart1 items
      for (let i = 0; i < mergedCart.length; i++) {
        if (!mergedCart[i].quantity || mergedCart[i].quantity < 1) {
          console.log('Fixed invalid quantity in merged cart item:', mergedCart[i].name);
          mergedCart[i].quantity = 1;
        }
      }
      
      // Add items from cart2 that aren't in cart1
      cart2.forEach(item2 => {
        // Ensure item2 has valid quantity
        if (!item2.quantity || item2.quantity < 1) {
          console.log('Fixed invalid quantity in item from Firestore:', item2.name);
          item2.quantity = 1;
        }
        
        const existingItemIndex = mergedCart.findIndex(item1 => 
          item1.productId === item2.productId &&
          item1.variant === item2.variant
        );
        
        if (existingItemIndex !== -1) {
          // Item exists, update quantity
          mergedCart[existingItemIndex].quantity = item2.quantity;
        } else {
          // Item doesn't exist, add it
          mergedCart.push(item2);
        }
      });
      
      return mergedCart;
    },
    
    /**
     * Update the cart UI with current items
     */
    updateCartUI: function() {
      // Update cart count in header
      if (this.cartCountElement) {
        const itemCount = this.getTotalQuantity();
        this.cartCountElement.textContent = itemCount;
        this.cartCountElement.style.display = itemCount > 0 ? 'flex' : 'none';
      }
      
      // Update cart items list (if on cart page)
      if (this.cartItemsContainer) {
        this.renderCartItems();
      }
      
      // Update cart total (if on cart page)
      if (this.cartTotalElement) {
        this.updateCartTotal();
      }
    },
    
    /**
     * Get total quantity of items in cart
     */
    getTotalQuantity: function() {
      return this.items.reduce((total, item) => total + item.quantity, 0);
    },
    
    /**
     * Render cart items in the cart container (page or sliding panel)
     */
    renderCartItems: function() {
      const container = this.slidingCartItemsContainer;
      if (!container) return;
      
      // Clear existing items
      container.innerHTML = '';
      
      if (this.items.length === 0) {
        // Show empty cart message
        container.innerHTML = `
          <div class="empty-cart">
            <p>Your cart is empty</p>
            <a href="index.html" class="continue-shopping-btn">Continue Shopping</a>
          </div>
        `;
        
        // Update cart total
        this.updateCartTotal();
        return;
      }
      
      // Add each item to the container
      this.items.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.setAttribute('data-index', index);
        
        // Calculate item total price
        const itemTotal = (item.price * item.quantity).toLocaleString('en-IN');
        
        // Different layout for sliding cart
        itemElement.innerHTML = `
          <div class="cart-item-image">
            <img src="${item.image || 'images/product-category/IMG_20250504_150241.jpg'}" alt="${item.name}">
          </div>
          <div class="cart-item-details">
            <h3 class="cart-item-name">${item.name}</h3>
            <div class="cart-item-price-row">
              <div class="cart-item-price-info">
                <p class="cart-item-price">₹${item.price.toLocaleString('en-IN')} × ${item.quantity}</p>
                <p class="cart-item-total">₹${itemTotal}</p>
              </div>
              <div class="cart-item-quantity">
                <button class="quantity-btn decrement" data-index="${index}">-</button>
                <input type="text" value="${item.quantity}" class="quantity-input" readonly>
                <button class="quantity-btn increment" data-index="${index}">+</button>
              </div>
            </div>
            ${item.variant ? `<p class="cart-item-variant">${item.variant}</p>` : ''}
          </div>
          <button class="remove-item-btn" data-index="${index}">
            <i class="fas fa-trash"></i>
          </button>
        `;
        
        container.appendChild(itemElement);
      });
      
      // Update cart total
      this.updateCartTotal();
      
      // Add event listeners to the newly created elements
      this.setupCartItemEventListeners();
    },
    
    /**
     * Setup event listeners for cart item buttons using direct binding
     * with better error handling
     */
    setupCartItemEventListeners: function() {
      try {
        // Get all the buttons in the container
        const decrementButtons = document.querySelectorAll('.quantity-btn.decrement');
        const incrementButtons = document.querySelectorAll('.quantity-btn.increment');
        const removeButtons = document.querySelectorAll('.remove-item-btn');
        
        console.log('Setting up cart event listeners for:',
          decrementButtons.length, 'decrement buttons,',
          incrementButtons.length, 'increment buttons,',
          removeButtons.length, 'remove buttons');
        
        // Add event listeners to decrement buttons
        decrementButtons.forEach(button => {
          button.addEventListener('click', (e) => {
            try {
              const index = parseInt(button.getAttribute('data-index'));
              console.log('Decrement clicked for index:', index);
              this.decrementQuantity(index);
            } catch (error) {
              console.error('Error in decrement button handler:', error);
            }
          });
        });
        
        // Add event listeners to increment buttons
        incrementButtons.forEach(button => {
          button.addEventListener('click', (e) => {
            try {
              const index = parseInt(button.getAttribute('data-index'));
              console.log('Increment clicked for index:', index);
              this.incrementQuantity(index);
            } catch (error) {
              console.error('Error in increment button handler:', error);
            }
          });
        });
        
        // Add event listeners to remove buttons
        removeButtons.forEach(button => {
          button.addEventListener('click', (e) => {
            try {
              const index = parseInt(button.getAttribute('data-index'));
              console.log('Remove clicked for index:', index);
              this.removeItem(index);
            } catch (error) {
              console.error('Error in remove button handler:', error);
            }
          });
        });
      } catch (error) {
        console.error('Error setting up cart item event listeners:', error);
      }
    },
    
    /**
     * Update cart total in the sliding cart panel
     */
    updateCartTotal: function() {
      if (!this.cartTotalElement) return;
      
      const subtotal = this.calculateSubtotal();
      
      // Simple display for sliding cart panel
      this.cartTotalElement.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    },
    
    /**
     * Calculate cart subtotal
     */
    calculateSubtotal: function() {
      return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    
    /**
     * Add item to cart with immediate server sync
     */
    addItem: function(productItem) {
      // Ensure quantity is valid
      if (!productItem.quantity || isNaN(productItem.quantity) || productItem.quantity < 1) {
        productItem.quantity = 1;
      }
      
      // Add timestamp to the item for tracking changes
      productItem.addedAt = new Date().toISOString();
      productItem.updatedAt = new Date().toISOString();
      
      // Check if item already exists in cart
      const existingItemIndex = this.items.findIndex(item => 
        item.productId === productItem.productId &&
        item.variant === productItem.variant
      );
      
      if (existingItemIndex !== -1) {
        // Item exists, update quantity
        this.items[existingItemIndex].quantity += productItem.quantity;
        this.items[existingItemIndex].updatedAt = new Date().toISOString();
      } else {
        // Item doesn't exist, add it
        this.items.push(productItem);
      }
      
      // Save cart to local storage first for immediate feedback
      this.saveCartToLocalStorage();
      
      // Re-render the cart items to update display immediately
      this.renderCartItems();
      
      // Update full UI (count badge, etc)
      this.updateCartUI();
      
      // If user is logged in, sync with Firestore immediately
      if (auth.currentUser) {
        // Use a debounced version to prevent too many Firestore writes
        if (this.debouncedSaveToFirestore) {
          clearTimeout(this.debouncedSaveToFirestore);
        }
        
        // Save to Firestore after a short delay to batch multiple rapid changes
        this.debouncedSaveToFirestore = setTimeout(() => {
          this.saveCartToFirestore(auth.currentUser.uid);
          this.debouncedSaveToFirestore = null;
        }, 500);
      }
      
      return true;
    },
    
    /**
     * Remove item from cart - COMPLETELY REVISED
     * Now with proper tracking for synchronization
     */
    removeItem: function(index) {
      if (index >= 0 && index < this.items.length) {
        // Track the removed item for debugging
        const removedItem = this.items[index];
        console.log('Removing item from cart:', removedItem.name);
        
        // Track this as a delete operation
        this.lastOperation = 'delete';
        this.lastDeletedItem = {
          productId: removedItem.productId,
          timestamp: Date.now()
        };
        
        // Store delete operation in localStorage for sync conflicts
        let deletedItems = [];
        try {
          const storedDeletedItems = localStorage.getItem('auricCartDeletedItems');
          if (storedDeletedItems) {
            deletedItems = JSON.parse(storedDeletedItems);
          }
        } catch (e) {
          console.error('Error parsing deleted items:', e);
        }
        
        // Add to deleted items list with timestamp
        deletedItems.push({
          productId: removedItem.productId, 
          timestamp: Date.now(),
          name: removedItem.name
        });
        
        // Save deleted items list (keep last 10 only)
        if (deletedItems.length > 10) {
          deletedItems = deletedItems.slice(-10);
        }
        localStorage.setItem('auricCartDeletedItems', JSON.stringify(deletedItems));
        
        // Remove item at the specified index
        this.items.splice(index, 1);
        
        // Save to localStorage first for immediate feedback
        this.saveCartToLocalStorage();
        
        // Re-render the cart items to update display immediately
        this.renderCartItems();
        
        // Update full UI (count badge, etc)
        this.updateCartUI();
        
        // If user is logged in, sync with Firestore IMMEDIATELY 
        // For deletions, we prioritize immediate sync without debouncing
        if (auth.currentUser) {
          // Cancel any pending debounced saves
          if (this.debouncedSaveToFirestore) {
            clearTimeout(this.debouncedSaveToFirestore);
            this.debouncedSaveToFirestore = null;
          }
          
          // Save immediately to Firestore, overwriting the entire cart
          this.saveCartToFirestore(auth.currentUser.uid);
          
          console.log('Item deletion synced to Firestore immediately');
        } else {
          console.log('User not logged in, item deletion saved only to localStorage');
        }
        
        return true;
      }
      
      return false;
    },
    
    /**
     * Increment item quantity
     */
    incrementQuantity: function(index) {
      if (index >= 0 && index < this.items.length) {
        // Increment quantity, max 10
        this.items[index].quantity = Math.min(10, this.items[index].quantity + 1);
        
        // Update the item's timestamp
        this.items[index].updatedAt = new Date().toISOString();
        
        // Save to localStorage first for immediate feedback
        this.saveCartToLocalStorage();
        
        // Re-render the cart items to update display immediately
        this.renderCartItems();
        
        // Update full UI (count badge, etc)
        this.updateCartUI();
        
        // If user is logged in, sync with Firestore immediately
        if (auth.currentUser) {
          // Use a debounced version to prevent too many Firestore writes
          if (this.debouncedSaveToFirestore) {
            clearTimeout(this.debouncedSaveToFirestore);
          }
          
          // Save to Firestore after a short delay to batch multiple rapid changes
          this.debouncedSaveToFirestore = setTimeout(() => {
            this.saveCartToFirestore(auth.currentUser.uid);
            this.debouncedSaveToFirestore = null;
          }, 500);
        }
        
        return true;
      }
      
      return false;
    },
    
    /**
     * Decrement item quantity
     */
    decrementQuantity: function(index) {
      if (index >= 0 && index < this.items.length) {
        // Decrement quantity, min 1
        this.items[index].quantity = Math.max(1, this.items[index].quantity - 1);
        
        // Update the item's timestamp
        this.items[index].updatedAt = new Date().toISOString();
        
        // Save to localStorage first for immediate feedback
        this.saveCartToLocalStorage();
        
        // Re-render the cart items to update display immediately
        this.renderCartItems();
        
        // Update full UI (count badge, etc)
        this.updateCartUI();
        
        // If user is logged in, sync with Firestore immediately
        if (auth.currentUser) {
          // Use a debounced version to prevent too many Firestore writes
          if (this.debouncedSaveToFirestore) {
            clearTimeout(this.debouncedSaveToFirestore);
          }
          
          // Save to Firestore after a short delay to batch multiple rapid changes
          this.debouncedSaveToFirestore = setTimeout(() => {
            this.saveCartToFirestore(auth.currentUser.uid);
            this.debouncedSaveToFirestore = null;
          }, 500);
        }
        
        return true;
      }
      
      return false;
    },
    
    /**
     * Save cart to storage (localStorage or Firestore)
     */
    saveCart: function() {
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // User is logged in, save to Firestore
        this.saveCartToFirestore(currentUser.uid);
      }
      
      // Always save to localStorage as backup
      this.saveCartToLocalStorage();
    },
    
    /**
     * Setup event listeners for cart functionality
     */
    setupEventListeners: function() {
      // Add to cart buttons
      if (this.addToCartButtons) {
        this.addToCartButtons.forEach(button => {
          button.addEventListener('click', this.handleAddToCart.bind(this));
        });
      }
      
      // Small add to cart buttons in recommended products section
      const smallAddToCartButtons = document.querySelectorAll('.add-to-cart-btn-small');
      if (smallAddToCartButtons) {
        smallAddToCartButtons.forEach(button => {
          button.addEventListener('click', this.handleAddToCart.bind(this));
        });
      }
      
      // Individual product page add to cart button
      const productAddToCartBtn = document.querySelector('.product-detail-info .add-to-cart-btn');
      if (productAddToCartBtn) {
        productAddToCartBtn.addEventListener('click', this.handleProductPageAddToCart.bind(this));
      }
    },
    
    /**
     * Handle add to cart button click on product listing
     */
    handleAddToCart: function(e) {
      e.preventDefault();
      
      // Check if this is a small cart button click
      const isSmallButton = e.target.classList.contains('add-to-cart-btn-small');
      
      // Get product information from the closest product item
      const productItem = e.target.closest('.product-item');
      if (!productItem) return;
      
      const productId = productItem.getAttribute('data-product-id') || 'unknown-product';
      const name = productItem.querySelector('.product-name')?.textContent || 'Product';
      const price = parseFloat(productItem.querySelector('.current-price')?.textContent.replace(/[^0-9.]/g, '')) || 0;
      const image = productItem.querySelector('.product-image img')?.src || '';
      
      // Log the product details for debugging
      console.log('Adding item to cart:', {
        productId,
        name,
        price,
        isSmallButton
      });
      
      // Create item object
      const item = {
        productId,
        name,
        price,
        image,
        quantity: 1
      };
      
      // Add to cart
      this.addItem(item);
      
      // Show confirmation
      this.showAddToCartConfirmation(name);
    },
    
    /**
     * Handle add to cart button click on product detail page
     */
    handleProductPageAddToCart: function(e) {
      e.preventDefault();
      
      // Get product information from the product detail page
      const productDetailContainer = document.querySelector('.product-detail-container');
      if (!productDetailContainer) return;
      
      const productId = productDetailContainer.getAttribute('data-product-id') || 
                         document.querySelector('.meta-item .meta-value:last-child')?.textContent || 'unknown-product';
      const name = document.querySelector('.product-title')?.textContent || 'Product';
      const priceText = document.querySelector('.price-value')?.textContent || '0';
      const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
      const image = document.querySelector('.main-product-image')?.src || '';
      const quantityInput = document.querySelector('.quantity-input');
      const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
      
      // Create item object
      const item = {
        productId,
        name,
        price,
        image,
        quantity
      };
      
      // Add to cart
      this.addItem(item);
      
      // Show confirmation
      this.showAddToCartConfirmation(name);
    },
    
    /**
     * Show confirmation message after adding to cart
     */
    showAddToCartConfirmation: function(productName) {
      // Check if there's an existing confirmation
      let confirmationElement = document.querySelector('.add-to-cart-confirmation');
      
      if (!confirmationElement) {
        // Create confirmation element
        confirmationElement = document.createElement('div');
        confirmationElement.className = 'add-to-cart-confirmation';
        document.body.appendChild(confirmationElement);
      }
      
      // Update confirmation message
      confirmationElement.innerHTML = `
        <div class="confirmation-content">
          <i class="fas fa-check-circle"></i>
          <p>${productName} added to cart</p>
          <a href="#" class="view-cart-btn">View Cart</a>
        </div>
        <button class="close-confirmation">&times;</button>
      `;
      
      // Show confirmation
      confirmationElement.classList.add('active');
      
      // Add close button functionality
      const closeButton = confirmationElement.querySelector('.close-confirmation');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          confirmationElement.classList.remove('active');
        });
      }
      
      // Add view cart button functionality
      const viewCartButton = confirmationElement.querySelector('.view-cart-btn');
      if (viewCartButton) {
        viewCartButton.addEventListener('click', (e) => {
          e.preventDefault();
          confirmationElement.classList.remove('active');
          this.openCartPanel();
        });
      }
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        confirmationElement.classList.remove('active');
      }, 5000);
    },
    
    /**
     * Setup authentication listener for cart syncing
     * Enhanced with better user feedback and error handling
     */
    setupAuthListener: function() {
      // Create status indicator for sync operations
      this.createSyncStatusIndicator();
      
      // Check if auth is defined
      if (typeof auth === 'undefined' || !auth) {
        console.log('Auth is not defined, using localStorage only');
        this.loadCartFromLocalStorage();
        this.updateCartUI();
        return;
      }
      
      auth.onAuthStateChanged((user) => {
        if (user) {
          // User has signed in, show syncing status
          console.log('User is authenticated:', user.email);
          this.showSyncStatus('Syncing your cart across devices...');
          
          // User has signed in, sync cart with timeout for better reliability
          console.log('User signed in, syncing cart');
          
          // Short delay to ensure auth is fully processed
          setTimeout(() => {
            this.syncCartOnLogin(user.uid);
          }, 1000);
          
          // Set up periodic background sync for logged in users
          // This helps ensure cart data stays consistent across devices
          this.startPeriodicSync(user.uid);
        } else {
          // User has signed out, load from localStorage
          console.log('User signed out, loading cart from localStorage');
          this.loadCartFromLocalStorage();
          this.updateCartUI();
          
          // Clear any periodic sync
          this.stopPeriodicSync();
        }
      });
    },
    
    /**
     * Start periodic background sync for cart data
     * This ensures cart stays in sync across multiple devices
     */
    startPeriodicSync: function(userId) {
      // Clear any existing sync interval
      this.stopPeriodicSync();
      
      // Set up sync every 2 minutes (reduced time for better sync)
      this.syncInterval = setInterval(() => {
        if (auth.currentUser && navigator.onLine) {
          console.log('Running periodic background sync');
          
          // Check if we have pending changes to send
          if (this.pendingFirestoreSync) {
            this.saveCartToFirestore(userId);
          }
          
          // Check for changes from other devices
          this.checkForRemoteChanges(userId);
        }
      }, 2 * 60 * 1000); // Every 2 minutes (instead of 5)
      
      // Also set up a real-time Firestore listener for critical updates
      this.setupFirestoreListener(userId);
    },
    
    /**
     * Check for remote changes from other devices
     */
    checkForRemoteChanges: function(userId) {
      if (!userId || !navigator.onLine) return;
      
      // Get our last sync time
      let lastSyncTime = 0;
      try {
        const storedSyncTime = localStorage.getItem('auricCartLastSync');
        if (storedSyncTime) {
          lastSyncTime = parseInt(storedSyncTime, 10);
        }
      } catch (e) {
        console.error('Error parsing last sync time:', e);
      }
      
      // Check Firestore for newer data
      db.collection('carts').doc(userId).get()
        .then(doc => {
          if (doc.exists && doc.data().items) {
            // Get server timestamp if available
            const serverTimestamp = doc.data().updatedAt ? doc.data().updatedAt.toMillis() : 0;
            const lastSyncedDevice = doc.data().lastSyncedDevice || '';
            
            // Only sync if the server data is newer and was updated by a different device
            if (serverTimestamp > lastSyncTime && lastSyncedDevice !== navigator.userAgent) {
              console.log('Found newer cart data from another device');
              this.showSyncStatus('Syncing cart from your other device...');
              
              // Use the server data
              const serverItems = doc.data().items;
              
              // Update our local cart with server data
              this.items = serverItems;
              this.saveCartToLocalStorage();
              
              // Update the timestamp
              localStorage.setItem('auricCartLastSync', Date.now().toString());
              
              // Update UI
              this.updateCartUI();
              this.renderCartItems();
              
              console.log('Cart synced with data from another device');
            }
          }
        })
        .catch(error => {
          console.error('Error checking for remote changes:', error);
        });
    },
    
    /**
     * Setup a real-time Firestore listener for critical updates
     * COMPLETELY REWRITTEN with stronger device identification and version control
     */
    setupFirestoreListener: function(userId) {
      if (!userId) return;
      
      // Clear any existing listener first
      if (this.firestoreUnsubscribe) {
        try {
          this.firestoreUnsubscribe();
        } catch (err) {
          console.error('Error unsubscribing from previous listener:', err);
        }
        this.firestoreUnsubscribe = null;
      }
      
      // SIMPLIFICATION: Only check if an order was completed
      const orderCompleted = localStorage.getItem('orderCompleted') === 'true';
      
      // If an order was just completed, skip listener setup and ensure cart is cleared
      if (orderCompleted) {
        console.log('Skipping Firestore listener setup - order was completed');
        
        // Create a device ID with order completion flag for identification
        const orderCompletionDeviceId = 'order_completed_' + Date.now() + '_' + 
                                       Math.random().toString(36).substring(2, 15);
        this.deviceId = orderCompletionDeviceId;
        localStorage.setItem('auricCartDeviceId', orderCompletionDeviceId);
        
        // Ensure the cart is cleared in memory
        this.items = [];
        this.updateCartUI();
        
        return;
      }
      
      // Generate a unique device identifier if we don't have one
      let deviceId = localStorage.getItem('auricCartDeviceId');
      if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('auricCartDeviceId', deviceId);
      }
      this.deviceId = deviceId;
      
      console.log('Setting up real-time Firestore listener with device ID:', deviceId);
      
      // Set up a new listener with emergency clear handling
      try {
        this.firestoreUnsubscribe = db.collection('carts').doc(userId)
          .onSnapshot({
            includeMetadataChanges: true
          }, doc => {
            // Check if the checkout page is active - we don't want to apply updates during checkout
            const isCheckoutPage = window.location.pathname.includes('checkout');
            
            // Check if this is from cache or server
            const source = doc.metadata.hasPendingWrites ? 'local' : 'server';
            
            // Comprehensive emergency clear flag check
            const emergencyFlags = [
              window.FORCE_CART_CLEAR_NEEDED === true,
              localStorage.getItem('orderCompleted') === 'true',
              localStorage.getItem('cartEmergencyCleared') === 'true',
              localStorage.getItem('pendingCartClear') === 'true',
              localStorage.getItem('razorpaySuccessfulPayment') === 'true'
            ];
            
            if (emergencyFlags.some(flag => flag === true)) {
              console.log('Ignoring Firestore update - emergency clear is active');
              return;
            }
            
            // Check if we're on checkout path and have just placed an order
            if (isCheckoutPage && localStorage.getItem('orderJustPlaced') === 'true') {
              console.log('Ignoring Firestore update - order just placed');
              return;
            }
            
            // Only proceed if the data is from the server and the document exists
            if (source === 'server' && doc.exists) {
              console.log('Received real-time update from Firestore:', source);
              
              const serverData = doc.data();
              
              // CRITICAL CHECK #1: Look for emergency clear flags
              if (serverData.emergencyClear === true || 
                  serverData.emergency_cleared === true || 
                  serverData.operation === 'emergency_clear' || 
                  serverData.lastOperation === 'emergency_clear' ||
                  serverData.operation === 'force_clear' ||
                  serverData.force_cleared === true) {
                
                console.log('EMERGENCY CLEAR flag detected in Firestore!');
                
                // Mark in localStorage that emergency clear occurred
                localStorage.setItem('cartEmergencyCleared', 'true');
                localStorage.setItem('cartEmergencyClearTime', Date.now().toString());
                
                // Clear the cart items immediately in memory
                this.items = [];
                
                // Clear all cart-related localStorage items
                const cartKeys = [
                  'auricCart', 'auricCartItems', 'cartItems', 'cart', 
                  'checkout-cart', 'auric-cart-data'
                ];
                
                cartKeys.forEach(key => localStorage.removeItem(key));
                
                // Reset localStorage cart to empty array
                localStorage.setItem('auricCart', JSON.stringify([]));
                localStorage.setItem('auricCartItems', JSON.stringify([]));
                
                // Update UI to reflect empty cart
                this.updateCartUI();
                this.renderCartItems();
                
                // Save the empty cart back to Firestore to confirm the clearing
                this.saveCartToFirestore(userId);
                
                // Skip further processing of this update
                return;
                
                // Always clear the local cart when emergency clear is detected
                this.items = [];
                localStorage.removeItem('auricCart');
                localStorage.removeItem('auricCartItems');
                localStorage.removeItem('cartItems');
                
                // Update UI
                this.updateCartUI();
                this.renderCartItems();
                
                // Stop and unsubscribe from listener to prevent further updates
                if (this.firestoreUnsubscribe) {
                  console.log('Unsubscribing from Firestore listener due to emergency clear');
                  this.firestoreUnsubscribe();
                  this.firestoreUnsubscribe = null;
                }
                
                return; // Exit early
              }
              
              // Regular cart sync logic when not emergency cleared
              if (serverData.items) {
                const serverItems = serverData.items || [];
                const serverDeviceId = serverData.device || '';
                const serverVersion = serverData.version || '0';
                const serverOperation = serverData.operation || 'update';
                
                // Get our local version
                const localVersion = localStorage.getItem('auricCartVersion') || '0';
                
                // Debug info
                console.log('Server cart data:', {
                  items: serverItems.length,
                  device: serverDeviceId,
                  operation: serverOperation,
                  version: serverVersion
                });
                console.log('Local cart data:', {
                  items: this.items.length,
                  device: this.deviceId,
                  version: localVersion
                });
                
                // Only update if:
                // 1. This is not our own device (different device ID), or
                // 2. The server version is newer than our local version
                // 3. We're not currently updating Firestore ourselves
                // 4. We haven't just cleared the cart via order checkout
                const isOurDevice = (serverDeviceId === this.deviceId);
                const isNewerVersion = (parseInt(serverVersion) > parseInt(localVersion));
                const recentlyOrderCompleted = localStorage.getItem('orderCompleted') === 'true' && 
                                              (Date.now() - parseInt(localStorage.getItem('orderCompletedTime') || '0')) < 60000;
                
                // NEVER update the cart if we've just completed an order
                if (recentlyOrderCompleted) {
                  console.log('Ignoring update - order was recently completed');
                  return;
                }
                
                if (!this.isUpdatingFirestore && !recentlyOrderCompleted && 
                    (!isOurDevice || isNewerVersion)) {
                  
                  console.log('Applying real-time update from server - cart change detected');
                  
                  // Special handling for clear operation
                  if (serverOperation === 'clear' || serverItems.length === 0) {
                    console.log('Server indicates cart should be cleared');
                    this.items = [];
                  } else {
                    // Standard update - use server data
                    this.items = serverItems;
                  }
                  
                  // Update timestamps and version
                  localStorage.setItem('auricCartVersion', serverVersion);
                  localStorage.setItem('auricCartLastSync', Date.now().toString());
                  
                  // Save to localStorage
                  this.saveCartToLocalStorage();
                  
                  // Update UI
                  this.updateCartUI();
                  this.renderCartItems();
                  
                  // Show user notification
                  if (serverOperation === 'delete') {
                    this.showSyncStatus('Item removed from your cart on another device');
                  } else if (serverItems.length > this.items.length) {
                    this.showSyncStatus('New items added to your cart from another device');
                  } else {
                    this.showSyncStatus('Cart updated from your other device');
                  }
                } else {
                  console.log('Ignoring Firestore update - either our own update or older version');
                }
              }
            }
          }, error => {
            console.error('Error in Firestore listener:', error);
            
            // Only set up to retry if not in emergency clear mode
            if (localStorage.getItem('cartEmergencyCleared') !== 'true') {
              window.addEventListener('online', () => {
                console.log('Back online, refreshing Firestore listener');
                this.setupFirestoreListener(userId);
              }, { once: true });
            }
          });
      } catch (listenerSetupError) {
        console.error('Failed to set up Firestore listener:', listenerSetupError);
      }
    },
    
    /**
     * Stop periodic background sync
     */
    stopPeriodicSync: function() {
      // Clear interval timer
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
      
      // Unsubscribe from Firestore listener if exists
      if (this.firestoreUnsubscribe) {
        this.firestoreUnsubscribe();
        this.firestoreUnsubscribe = null;
      }
      
      console.log('Background sync stopped');
    },
    
    /**
     * Create a sync status indicator element
     */
    createSyncStatusIndicator: function() {
      // Check if the indicator already exists
      if (document.getElementById('cart-sync-status')) return;
      
      // Create the indicator element
      const indicator = document.createElement('div');
      indicator.id = 'cart-sync-status';
      indicator.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: rgba(0,0,0,0.8); color: white; padding: 10px 15px; border-radius: 5px; font-size: 14px; z-index: 9999; display: none; transition: opacity 0.3s ease;';
      
      // Add to the document
      document.body.appendChild(indicator);
    },
    
    /**
     * Show sync status message
     */
    showSyncStatus: function(message) {
      const indicator = document.getElementById('cart-sync-status');
      if (!indicator) return;
      
      // Update message and show
      indicator.textContent = message;
      indicator.style.display = 'block';
      indicator.style.opacity = '1';
      
      // Hide after 3 seconds
      setTimeout(() => {
        indicator.style.opacity = '0';
        setTimeout(() => {
          indicator.style.display = 'none';
        }, 300);
      }, 3000);
    }
  };
  
  // Initialize cart system
  AuricCart.init();
  
  // Make the cart available globally (for debugging and external access)
  window.AuricCart = AuricCart;
  
  // Create a global clearCart function for use by checkout page
  window.clearCart = function() {
    console.log('!!! EMERGENCY CART CLEARING FUNCTION CALLED !!!');
    
    // Set all possible emergency flags
    window.FORCE_CART_CLEAR_NEEDED = true;
    localStorage.setItem('orderCompleted', 'true');
    localStorage.setItem('orderCompletedTime', Date.now().toString());
    localStorage.setItem('cartEmergencyCleared', 'true');
    localStorage.setItem('cartEmergencyClearTime', Date.now().toString());
    localStorage.setItem('pendingCartClear', 'true');
    localStorage.setItem('cartClearTime', Date.now().toString());
    
    // NUCLEAR CART CLEARING STRATEGY
    
    try {
      // 0. Unsubscribe from any real-time listeners first to prevent re-syncing
      if (AuricCart && AuricCart.firestoreUnsubscribe) {
        console.log('Disabling Firestore real-time listener to prevent re-syncing');
        AuricCart.firestoreUnsubscribe();
        AuricCart.firestoreUnsubscribe = null;
      }
      
      // Also stop any background sync that might be running
      if (AuricCart && AuricCart.syncInterval) {
        console.log('Stopping background sync interval');
        clearInterval(AuricCart.syncInterval);
        AuricCart.syncInterval = null;
      }
    } catch (listenerError) {
      console.error('Error disabling listeners:', listenerError);
    }
      
    // 1. AGGRESSIVELY clear ALL localStorage cart-related data
    try {
      console.log('Clearing ALL localStorage cart data');
      
      // Direct cart items
      localStorage.removeItem('auricCart');
      localStorage.removeItem('auricCartItems');
      localStorage.removeItem('cartItems');
      
      // Other potential cart storage
      localStorage.removeItem('cart');
      localStorage.removeItem('checkout-cart');
      localStorage.removeItem('auric-cart-data');
      
      // Sync-related data
      localStorage.removeItem('auricCartDeviceId');
      localStorage.removeItem('auricCartVersion');
      localStorage.removeItem('auricCartTimestamp');
      localStorage.removeItem('auricCartLastSync');
      localStorage.removeItem('auricCartDeletedItems');
      localStorage.removeItem('auricCartSyncing');
      
      // Generate a new device ID to break any sync chains
      const newDeviceId = `emergency_clear_${Date.now()}_${Math.random().toString(36).substr(2, 10)}`;
      localStorage.setItem('auricCartDeviceId', newDeviceId);
      
      if (AuricCart) {
        AuricCart.deviceId = newDeviceId;
      }
      
      console.log('All localStorage cart data cleared and device ID reset');
    } catch (localStorageError) {
      console.error('Error clearing localStorage:', localStorageError);
    }
    
    // 2. FORCEFULLY clear Firestore cart with max priority
    if (typeof firebase !== 'undefined' && firebase.auth) {
      try {
        // Check if user is authenticated
        const currentUser = firebase.auth().currentUser;
        if (currentUser && currentUser.uid) {
          const db = firebase.firestore();
          const userId = currentUser.uid;
          
          // Generate a uniquely identifiable device ID for this emergency clear
          const deviceId = `emergency_clear_${Date.now()}_${Math.random().toString(36).substr(2, 10)}`;
          const timestamp = Date.now();
          const veryHighPriorityVersion = (9999999999999 + timestamp).toString(); // Ensures this always wins version conflicts
          
          console.log('EMERGENCY CLEARING Firestore cart for user:', userId);
          
          // Set these flags to prevent our own clear from being overridden
          if (AuricCart) {
            AuricCart.isEmergencyClear = true;
            AuricCart.emergencyClearTimestamp = timestamp;
            AuricCart.isUpdatingFirestore = true;
          }
          
          // Use a transaction for maximum reliability
          db.runTransaction(async (transaction) => {
            const cartRef = db.collection('carts').doc(userId);
            
            // Get current document to check its version
            const currentDoc = await transaction.get(cartRef);
            
            // Set absolutely empty cart with emergency clear flags that can't be ignored
            transaction.set(cartRef, {
              items: [],
              updatedAt: new Date().toISOString(),
              device: deviceId,
              operation: 'emergency_clear', 
              version: veryHighPriorityVersion,
              clear_timestamp: timestamp,
              emergency_cleared: true,
              emergency_clear_timestamp: timestamp,
              ignore_sync: true, // Signal to ignore future syncs
              max_priority: true // Signal this should never be overridden
            });
            
            return Promise.resolve();
          }).then(() => {
            console.log('Firestore cart EMERGENCY cleared successfully via transaction');
            
            // Reset isUpdatingFirestore after a delay
            setTimeout(() => {
              if (AuricCart) {
                AuricCart.isUpdatingFirestore = false;
              }
            }, 5000); // 5 seconds should be enough for the operation to complete fully
            
          }).catch(err => {
            console.error('Transaction failed during EMERGENCY clear:', err);
            
            // Fallback to direct update with even higher timestamp if transaction fails
            const fallbackTimestamp = Date.now();
            const fallbackVersion = (99999999999999 + fallbackTimestamp).toString();
            
            db.collection('carts').doc(userId).set({
              items: [],
              updatedAt: new Date().toISOString(),
              device: `fallback_emergency_${fallbackTimestamp}_${Math.random().toString(36).substr(2, 10)}`,
              operation: 'fallback_emergency_clear',
              version: fallbackVersion,
              clear_timestamp: fallbackTimestamp,
              emergency_cleared: true,
              fallback_cleared: true,
              ignore_sync: true,
              max_priority: true
            }).then(() => {
              console.log('Firestore cart EMERGENCY cleared via fallback direct update');
              
              // Reset isUpdatingFirestore after a delay
              setTimeout(() => {
                if (AuricCart) {
                  AuricCart.isUpdatingFirestore = false;
                }
              }, 5000);
              
            }).catch(innerErr => {
              console.error('CRITICAL: Both transaction and fallback clear failed:', innerErr);
              
              if (AuricCart) {
                AuricCart.isUpdatingFirestore = false;
              }
            });
          });
        }
      } catch (err) {
        console.error('CRITICAL ERROR accessing Firestore during emergency clear:', err);
        
        if (AuricCart) {
          AuricCart.isUpdatingFirestore = false;
        }
      }
    }
    
    // 3. FORCEFULLY reset cart object and UI
    try {
      if (AuricCart) {
        console.log('FORCE RESETTING cart object');
        
        // Reset items array
        AuricCart.items = [];
        
        // Reset all flags
        AuricCart.pendingFirestoreSync = false;
        AuricCart.isUpdatingFirestore = false;
        
        // Force a complete UI refresh - DIRECT DOM MANIPULATIONS
        try {
          // Clear the cart container - try different selectors for maximum coverage
          const cartContainers = [
            document.getElementById('cartItems'),
            document.querySelector('.cart-items'),
            document.querySelector('.shopping-cart-items')
          ];
          
          cartContainers.forEach(container => {
            if (container) {
              container.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
            }
          });
          
          // Reset ALL possible cart count badges
          const cartCountBadges = [
            document.querySelector('.cart-count'),
            document.querySelector('.cart-badge'),
            document.querySelector('.cart-item-count')
          ];
          
          cartCountBadges.forEach(badge => {
            if (badge) {
              badge.textContent = '0';
              badge.style.display = 'none';
            }
          });
          
          // Reset ALL possible cart totals
          const cartTotals = [
            document.getElementById('cartTotal'),
            document.querySelector('.cart-total-amount'),
            document.querySelector('.cart-subtotal')
          ];
          
          cartTotals.forEach(total => {
            if (total) {
              total.textContent = '₹0';
            }
          });
          
          // Call ALL update methods in case they exist
          if (typeof AuricCart.updateCartUI === 'function') AuricCart.updateCartUI();
          if (typeof AuricCart.renderCartItems === 'function') AuricCart.renderCartItems();
          if (typeof AuricCart.updateCartTotal === 'function') AuricCart.updateCartTotal();
        } catch (uiErr) {
          console.error('Error updating UI during emergency clear:', uiErr);
        }
      } else {
        console.log('AuricCart object not available - performing direct DOM manipulation');
        
        // Direct DOM manipulation as fallback
        const cartElements = [
          document.getElementById('cartItems'),
          document.querySelector('.cart-items'),
          document.querySelector('.cart-count'),
          document.getElementById('cartTotal')
        ];
        
        cartElements.forEach(el => {
          if (el) {
            if (el.classList.contains('cart-count')) {
              el.textContent = '0';
              el.style.display = 'none';
            } else if (el.id === 'cartTotal') {
              el.textContent = '₹0';
            } else {
              el.innerHTML = '<p>Your cart is empty</p>';
            }
          }
        });
      }
    } catch (cartObjectError) {
      console.error('Error resetting cart object:', cartObjectError);
    }
    
    console.log('!!! CART EMERGENCY CLEARED SUCCESSFULLY !!!');
    return true;
  };
});