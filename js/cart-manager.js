/**
 * Auric Cart Manager
 * A comprehensive cart management system with local storage persistence
 * This single file handles all cart-related functionality including:
 * - Adding/removing items
 * - Updating quantities
 * - Saving/loading from local storage
 * - Cart UI updates
 */

// ======================================================
// SECTION 1: INITIALIZATION AND CORE FUNCTIONALITY
// ======================================================

const CartManager = (function() {
    // Private cart data storage
    let cartItems = [];
    const STORAGE_KEY = 'auric_cart_items';
    
    /**
     * Initialize the cart system
     * This runs when the page loads
     */
    function init() {
        console.log('Initializing cart system...');
        
        // Load cart data from local storage
        loadCartFromStorage();
        
        // Set up cart UI elements
        setupCartPanel();
        
        // Set up event listeners for add to cart buttons
        setupEventListeners();
        
        // Update UI to match current cart state
        updateCartUI();
        
        console.log('Cart system initialized with', cartItems.length, 'items');
    }
    
    /**
     * Load saved cart items from localStorage
     */
    function loadCartFromStorage() {
        try {
            const savedCart = localStorage.getItem(STORAGE_KEY);
            if (savedCart) {
                cartItems = JSON.parse(savedCart);
                console.log('Cart loaded from storage:', cartItems);
            }
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            cartItems = [];
        }
    }
    
    /**
     * Save current cart items to localStorage
     */
    function saveCartToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
            console.log('Cart saved to storage');
        } catch (error) {
            console.error('Error saving cart to storage:', error);
        }
    }
    
    // ======================================================
    // SECTION 2: CART DATA OPERATIONS
    // ======================================================
    
    /**
     * Add an item to the cart
     * @param {Object} product - The product to add
     * @param {Number} quantity - Quantity to add (default: 1)
     */
    function addToCart(product, quantity = 1) {
        if (!product || !product.id) {
            console.error('Invalid product', product);
            return;
        }
        
        // Check if item already exists in cart
        const existingItemIndex = cartItems.findIndex(item => item.id === product.id);
        
        if (existingItemIndex >= 0) {
            // Update quantity if item already exists
            cartItems[existingItemIndex].quantity += quantity;
            console.log('Updated quantity for', product.name);
        } else {
            // Add new item to cart
            cartItems.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity
            });
            console.log('Added new item to cart:', product.name);
        }
        
        // Save to storage and update UI
        saveCartToStorage();
        updateCartUI();
        
        // Show the cart panel
        openCartPanel();
    }
    
    /**
     * Remove an item from the cart
     * @param {String} productId - ID of the product to remove
     */
    function removeFromCart(productId) {
        const initialLength = cartItems.length;
        cartItems = cartItems.filter(item => item.id !== productId);
        
        if (cartItems.length !== initialLength) {
            console.log('Item removed from cart');
            saveCartToStorage();
            updateCartUI();
        }
    }
    
    /**
     * Update quantity of an item in the cart
     * @param {String} productId - ID of the product to update
     * @param {Number} newQuantity - New quantity (must be > 0)
     */
    function updateQuantity(productId, newQuantity) {
        const item = cartItems.find(item => item.id === productId);
        
        if (item) {
            // Ensure quantity is at least 1
            item.quantity = Math.max(1, newQuantity);
            console.log('Updated quantity for', item.name, 'to', item.quantity);
            saveCartToStorage();
            updateCartUI();
        }
    }
    
    /**
     * Increment quantity of an item
     * @param {String} productId - ID of the product to increment
     */
    function incrementQuantity(productId) {
        const item = cartItems.find(item => item.id === productId);
        if (item) {
            updateQuantity(productId, item.quantity + 1);
        }
    }
    
    /**
     * Decrement quantity of an item
     * @param {String} productId - ID of the product to decrement
     */
    function decrementQuantity(productId) {
        const item = cartItems.find(item => item.id === productId);
        if (item && item.quantity > 1) {
            updateQuantity(productId, item.quantity - 1);
        }
    }
    
    /**
     * Clear all items from the cart
     */
    function clearCart() {
        cartItems = [];
        saveCartToStorage();
        updateCartUI();
        console.log('Cart cleared');
    }
    
    /**
     * Calculate total price of all items in cart
     * @returns {Number} Total price
     */
    function calculateTotal() {
        return cartItems.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }
    
    /**
     * Calculate total number of items in cart
     * @returns {Number} Total item count
     */
    function getItemCount() {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    }
    
    // ======================================================
    // SECTION 3: UI INTERACTION
    // ======================================================
    
    /**
     * Set up the cart panel UI
     */
    function setupCartPanel() {
        // Create cart panel HTML if it doesn't exist
        if (!document.querySelector('.cart-panel')) {
            const cartPanelHTML = `
                <div class="cart-overlay"></div>
                <div class="cart-panel">
                    <div class="cart-panel-header">
                        <h3>Your Cart</h3>
                        <button class="close-cart-btn">&times;</button>
                    </div>
                    <div class="cart-items">
                        <!-- Cart items will be generated here -->
                    </div>
                    <div class="cart-panel-footer">
                        <div class="cart-panel-subtotal">
                            <span>Subtotal:</span>
                            <span class="subtotal-amount">₹0.00</span>
                        </div>
                        <div class="cart-panel-buttons">
                            <a href="#" class="view-cart-btn">Continue Shopping</a>
                            <a href="checkout.html" class="checkout-btn">Checkout</a>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', cartPanelHTML);
        }
        
        // Add cart icon to navigation
        const navIcons = document.querySelector('.nav-icons');
        if (navIcons) {
            // Check if cart icon already exists
            if (!navIcons.querySelector('.cart-icon-container')) {
                const cartIconHTML = `
                    <a href="#" class="icon-link cart-toggle">
                        <div class="cart-icon-container">
                            <i class="fas fa-shopping-cart"></i>
                            <span class="cart-count">0</span>
                        </div>
                    </a>
                `;
                
                navIcons.insertAdjacentHTML('beforeend', cartIconHTML);
            }
        }
    }
    
    /**
     * Set up all event listeners for cart functionality
     */
    function setupEventListeners() {
        // Delegate events to document to handle dynamically added elements
        document.addEventListener('click', function(e) {
            // Open cart panel when cart icon is clicked
            if (e.target.closest('.cart-toggle')) {
                e.preventDefault();
                toggleCartPanel();
            }
            
            // Close cart panel when close button or overlay is clicked
            if (e.target.closest('.close-cart-btn') || e.target.classList.contains('cart-overlay')) {
                closeCartPanel();
            }
            
            // Add to cart button click
            if (e.target.closest('.add-to-cart-btn') || e.target.closest('.add-to-cart-btn-small')) {
                e.preventDefault();
                
                const button = e.target.closest('.add-to-cart-btn') || e.target.closest('.add-to-cart-btn-small');
                const productContainer = button.closest('[data-product-id]');
                
                if (productContainer) {
                    const productId = productContainer.dataset.productId;
                    const productName = productContainer.querySelector('.product-name')?.textContent || 
                                       productContainer.querySelector('.product-title')?.textContent || 
                                       'Product';
                    
                    // Get price from the product (handle different formats)
                    let priceElem = productContainer.querySelector('.price-value') || 
                                   productContainer.querySelector('.current-price');
                    
                    // Extract price value (remove currency symbol, commas, etc.)
                    let price = 0;
                    if (priceElem) {
                        price = parseFloat(priceElem.textContent.replace(/[^0-9.]/g, ''));
                    }
                    
                    // Find image source
                    let imageSrc = '';
                    const imageElem = productContainer.querySelector('.product-image img') || 
                                     productContainer.querySelector('.main-product-image');
                    
                    if (imageElem) {
                        imageSrc = imageElem.src;
                    }
                    
                    // Get quantity if available (for product detail page)
                    let quantity = 1;
                    const quantityInput = productContainer.querySelector('.quantity-input');
                    if (quantityInput) {
                        quantity = parseInt(quantityInput.value) || 1;
                    }
                    
                    // Create product object
                    const product = {
                        id: productId,
                        name: productName,
                        price: price,
                        image: imageSrc
                    };
                    
                    // Add to cart
                    addToCart(product, quantity);
                }
            }
            
            // Quantity increment button click
            if (e.target.closest('.quantity-btn.increment')) {
                const productId = e.target.closest('.cart-item').dataset.productId;
                if (productId) {
                    incrementQuantity(productId);
                }
            }
            
            // Quantity decrement button click
            if (e.target.closest('.quantity-btn.decrement')) {
                const productId = e.target.closest('.cart-item').dataset.productId;
                if (productId) {
                    decrementQuantity(productId);
                }
            }
            
            // Remove item button click
            if (e.target.closest('.remove-item-btn')) {
                const productId = e.target.closest('.cart-item').dataset.productId;
                if (productId) {
                    removeFromCart(productId);
                }
            }
            
            // Continue shopping button click (close cart)
            if (e.target.closest('.view-cart-btn')) {
                e.preventDefault();
                closeCartPanel();
            }
        });
    }
    
    /**
     * Update all cart UI elements to reflect current cart state
     */
    function updateCartUI() {
        // Update cart count display
        const cartCountElements = document.querySelectorAll('.cart-count');
        const itemCount = getItemCount();
        
        cartCountElements.forEach(element => {
            element.textContent = itemCount;
            // Hide count if zero
            element.style.display = itemCount > 0 ? 'flex' : 'none';
        });
        
        // Update cart items display
        const cartItemsContainer = document.querySelector('.cart-items');
        if (cartItemsContainer) {
            if (cartItems.length === 0) {
                // Show empty cart message
                cartItemsContainer.innerHTML = '<div class="empty-cart-message">Your cart is empty</div>';
            } else {
                // Generate HTML for each cart item
                let cartItemsHTML = '';
                
                cartItems.forEach(item => {
                    const itemTotal = (item.price * item.quantity).toFixed(2);
                    
                    cartItemsHTML += `
                        <div class="cart-item" data-product-id="${item.id}">
                            <div class="cart-item-image">
                                <img src="${item.image}" alt="${item.name}">
                            </div>
                            <div class="cart-item-details">
                                <div class="cart-item-name">${item.name}</div>
                                <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
                                <div class="cart-item-quantity">
                                    <button class="quantity-btn decrement">-</button>
                                    <input type="text" class="quantity-input" value="${item.quantity}" readonly>
                                    <button class="quantity-btn increment">+</button>
                                </div>
                                <div class="cart-item-total">₹${itemTotal}</div>
                            </div>
                            <button class="remove-item-btn">&times;</button>
                        </div>
                    `;
                });
                
                cartItemsContainer.innerHTML = cartItemsHTML;
            }
        }
        
        // Update subtotal amount
        const subtotalElement = document.querySelector('.subtotal-amount');
        if (subtotalElement) {
            subtotalElement.textContent = `₹${calculateTotal().toFixed(2)}`;
        }
        
        // Update checkout button visibility
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.style.display = cartItems.length > 0 ? 'block' : 'none';
        }
    }
    
    /**
     * Open the cart panel
     */
    function openCartPanel() {
        const cartPanel = document.querySelector('.cart-panel');
        const cartOverlay = document.querySelector('.cart-overlay');
        
        if (cartPanel && cartOverlay) {
            cartPanel.classList.add('active');
            cartOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }
    }
    
    /**
     * Close the cart panel
     */
    function closeCartPanel() {
        const cartPanel = document.querySelector('.cart-panel');
        const cartOverlay = document.querySelector('.cart-overlay');
        
        if (cartPanel && cartOverlay) {
            cartPanel.classList.remove('active');
            cartOverlay.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        }
    }
    
    /**
     * Toggle the cart panel open/closed
     */
    function toggleCartPanel() {
        const cartPanel = document.querySelector('.cart-panel');
        
        if (cartPanel && cartPanel.classList.contains('active')) {
            closeCartPanel();
        } else {
            openCartPanel();
        }
    }
    
    // ======================================================
    // SECTION 4: PUBLIC API
    // ======================================================
    
    // Return public methods that will be accessible outside
    return {
        init: init,
        addToCart: addToCart,
        removeFromCart: removeFromCart,
        updateQuantity: updateQuantity,
        clearCart: clearCart,
        getCartItems: () => [...cartItems], // Return copy of items array
        getItemCount: getItemCount,
        calculateTotal: calculateTotal,
        openCartPanel: openCartPanel,
        closeCartPanel: closeCartPanel
    };
})();

// Initialize cart when page loads
document.addEventListener('DOMContentLoaded', function() {
    CartManager.init();
});
