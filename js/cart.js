/**
 * Auric Cart System
 * A simplified implementation focused on reliability and persistence
 */

// Set a flag to preserve cart data across page reloads
console.log('Flag check: Preserving cart data across page reloads');

// Handle direct cart-panel toggle (separate from our object approach)
function setupDirectCartToggle() {
  console.log('Setting up direct cart toggle as additional failsafe');
  
  const toggle = document.querySelector('.cart-toggle');
  const panel = document.querySelector('.cart-panel');
  const overlay = document.querySelector('.cart-overlay');
  const closeBtn = document.querySelector('.close-cart-btn');
  
  if (toggle && panel && overlay && closeBtn) {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      panel.style.right = '0';
      panel.classList.add('active');
      overlay.style.display = 'block';
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    
    const closeHandler = function() {
      panel.style.right = '-400px';
      panel.classList.remove('active');
      overlay.style.display = 'none';
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    };
    
    closeBtn.addEventListener('click', closeHandler);
    overlay.addEventListener('click', closeHandler);
  }
}

// Advanced debugging tools window
window.cartDebug = {};

// Force synchronization with server for debugging
window.cartDebug.forceSyncWithServer = function() {
  if (!auth || !auth.currentUser) {
    console.error("User not authenticated, can't force sync");
    return;
  }
  
  const userId = auth.currentUser.uid;
  console.log("Forcing synchronization with server for user:", userId);
  
  // Create notification
  const notification = document.createElement('div');
  notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 5px; z-index: 10000; transition: opacity 0.3s;';
  notification.textContent = 'Syncing cart with server...';
  document.body.appendChild(notification);
  
  let retryCount = 0;
  const maxRetries = 3;
  
  // Special function that ALWAYS syncs bidirectionally
  const syncBidirectional = async () => {
    try {
      // 1. First load our local cart from memory or localStorage
      let localCart = [];
      if (window.AuricCart && window.AuricCart.items) {
        localCart = [...window.AuricCart.items];
      } else {
        // Try to get from localStorage as fallback
        try {
          const storedCart = localStorage.getItem('auricCart');
          if (storedCart) {
            localCart = JSON.parse(storedCart);
          }
        } catch (err) {
          console.error("Error parsing localStorage cart:", err);
        }
      }
      
      console.log("Local cart has", localCart.length, "items");
      
      // 2. Get cart from Firestore
      const db = firebase.firestore();
      const cartRef = db.collection('carts').doc(userId);
      const doc = await cartRef.get();
      
      let serverCart = [];
      if (doc.exists && doc.data().items) {
        serverCart = doc.data().items;
      }
      
      console.log("Server cart has", serverCart.length, "items");
      
      // Special handling for deleted items tracking
      let deletedItemsTracking = [];
      try {
        const deletedItemsJSON = localStorage.getItem('auricCartDeletedItems');
        if (deletedItemsJSON) {
          notification.textContent = 'Syncing deleted items...';
          deletedItemsTracking = JSON.parse(deletedItemsJSON);
        }
      } catch (err) {
        console.error("Error parsing deleted items:", err);
      }
      
      // 3. Merge carts with special rules
      // - Local items override server items of same ID
      // - Ensure all deleted items are removed
      const mergedCart = [];
      
      // First add all local items
      for (const localItem of localCart) {
        // Skip any potentially deleted items
        const isDeleted = deletedItemsTracking.some(id => 
          id === localItem.productId || 
          (localItem.productId && localItem.productId.toString() === id.toString())
        );
        
        if (!isDeleted) {
          mergedCart.push(localItem);
        }
      }
      
      // Then add server items that don't exist locally
      for (const serverItem of serverCart) {
        const existsLocally = mergedCart.some(item => 
          item.productId === serverItem.productId ||
          (item.productId && serverItem.productId && 
           item.productId.toString() === serverItem.productId.toString())
        );
        
        const isDeleted = deletedItemsTracking.some(id => 
          id === serverItem.productId || 
          (serverItem.productId && serverItem.productId.toString() === id.toString())
        );
        
        if (!existsLocally && !isDeleted) {
          mergedCart.push(serverItem);
        }
      }
      
      console.log("Merged cart has", mergedCart.length, "items");
      
      // This is crucial for deletion sync
      localStorage.removeItem('auricCartDeletedItems');
      
      // 4. Save merged cart to Firestore first
      window.AuricCart.showSyncStatus('Pushing changes to server...');
      
      const deviceId = `forced_sync_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
      const timestamp = Date.now();
      
      await cartRef.set({
        items: mergedCart,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        device: deviceId,
        operation: 'force_sync',
        version: timestamp.toString()
      });
      
      // 5. Update our local cart and localStorage
      if (window.AuricCart) {
        window.AuricCart.items = [...mergedCart];
        window.AuricCart.saveCartToLocalStorage();
        window.AuricCart.updateCartUI();
      }
      
      notification.textContent = 'Cart synchronized successfully!';
      notification.style.background = 'rgba(0,128,0,0.8)';
      
      // Clear deleted items tracking after a successful sync
      localStorage.removeItem('auricCartDeletedItems');
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        notification.style.opacity = 0;
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 3000);
      
      console.log("Bidirectional sync complete. Cart has", window.AuricCart.items.length, "items.");
      
    } catch (error) {
      console.error("Error during bidirectional sync:", error);
      
      if (retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000;
        
        notification.textContent = `Sync attempt ${retryCount} failed. Retrying in ${delay/1000}s...`;
        
        console.log(`Retrying sync in ${delay}ms (attempt ${retryCount} of ${maxRetries})`);
        setTimeout(() => syncBidirectional(), delay);
      } else {
        console.error("Failed to sync after", maxRetries, "attempts");
        
        notification.style.background = 'rgba(255,0,0,0.8)';
        notification.textContent = 'Could not sync with server. Please try again later.';
        
        setTimeout(() => {
          notification.style.opacity = 0;
          setTimeout(() => {
            notification.remove();
          }, 300);
        }, 5000);
      }
    }
  };
  
  // Start the sync process
  syncBidirectional();
};

// When the DOM is fully loaded
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
      
      // Setup authentication listener
      this.setupAuthListener();
      
      console.log('Cart system initialized');
    },
    
    /**
     * Setup sliding cart panel functionality
     */
    setupCartPanel: function() {
      if (!this.cartPanel || !this.cartToggle || !this.cartOverlay || !this.closeCartBtn) {
        console.warn('Cart panel elements not found - skipping setup');
        return;
      }
      
      console.log('Setting up cart panel with elements:', {
        cartToggle: this.cartToggle,
        closeCartBtn: this.closeCartBtn,
        cartOverlay: this.cartOverlay,
        cartPanel: this.cartPanel
      });
      
      // Add click event listener to cart toggle
      console.log('Adding click event listener to cart toggle');
      this.cartToggle.addEventListener('click', (event) => {
        event.preventDefault();
        this.openCartPanel();
      });
      
      // Add click event listener to close button
      this.closeCartBtn.addEventListener('click', () => {
        this.closeCartPanel();
      });
      
      // Add click event listener to overlay
      this.cartOverlay.addEventListener('click', () => {
        this.closeCartPanel();
      });
    },
    
    /**
     * Open the sliding cart panel
     */
    openCartPanel: function() {
      if (!this.cartPanel || !this.cartOverlay) return;
      
      this.cartPanel.style.right = '0';
      this.cartPanel.classList.add('active');
      this.cartOverlay.style.display = 'block';
      this.cartOverlay.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scrolling
      
      // Update cart items display
      this.renderCartItems();
    },
    
    /**
     * Close the sliding cart panel
     * @param {boolean} isInit - Whether this is being called during initialization
     */
    closeCartPanel: function(isInit) {
      if (!this.cartPanel || !this.cartOverlay) return;
      
      console.log('Closing cart panel, isInit:', isInit);
      
      if (isInit) {
        console.log('Setting initial cart panel styles (hidden state)');
        this.cartPanel.style.right = '-400px';
        this.cartOverlay.style.display = 'none';
      } else {
        this.cartPanel.style.right = '-400px';
        this.cartPanel.classList.remove('active');
        this.cartOverlay.style.display = 'none';
        this.cartOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
      }
    },
    
    /**
     * Load cart items from localStorage or Firestore based on authentication status
     */
    loadCart: function() {
      // Check if user is authenticated with Firebase
      if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
        console.log('User is authenticated:', firebase.auth().currentUser.email);
        this.loadCartFromFirestore(firebase.auth().currentUser.uid);
      } else {
        console.log('User is not authenticated');
        this.loadCartFromLocalStorage();
      }
    },
    
    /**
     * Load cart from localStorage for anonymous users
     */
    loadCartFromLocalStorage: function() {
      try {
        const cartData = localStorage.getItem('auricCart');
        if (cartData) {
          this.items = JSON.parse(cartData);
          console.log('Cart loaded from localStorage:', this.items);
        } else {
          console.log('No cart found in localStorage');
          this.items = [];
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        this.items = [];
      }
    },
    
    /**
     * Load cart from Firestore for authenticated users
     * Simplified to ensure consistent behavior
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
     * Simplified to focus on reliability
     */
    saveCartToFirestore: function(userId) {
      if (!userId) {
        console.error('Cannot save to Firestore: No user ID provided');
        return Promise.reject(new Error('No user ID provided'));
      }
      
      // SIMPLIFICATION: Only check for actual order completion
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
      
      // Instead of updating the Firestore document, we'll completely replace it
      // This ensures deletion operations are properly synced across devices
      return db.collection('carts').doc(userId).set({
        items: this.items,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastOperation: this.lastOperation || 'update', 
        operationTimestamp: Date.now(),
        lastSyncedDevice: navigator.userAgent,
        deviceId: this.deviceId, 
        lastSyncedAt: new Date().toISOString(),
        cartVersion: cartVersion,
        itemCount: this.items.length 
      }, { merge: false })
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
            <button class="remove-btn" data-index="${index}">Remove</button>
          </div>
        `;
        
        container.appendChild(itemElement);
      });
      
      // Add checkout button at the bottom
      const checkoutContainer = document.createElement('div');
      checkoutContainer.className = 'sliding-cart-checkout-container';
      
      // Calculate cart subtotal
      const subtotal = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      
      checkoutContainer.innerHTML = `
        <div class="sliding-cart-subtotal">
          <span>Subtotal:</span>
          <span class="subtotal-amount">₹${subtotal.toLocaleString('en-IN')}</span>
        </div>
        <a href="checkout.html" class="sliding-cart-checkout-btn">Checkout</a>
        <a href="cart.html" class="sliding-cart-view-cart-btn">View Cart</a>
      `;
      
      container.appendChild(checkoutContainer);
      
      // Setup event listeners for the quantity and remove buttons
      this.setupCartItemButtons();
    },
    
    /**
     * Setup event listeners for cart item buttons using direct binding
     * with better error handling
     */
    setupCartItemButtons: function() {
      if (!this.slidingCartItemsContainer) return;
      
      // Add increment buttons
      const incrementButtons = this.slidingCartItemsContainer.querySelectorAll('.quantity-btn.increment');
      incrementButtons.forEach(button => {
        button.addEventListener('click', () => {
          try {
            const index = parseInt(button.getAttribute('data-index'));
            if (isNaN(index) || index < 0 || index >= this.items.length) return;
            
            this.items[index].quantity += 1;
            this.items[index].updatedAt = new Date().toISOString();
            
            this.saveCart();
            this.renderCartItems();
          } catch (err) {
            console.error('Error incrementing quantity:', err);
          }
        });
      });
      
      // Add decrement buttons
      const decrementButtons = this.slidingCartItemsContainer.querySelectorAll('.quantity-btn.decrement');
      decrementButtons.forEach(button => {
        button.addEventListener('click', () => {
          try {
            const index = parseInt(button.getAttribute('data-index'));
            if (isNaN(index) || index < 0 || index >= this.items.length) return;
            
            if (this.items[index].quantity <= 1) {
              // If quantity is 1, remove the item
              this.removeItem(index);
            } else {
              this.items[index].quantity -= 1;
              this.items[index].updatedAt = new Date().toISOString();
              
              this.saveCart();
              this.renderCartItems();
            }
          } catch (err) {
            console.error('Error decrementing quantity:', err);
          }
        });
      });
      
      // Add remove buttons
      const removeButtons = this.slidingCartItemsContainer.querySelectorAll('.remove-btn');
      removeButtons.forEach(button => {
        button.addEventListener('click', () => {
          try {
            const index = parseInt(button.getAttribute('data-index'));
            if (isNaN(index) || index < 0 || index >= this.items.length) return;
            
            this.removeItem(index);
          } catch (err) {
            console.error('Error removing item:', err);
          }
        });
      });
    },
    
    /**
     * Update cart total in the sliding cart panel
     */
    updateCartTotal: function() {
      const subtotal = this.calculateSubtotal();
      
      // Update all subtotal elements
      const subtotalElements = document.querySelectorAll('.subtotal-amount');
      subtotalElements.forEach(element => {
        element.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
      });
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
    addItem: function(productData) {
      // Check if the item already exists in the cart
      const existingItemIndex = this.items.findIndex(item => 
        item.productId === productData.productId &&
        item.variant === productData.variant
      );
      
      if (existingItemIndex !== -1) {
        // Item exists, increment quantity
        this.items[existingItemIndex].quantity += productData.quantity || 1;
        this.items[existingItemIndex].updatedAt = new Date().toISOString();
        this.lastOperation = 'increment';
      } else {
        // Item doesn't exist, add it to cart
        const newItem = {
          ...productData,
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          quantity: productData.quantity || 1
        };
        
        this.items.push(newItem);
        this.lastOperation = 'add';
      }
      
      // Save the updated cart
      this.saveCart();
      
      // Update the UI
      this.updateCartUI();
    },
    
    /**
     * Remove item from cart - COMPLETELY REVISED
     * Now with proper tracking for synchronization
     */
    removeItem: function(index) {
      // Check index is valid
      if (index < 0 || index >= this.items.length) return;
      
      // Get product ID for potential tracking
      const productId = this.items[index].productId;
      
      // Track deletion for proper sync
      if (productId) {
        try {
          // Keep track of deleted items to ensure they don't reappear during syncing
          let deletedItems = [];
          try {
            const deletedItemsJSON = localStorage.getItem('auricCartDeletedItems');
            if (deletedItemsJSON) {
              deletedItems = JSON.parse(deletedItemsJSON);
            }
          } catch (e) {
            console.error('Error parsing deleted items:', e);
            deletedItems = [];
          }
          
          // Add this product ID to the deleted items list if not already there
          if (!deletedItems.includes(productId)) {
            deletedItems.push(productId);
            localStorage.setItem('auricCartDeletedItems', JSON.stringify(deletedItems));
          }
        } catch (e) {
          console.error('Error tracking deleted item:', e);
        }
      }
      
      // Remove the item
      this.items.splice(index, 1);
      this.lastOperation = 'remove';
      
      // Save the updated cart
      this.saveCart();
      
      // Update the UI
      this.updateCartUI();
    },
    
    /**
     * Increment item quantity
     */
    incrementItemQuantity: function(index) {
      if (index < 0 || index >= this.items.length) return;
      
      this.items[index].quantity += 1;
      this.items[index].updatedAt = new Date().toISOString();
      this.lastOperation = 'increment';
      
      this.saveCart();
      this.updateCartUI();
    },
    
    /**
     * Decrement item quantity
     */
    decrementItemQuantity: function(index) {
      if (index < 0 || index >= this.items.length) return;
      
      if (this.items[index].quantity <= 1) {
        // If quantity is 1, remove the item
        this.removeItem(index);
      } else {
        this.items[index].quantity -= 1;
        this.items[index].updatedAt = new Date().toISOString();
        this.lastOperation = 'decrement';
        
        this.saveCart();
        this.updateCartUI();
      }
    },
    
    /**
     * Save cart to storage (localStorage or Firestore)
     */
    saveCart: function() {
      // Always save to localStorage first (for anonymous users and backup)
      this.saveCartToLocalStorage();
      
      // If user is authenticated, also save to Firestore
      if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
        this.saveCartToFirestore(firebase.auth().currentUser.uid);
      }
    },
    
    /**
     * Setup event listeners for cart functionality
     */
    setupEventListeners: function() {
      // Add event listeners for add to cart buttons on product list
      document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', this.handleAddToCartClick.bind(this));
      });
      
      // Add event listener for add to cart button on product detail
      const detailAddToCartBtn = document.getElementById('addToCartBtn');
      if (detailAddToCartBtn) {
        detailAddToCartBtn.addEventListener('click', this.handleDetailAddToCartClick.bind(this));
      }
    },
    
    /**
     * Handle add to cart button click on product listing
     */
    handleAddToCartClick: function(event) {
      event.preventDefault();
      
      const productElement = event.target.closest('.product');
      if (!productElement) return;
      
      // Get product data from the element
      const productId = productElement.getAttribute('data-product-id');
      const name = productElement.querySelector('.product-name')?.textContent || 'Unknown Product';
      const price = parseFloat(productElement.getAttribute('data-price') || '0');
      const image = productElement.querySelector('img')?.src || '';
      
      // Add product to cart
      this.addItem({
        productId,
        name,
        price,
        image,
        quantity: 1
      });
      
      // Show confirmation
      this.showAddToCartConfirmation(name);
    },
    
    /**
     * Handle add to cart button click on product detail page
     */
    handleDetailAddToCartClick: function(event) {
      event.preventDefault();
      
      // Get product data from the detail page
      const productDetailElement = document.querySelector('.product-detail');
      if (!productDetailElement) return;
      
      const productId = productDetailElement.getAttribute('data-product-id');
      const name = document.querySelector('.product-title')?.textContent || 'Unknown Product';
      const priceStr = document.querySelector('.product-price')?.textContent || '₹0';
      const price = parseFloat(priceStr.replace(/[^\d.]/g, ''));
      const image = document.querySelector('.product-main-image img')?.src || '';
      const quantityInput = document.getElementById('quantity');
      const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
      
      // Get selected variant if applicable
      const variantSelect = document.getElementById('variant');
      const variant = variantSelect ? variantSelect.value : null;
      
      // Add product to cart
      this.addItem({
        productId,
        name,
        price,
        image,
        quantity,
        variant
      });
      
      // Show confirmation
      this.showAddToCartConfirmation(name);
    },
    
    /**
     * Show confirmation message after adding to cart
     */
    showAddToCartConfirmation: function(productName) {
      // Create confirmation element if it doesn't exist
      let confirmation = document.getElementById('add-to-cart-confirmation');
      if (!confirmation) {
        confirmation = document.createElement('div');
        confirmation.id = 'add-to-cart-confirmation';
        confirmation.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background-color: #4CAF50; color: white; padding: 16px; border-radius: 4px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); z-index: 9999; transition: opacity 0.3s ease; display: none;';
        document.body.appendChild(confirmation);
      }
      
      // Update text
      confirmation.innerHTML = `
        <div>${productName} added to cart</div>
        <div style="margin-top: 8px;">
          <a href="cart.html" style="color: white; text-decoration: underline; margin-right: 16px;">View Cart</a>
          <a href="checkout.html" style="color: white; text-decoration: underline;">Checkout</a>
        </div>
      `;
      
      // Show confirmation
      confirmation.style.display = 'block';
      confirmation.style.opacity = '1';
      
      // Hide after 3 seconds
      setTimeout(() => {
        confirmation.style.opacity = '0';
        setTimeout(() => {
          confirmation.style.display = 'none';
        }, 300);
      }, 3000);
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
          
          // Set up real-time Firestore listener for critical updates
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
     * SIMPLIFIED: Removed aggressive syncing which was causing cart loss issues
     */
    startPeriodicSync: function(userId) {
      // Clear any existing sync interval
      this.stopPeriodicSync();
      
      // Set up a real-time Firestore listener for critical updates
      // This is the only sync mechanism we need - polling was causing issues
      this.setupFirestoreListener(userId);
      
      // Log that we're only using the Firestore listener now
      console.log('Using real-time Firestore listener only - periodic polling disabled');
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
            // SIMPLIFIED APPROACH: Only check for order completion
            const orderCompleted = localStorage.getItem('orderCompleted') === 'true';
            
            // Never update the cart if an order was just completed
            if (orderCompleted) {
              console.log('Order was completed - ignoring Firestore update');
              return;
            }
            
            // Only proceed if the document exists
            if (doc.exists && !this.isUpdatingFirestore) {
              console.log('Received cart update from Firestore');
              
              const serverData = doc.data();
              
              // Only update if there are items in the server data
              if (serverData && serverData.items) {
                // Note the number of items for logging
                const serverItemCount = serverData.items.length;
                console.log(`Server has ${serverItemCount} items in cart`);
                
                // Update our cart with server items
                this.items = serverData.items;
                
                // Save to localStorage as backup
                localStorage.setItem('auricCart', JSON.stringify(this.items));
                localStorage.setItem('auricCartItems', JSON.stringify(this.items));
                
                // Update the UI
                this.updateCartUI();
                this.renderCartItems();
                
                // Show a notification if items were added
                if (serverItemCount > 0) {
                  this.showSyncStatus('Cart updated');
                }
              }
            }
          }, error => {
            console.error('Error in Firestore listener:', error);
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
          
          console.log('EMERGENCY CLEARING Firestore cart for user:', userId);
          
          // Set these flags to prevent our own clear from being overridden
          if (AuricCart) {
            AuricCart.isEmergencyClear = true;
            AuricCart.emergencyClearTimestamp = timestamp;
            AuricCart.isUpdatingFirestore = true;
          }
          
          db.collection('carts').doc(userId).set({
            items: [],
            updatedAt: new Date().toISOString(),
            device: deviceId,
            operation: 'emergency_clear',
            version: timestamp.toString(),
            clear_timestamp: timestamp,
            emergency_cleared: true,
            emergency_clear_timestamp: timestamp,
            ignore_sync: true,
            max_priority: true
          }).then(() => {
            console.log('Firestore cart EMERGENCY cleared successfully');
            
            // Reset isUpdatingFirestore after a delay
            setTimeout(() => {
              if (AuricCart) {
                AuricCart.isUpdatingFirestore = false;
              }
            }, 5000);
          }).catch(err => {
            console.error('CRITICAL: Error clearing Firestore cart:', err);
            
            if (AuricCart) {
              AuricCart.isUpdatingFirestore = false;
            }
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
        
        // Update UI
        AuricCart.updateCartUI();
      }
    } catch (cartResetError) {
      console.error('Error resetting cart object:', cartResetError);
    }
    
    // Return a promise that resolves after all operations are complete
    return Promise.resolve(true);
  };
});