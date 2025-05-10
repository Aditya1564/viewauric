/**
 * Auric Checkout Script
 * Handles the checkout process, including:
 * - Loading cart items from local storage or Firebase (if user is logged in)
 * - Displaying items in the order summary
 * - Authentication requirement for order placement
 * - Order storage in Firebase under users/{userId}/orders
 * - Order form submission with Nodemailer email notifications via the server
 */

document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const STORAGE_KEY = 'auric_cart_items';
    let firebaseCartModule = null;
    let firebaseOrdersModule = null;
    
    // DOM Elements
    const orderSummaryContainer = document.getElementById('orderSummary');
    const orderTotalElement = document.getElementById('orderTotal');
    const checkoutForm = document.getElementById('checkoutForm');
    const productListContainer = document.getElementById('productList');
    
    // Try to load Firebase modules if available
    function initializeFirebaseIntegration() {
        try {
            // Check if Firebase is available
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth()) {
                console.log('Firebase auth available');
                
                // First check if FirebaseCartManager is available globally
                if (typeof FirebaseCartManager !== 'undefined') {
                    console.log('Using global FirebaseCartManager for checkout');
                    firebaseCartModule = FirebaseCartManager;
                }
            }
        } catch (error) {
            console.error('Error initializing Firebase:', error);
        }
        
        // Attempt to load firebase orders module if available
        try {
            if (typeof firebase !== 'undefined' && firebase.auth && typeof FirebaseOrderManager !== 'undefined') {
                console.log('Firebase orders module loaded for checkout');
                firebaseOrdersModule = FirebaseOrderManager;
            }
        } catch (error) {
            console.error('Error loading Firebase orders module:', error);
        }
    }
    
    /**
     * Update checkout button state based on authentication
     * If authentication is required, disable the button for non-authenticated users
     */
    function updateCheckoutButtonState() {
        if (!firebaseOrdersModule) return;
        
        const authRequirement = firebaseOrdersModule.checkOrderAuthRequirement();
        const submitButton = checkoutForm?.querySelector('button[type="submit"]');
        
        if (submitButton) {
            if (authRequirement.requiresAuth && !authRequirement.isAuthenticated) {
                // User is not authenticated but auth is required
                submitButton.innerHTML = 'Sign In to Place Order';
                submitButton.classList.add('auth-required');
                
                // Add special click handler for unauthenticated users
                submitButton.removeEventListener('click', showAuthRequirementModal);
                submitButton.addEventListener('click', showAuthRequirementModal);
            } else {
                // User is authenticated or auth is not required
                submitButton.innerHTML = 'Place Order';
                submitButton.classList.remove('auth-required');
                submitButton.removeEventListener('click', showAuthRequirementModal);
            }
        }
    }
    
    // Show modal requiring authentication before order placement
    function showAuthRequirementModal(e) {
        if (!firebaseOrdersModule) return;
        
        const authRequirement = firebaseOrdersModule.checkOrderAuthRequirement();
        
        if (authRequirement.requiresAuth && !authRequirement.isAuthenticated) {
            e.preventDefault();
            
            // Show the authentication modal
            const authModal = new bootstrap.Modal(document.getElementById('createAccountModal'));
            authModal.show();
        }
    }
    
    // Load cart from Firebase if user is logged in
    async function loadCartFromFirebase() {
        try {
            if (!firebaseCartModule || !firebase.auth().currentUser) {
                console.log('Firebase cart module not available or user not logged in');
                return { success: false, items: [] };
            }
            
            console.log('Loading cart from Firebase...');
            const result = await firebaseCartModule.getItems();
            
            if (result.success && result.items && result.items.length > 0) {
                console.log('Cart loaded from Firebase:', result.items);
                return result.items;
            } else {
                console.log('Firebase cart is empty or error loading cart');
                return [];
            }
        } catch (error) {
            console.error('Error loading cart from Firebase:', error);
            return [];
        }
    }
    
    // Load cart from local storage
    function loadCartFromLocalStorage() {
        try {
            console.log('Loading cart from local storage');
            
            // First check if we can use our new LocalStorageCart module
            if (typeof LocalStorageCart !== 'undefined' && LocalStorageCart.getItems) {
                // Use new LocalStorageCart module
                console.log('Using LocalStorageCart module');
                const result = LocalStorageCart.getItems();
                const cartItems = result.items || [];
                
                if (cartItems.length === 0) {
                    showEmptyCartMessage();
                }
                
                return cartItems;
            } else {
                // Fallback to direct localStorage access
                console.log('LocalStorageCart not available, using direct access');
                const savedCart = localStorage.getItem(STORAGE_KEY);
                
                if (savedCart) {
                    const cartItems = JSON.parse(savedCart);
                    
                    if (cartItems.length === 0) {
                        showEmptyCartMessage();
                    }
                    
                    return cartItems;
                } else {
                    showEmptyCartMessage();
                    return [];
                }
            }
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            showEmptyCartMessage();
            return [];
        }
    }
    
    // Load and display cart items - prioritizes Firebase if user is logged in
    async function loadCartItems() {
        // First check if we need to initialize Firebase
        initializeFirebaseIntegration();
        
        try {
            // Use Firebase if available and user is logged in, otherwise use local storage
            if (firebaseCartModule && firebase.auth && firebase.auth().currentUser) {
                console.log('User logged in, attempting to load cart from Firebase');
                const items = await loadCartFromFirebase();
                if (items && items.length > 0) {
                    return items;
                } else {
                    console.log('No items in Firebase cart, checking local storage');
                    return loadCartFromLocalStorage();
                }
            } else {
                console.log('User not logged in or Firebase not available, loading from local storage');
                return loadCartFromLocalStorage();
            }
        } catch (error) {
            console.error('Error in loadCartItems:', error);
            return loadCartFromLocalStorage();
        }
    }
    
    // Display cart items in the order summary
    function displayCartItems(items) {
        if (!items || items.length === 0) {
            showEmptyCartMessage();
            return;
        }
        
        let summaryHTML = '';
        let total = 0;
        
        items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            summaryHTML += `
                <div class="card mb-2 cart-item" data-item-id="${item.id}">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="me-3">
                                <img src="${item.image || 'https://via.placeholder.com/50'}" class="img-thumbnail" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover;">
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 class="mb-0">${item.name}</h6>
                                        <div class="text-muted small">₹${item.price.toFixed(2)} each</div>
                                    </div>
                                    <div class="d-flex flex-column align-items-end">
                                        <div class="mb-2">
                                            <div class="input-group input-group-sm quantity-control">
                                                <button type="button" class="btn btn-sm btn-quantity-minus" data-item-id="${item.id}">-</button>
                                                <span class="px-2 quantity-value" data-item-id="${item.id}">${item.quantity}</span>
                                                <button type="button" class="btn btn-sm btn-quantity-plus" data-item-id="${item.id}">+</button>
                                            </div>
                                        </div>
                                        <span class="fw-bold item-subtotal" data-item-id="${item.id}">₹${itemTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add hidden fields for form submission
            const hiddenItem = document.createElement('input');
            hiddenItem.type = 'hidden';
            hiddenItem.name = 'products[]';
            hiddenItem.className = 'product-data';
            hiddenItem.setAttribute('data-item-id', item.id);
            hiddenItem.value = JSON.stringify({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: itemTotal
            });
            
            if (productListContainer) {
                productListContainer.appendChild(hiddenItem);
            }
        });
        
        if (orderSummaryContainer) {
            orderSummaryContainer.innerHTML = summaryHTML;
            
            // Add event listeners to quantity buttons
            setupQuantityControls(items);
        }
        
        updateOrderTotal(items);
    }
    
    // Set up quantity control buttons
    function setupQuantityControls(items) {
        // Save items to the global variable to ensure it's up to date
        window.checkoutCartItems = items;
        
        // Get all plus buttons
        const plusButtons = document.querySelectorAll('.btn-quantity-plus');
        plusButtons.forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.getAttribute('data-item-id');
                incrementItemQuantity(itemId, items);
            });
        });
        
        // Get all minus buttons
        const minusButtons = document.querySelectorAll('.btn-quantity-minus');
        minusButtons.forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.getAttribute('data-item-id');
                decrementItemQuantity(itemId, items);
            });
        });
    }
    
    // Increment the quantity of an item
    function incrementItemQuantity(itemId, items) {
        const item = items.find(item => item.id === itemId);
        
        if (item) {
            item.quantity += 1;
            updateQuantityDisplay(itemId, item);
            updateOrderTotal(items);
            updateLocalStorage(items);
        }
    }
    
    // Decrement the quantity of an item
    function decrementItemQuantity(itemId, items) {
        const item = items.find(item => item.id === itemId);
        
        if (item && item.quantity > 1) {
            item.quantity -= 1;
            updateQuantityDisplay(itemId, item);
            updateOrderTotal(items);
            updateLocalStorage(items);
        }
    }
    
    // Update the quantity display
    function updateQuantityDisplay(itemId, item) {
        // Update the quantity value
        const quantityElement = document.querySelector(`.quantity-value[data-item-id="${itemId}"]`);
        if (quantityElement) {
            quantityElement.textContent = item.quantity;
        }
        
        // Update subtotal
        const itemTotal = item.price * item.quantity;
        const subtotalElement = document.querySelector(`.item-subtotal[data-item-id="${itemId}"]`);
        if (subtotalElement) {
            subtotalElement.textContent = `₹${itemTotal.toFixed(2)}`;
        }
        
        // Update hidden input field
        const hiddenInput = document.querySelector(`.product-data[data-item-id="${itemId}"]`);
        if (hiddenInput) {
            const productData = JSON.parse(hiddenInput.value);
            productData.quantity = item.quantity;
            productData.total = itemTotal;
            hiddenInput.value = JSON.stringify(productData);
        }
    }
    
    // Update order total
    function updateOrderTotal(items) {
        const total = calculateTotal(items);
        if (orderTotalElement) {
            orderTotalElement.textContent = `₹${total.toFixed(2)}`;
        }
    }
    
    // Update localStorage with current cart items
    // Also syncs with Firebase if user is logged in
    function updateLocalStorage(items) {
        try {
            // First try to use our new cart modules if available
            if (typeof LocalStorageCart !== 'undefined' && LocalStorageCart.saveItems) {
                // Use new LocalStorageCart module
                LocalStorageCart.saveItems(items);
                console.log('Cart updated using LocalStorageCart module');
            } else {
                // Fallback to direct localStorage
                localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
                console.log('Cart updated using direct localStorage access');
            }
            
            // If Firebase is available and user is logged in, also save to Firebase
            if (firebaseCartModule && firebase.auth && firebase.auth().currentUser) {
                firebaseCartModule.saveItems(items)
                    .then(() => console.log('Cart also saved to Firebase'))
                    .catch(error => console.error('Failed to save cart to Firebase:', error));
            }
        } catch (error) {
            console.error('Error updating local storage:', error);
        }
    }
    
    // Show empty cart message
    function showEmptyCartMessage() {
        if (orderSummaryContainer) {
            orderSummaryContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-shopping-cart me-2"></i>
                    Your cart is empty. Please add some products before checking out.
                </div>
                <div class="text-center mt-3">
                    <a href="index.html" class="btn btn-primary">Browse Products</a>
                </div>
            `;
        }
        
        if (orderTotalElement) {
            orderTotalElement.textContent = '₹0.00';
        }
        
        if (checkoutForm) {
            const submitButton = checkoutForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
            }
        }
    }
    
    // Handle form submission
    async function handleSubmit(e) {
        e.preventDefault();
        
        // Validate form
        if (!checkoutForm.checkValidity()) {
            e.stopPropagation();
            checkoutForm.classList.add('was-validated');
            return;
        }
        
        const formData = new FormData(checkoutForm);
        
        // Get cart items
        const cartItems = window.checkoutCartItems || await loadCartItemsFromStorage();
        
        if (!cartItems || cartItems.length === 0) {
            showErrorModal('Your cart is empty. Please add some products before checking out.');
            return;
        }
        
        // Prepare order data
        const orderData = {
            customer: {
                firstName: formData.get('firstName') || '',
                lastName: formData.get('lastName') || '',
                email: formData.get('email') || '',
                phone: formData.get('phone') || ''
            },
            address: {
                street: formData.get('address') || '',
                city: formData.get('city') || '',
                state: formData.get('state') || '',
                postalCode: formData.get('postalCode') || ''
            },
            paymentMethod: formData.get('paymentMethod') || 'card',
            products: cartItems.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            })),
            orderTotal: calculateTotal(cartItems),
            orderReference: generateOrderReference(),
            orderDate: new Date().toISOString(),
            notes: formData.get('notes') || ''
        };
        
        // Disable submit button and show loading state
        const submitButton = checkoutForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        
        try {
            // Save order to Firebase if the module is loaded and user is logged in
            if (firebaseOrdersModule) {
                console.log('Saving order to Firebase...');
                const saveResult = await firebaseOrdersModule.saveOrderToFirebase(orderData);
                
                if (!saveResult.success) {
                    if (saveResult.requiresAuth) {
                        // Authentication required but user is not logged in
                        console.log('Authentication required for order placement');
                        showCreateAccountModal();
                        
                        // Reset button state
                        submitButton.disabled = false;
                        submitButton.innerHTML = originalButtonText;
                        return;
                    } else {
                        // Other error occurred
                        throw new Error(saveResult.error || 'Failed to save order to Firebase');
                    }
                }
            }
            
            // Send order confirmation email via server
            const response = await fetch('/api/orders/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit order');
            }
            
            // Order successful, clear cart and show confirmation
            clearCart();
            showOrderConfirmation(orderData);
            
        } catch (error) {
            console.error('Error processing order:', error);
            showErrorModal(error.message || 'An error occurred while processing your order. Please try again.');
            
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }
    
    // Clear the cart after successful order
    function clearCart() {
        // Clear cart in localStorage
        if (typeof LocalStorageCart !== 'undefined' && LocalStorageCart.clearItems) {
            LocalStorageCart.clearItems();
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
        
        // Clear cart in Firebase if user is logged in
        if (firebaseCartModule && firebase.auth && firebase.auth().currentUser) {
            firebaseCartModule.clearItems()
                .catch(error => console.error('Failed to clear Firebase cart:', error));
        }
        
        // Update cart display
        window.checkoutCartItems = [];
    }
    
    // Show account creation modal
    function showCreateAccountModal() {
        const modal = new bootstrap.Modal(document.getElementById('createAccountModal'));
        modal.show();
    }
    
    // Load cart items from storage (localStorage or Firebase)
    async function loadCartItemsFromStorage() {
        // First check if we need to initialize Firebase
        initializeFirebaseIntegration();
        
        try {
            // Use Firebase if available and user is logged in, otherwise use local storage
            if (firebaseCartModule && firebase.auth && firebase.auth().currentUser) {
                console.log('Loading cart items from Firebase...');
                const items = await loadCartFromFirebase();
                return items;
            } else {
                console.log('Loading cart items from localStorage...');
                return loadCartFromLocalStorage();
            }
        } catch (error) {
            console.error('Error loading cart items from storage:', error);
            return [];
        }
    }
    
    // Calculate total price of all items
    function calculateTotal(items) {
        if (!items || items.length === 0) return 0;
        
        return items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }
    
    // Generate a unique order reference
    function generateOrderReference() {
        const timestamp = new Date().getTime().toString().slice(-6);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `AUR-${timestamp}-${random}`;
    }
    
    // Show error modal
    function showErrorModal(message) {
        const modal = new bootstrap.Modal(document.getElementById('errorModal'));
        document.getElementById('errorMessage').textContent = message;
        modal.show();
    }
    
    // Show order confirmation
    function showOrderConfirmation(orderData) {
        // Update confirmation details
        document.getElementById('orderReference').textContent = orderData.orderReference;
        
        // Show payment details if not cash on delivery
        const paymentDetails = document.getElementById('paymentDetails');
        if (orderData.paymentMethod !== 'Cash on Delivery' && orderData.paymentId) {
            paymentDetails.style.display = 'block';
            document.getElementById('paymentId').textContent = orderData.paymentId;
            document.getElementById('paymentMethod').textContent = orderData.paymentMethod;
        } else {
            paymentDetails.style.display = 'none';
        }
        
        // Format the order details
        let orderDetailsHTML = `
            <h5 class="mt-4">Order Summary</h5>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th class="text-center">Quantity</th>
                            <th class="text-end">Price</th>
                            <th class="text-end">Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Add each product
        orderData.products.forEach(product => {
            orderDetailsHTML += `
                <tr>
                    <td>${product.name}</td>
                    <td class="text-center">${product.quantity}</td>
                    <td class="text-end">₹${product.price.toFixed(2)}</td>
                    <td class="text-end">₹${product.total.toFixed(2)}</td>
                </tr>
            `;
        });
        
        // Add order total
        orderDetailsHTML += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colspan="3" class="text-end">Order Total:</th>
                            <th class="text-end">₹${orderData.orderTotal.toFixed(2)}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <h5 class="mt-4">Delivery Information</h5>
            <p>
                <strong>${orderData.customer.firstName} ${orderData.customer.lastName}</strong><br>
                ${orderData.address.street}<br>
                ${orderData.address.city}, ${orderData.address.state} ${orderData.address.postalCode}<br>
                <strong>Email:</strong> ${orderData.customer.email}<br>
                <strong>Phone:</strong> ${orderData.customer.phone}
            </p>
            
            <div class="alert alert-primary mt-4">
                <strong>Payment Method:</strong> ${orderData.paymentMethod}
            </div>
        `;
        
        // Set the HTML content
        document.getElementById('orderDetails').innerHTML = orderDetailsHTML;
        
        // Set up return to homepage button
        document.getElementById('closeConfirmationBtn').addEventListener('click', function() {
            window.location.href = 'index.html';
        });
        
        // Show the confirmation modal
        const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        confirmationModal.show();
    }
    
    // Initialize the page
    async function init() {
        console.log('Initializing checkout page...');
        
        try {
            // Load and display cart items - wait for this to complete
            const cartItems = await loadCartItems();
            
            // Display the cart items in the order summary
            displayCartItems(cartItems);
            
            // Store cart items in a global variable for quantity controls
            window.checkoutCartItems = cartItems;
            
            // Set up event listeners
            if (checkoutForm) {
                checkoutForm.addEventListener('submit', handleSubmit);
            }
            
            console.log('Checkout page initialized with cart items:', cartItems?.length || 0);
        } catch (error) {
            console.error('Error initializing checkout page:', error);
            showEmptyCartMessage();
        }
    }
    
    // Initialize the page asynchronously
    init().catch(error => {
        console.error('Failed to initialize checkout page:', error);
        showEmptyCartMessage();
    });
});