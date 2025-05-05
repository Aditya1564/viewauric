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
 */

// Direct minimal cart panel functionality - as a global fallback
function setupDirectCartToggle() {
  console.log('Setting up direct cart toggle as additional failsafe');
  
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
      const cartToggleElement = document.querySelector('.cart-toggle');
      if (cartToggleElement) {
        console.log('Adding direct click event to cart toggle as fallback');
        cartToggleElement.addEventListener('click', (e) => {
          e.preventDefault();
          console.log('Cart toggle clicked (direct), opening panel');
          this.openCartPanel();
        });
      }
    },
    
    /**
     * Setup sliding cart panel functionality
     */
    setupCartPanel: function() {
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
        // Remove active classes
        panel.classList.remove('active');
        overlay.classList.remove('active');
        
        // Set explicit styles on initialization to ensure it's properly hidden
        if (isInit) {
          console.log('Setting initial cart panel styles (hidden state)');
          panel.style.right = '-100%';
          overlay.style.display = 'none';
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
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // User is logged in, load from Firestore
        this.loadCartFromFirestore(currentUser.uid);
      } else {
        // User is anonymous, load from localStorage
        this.loadCartFromLocalStorage();
      }
    },
    
    /**
     * Load cart from localStorage for anonymous users
     */
    loadCartFromLocalStorage: function() {
      const savedCart = localStorage.getItem('auricCart');
      if (savedCart) {
        try {
          this.items = JSON.parse(savedCart);
          console.log('Cart loaded from localStorage:', this.items);
        } catch (error) {
          console.error('Error parsing cart from localStorage:', error);
          this.items = [];
        }
      } else {
        this.items = [];
      }
    },
    
    /**
     * Load cart from Firestore for authenticated users
     */
    loadCartFromFirestore: function(userId) {
      db.collection('carts').doc(userId).get()
        .then((doc) => {
          if (doc.exists && doc.data().items) {
            this.items = doc.data().items;
            console.log('Cart loaded from Firestore:', this.items);
            this.updateCartUI();
          } else {
            console.log('No cart found in Firestore, creating new cart');
            this.items = [];
            this.saveCartToFirestore(userId);
          }
        })
        .catch((error) => {
          console.error('Error loading cart from Firestore:', error);
          // Fallback to localStorage if Firestore fails
          this.loadCartFromLocalStorage();
        });
    },
    
    /**
     * Save cart to localStorage for anonymous users
     */
    saveCartToLocalStorage: function() {
      localStorage.setItem('auricCart', JSON.stringify(this.items));
      console.log('Cart saved to localStorage:', this.items);
    },
    
    /**
     * Save cart to Firestore for authenticated users
     */
    saveCartToFirestore: function(userId) {
      if (!userId) {
        console.error('Cannot save to Firestore: No user ID provided');
        return;
      }
      
      db.collection('carts').doc(userId).set({
        items: this.items,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        console.log('Cart saved to Firestore successfully');
      })
      .catch((error) => {
        console.error('Error saving cart to Firestore:', error);
        // Fallback to localStorage
        this.saveCartToLocalStorage();
      });
    },
    
    /**
     * Sync localStorage cart with Firestore when user logs in
     */
    syncCartOnLogin: function(userId) {
      // First, check if user already has a cart in Firestore
      db.collection('carts').doc(userId).get()
        .then((doc) => {
          let firestoreItems = [];
          if (doc.exists && doc.data().items) {
            firestoreItems = doc.data().items;
          }
          
          // Then get localStorage cart
          const localStorageCart = localStorage.getItem('auricCart');
          let localItems = [];
          if (localStorageCart) {
            try {
              localItems = JSON.parse(localStorageCart);
            } catch (error) {
              console.error('Error parsing cart from localStorage:', error);
            }
          }
          
          // Merge the carts (giving priority to Firestore for duplicates)
          const mergedItems = this.mergeCarts(localItems, firestoreItems);
          
          // Update the cart with merged items
          this.items = mergedItems;
          
          // Save the merged cart to Firestore
          this.saveCartToFirestore(userId);
          
          // Update the UI
          this.updateCartUI();
          
          console.log('Cart synced successfully after login');
        })
        .catch((error) => {
          console.error('Error syncing cart on login:', error);
        });
    },
    
    /**
     * Merge two carts, giving priority to the second cart for duplicates
     */
    mergeCarts: function(cart1, cart2) {
      const mergedCart = [...cart1];
      
      // Add items from cart2 that aren't in cart1
      cart2.forEach(item2 => {
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
        
        // Different layout for sliding cart
        itemElement.innerHTML = `
          <div class="cart-item-image">
            <img src="${item.image || 'images/product-category/IMG_20250504_150241.jpg'}" alt="${item.name}">
          </div>
          <div class="cart-item-details">
            <h3 class="cart-item-name">${item.name}</h3>
            <div class="cart-item-price-row">
              <p class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</p>
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
     * Setup event listeners for cart item buttons
     */
    setupCartItemEventListeners: function() {
      // Quantity increment/decrement buttons
      const decrementButtons = document.querySelectorAll('.quantity-btn.decrement');
      const incrementButtons = document.querySelectorAll('.quantity-btn.increment');
      const removeButtons = document.querySelectorAll('.remove-item-btn');
      
      decrementButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const index = parseInt(e.target.getAttribute('data-index'));
          this.decrementQuantity(index);
        });
      });
      
      incrementButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const index = parseInt(e.target.getAttribute('data-index'));
          this.incrementQuantity(index);
        });
      });
      
      removeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const index = parseInt(e.target.getAttribute('data-index'));
          this.removeItem(index);
        });
      });
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
     * Add item to cart
     */
    addItem: function(productItem) {
      // Check if item already exists in cart
      const existingItemIndex = this.items.findIndex(item => 
        item.productId === productItem.productId &&
        item.variant === productItem.variant
      );
      
      if (existingItemIndex !== -1) {
        // Item exists, update quantity
        this.items[existingItemIndex].quantity += productItem.quantity;
      } else {
        // Item doesn't exist, add it
        this.items.push(productItem);
      }
      
      // Save cart
      this.saveCart();
      
      // Update UI
      this.updateCartUI();
      
      return true;
    },
    
    /**
     * Remove item from cart
     */
    removeItem: function(index) {
      if (index >= 0 && index < this.items.length) {
        // Remove item at the specified index
        this.items.splice(index, 1);
        
        // Save cart
        this.saveCart();
        
        // Update UI
        this.updateCartUI();
        
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
        
        // Save cart
        this.saveCart();
        
        // Update UI
        this.updateCartUI();
        
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
        
        // Save cart
        this.saveCart();
        
        // Update UI
        this.updateCartUI();
        
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
      
      // Get product information from the closest product item
      const productItem = e.target.closest('.product-item');
      if (!productItem) return;
      
      const productId = productItem.getAttribute('data-product-id') || 'unknown-product';
      const name = productItem.querySelector('.product-name')?.textContent || 'Product';
      const price = parseFloat(productItem.querySelector('.current-price')?.textContent.replace(/[^0-9.]/g, '')) || 0;
      const image = productItem.querySelector('.product-image img')?.src || '';
      
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
     */
    setupAuthListener: function() {
      auth.onAuthStateChanged((user) => {
        if (user) {
          // User signed in
          console.log('User signed in, syncing cart');
          this.syncCartOnLogin(user.uid);
        } else {
          // User signed out
          console.log('User signed out, loading cart from localStorage');
          this.loadCartFromLocalStorage();
          this.updateCartUI();
        }
      });
    }
  };
  
  // Initialize cart system
  AuricCart.init();
  
  // Make the cart available globally (for debugging and external access)
  window.AuricCart = AuricCart;
});