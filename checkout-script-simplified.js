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
            if (typeof firebase !== 'undefined' && firebase.auth) {
                // Load Cart Module
                import('/js/firebase/firebase-cart.js')
                    .then(module => {
                        console.log('Firebase cart module loaded for checkout');
                        firebaseCartModule = module;
                        
                        // Check if user is logged in, if so, reload cart from Firebase
                        if (firebase.auth().currentUser) {
                            loadCartFromFirebase();
                        }
                    })
                    .catch(err => {
                        console.error('Failed to load Firebase cart module:', err);
                    });
                
                // Load Orders Module
                import('/js/firebase/firebase-orders.js')
                    .then(module => {
                        console.log('Firebase orders module loaded for checkout');
                        firebaseOrdersModule = module;
                        
                        // Check auth requirement and update UI accordingly
                        updateCheckoutButtonState();
                    })
                    .catch(err => {
                        console.error('Failed to load Firebase orders module:', err);
                    });
            } else {
                console.log('Firebase not available, using local storage only');
            }
        } catch (error) {
            console.error('Error initializing Firebase integration:', error);
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
            e.stopPropagation();
            
            // Show account creation modal
            showCreateAccountModal();
            return false;
        }
        
        return true;
    }
    
    // Load cart items from Firebase for logged in users
    async function loadCartFromFirebase() {
        try {
            if (!firebaseCartModule || !firebase.auth().currentUser) {
                return loadCartFromLocalStorage();
            }
            
            console.log('Loading cart from Firebase...');
            const result = await firebaseCartModule.loadCartFromFirebase();
            
            if (result.success && result.items.length > 0) {
                console.log('Cart loaded from Firebase:', result.items);
                displayCartItems(result.items);
                return result.items;
            } else {
                // Fall back to local storage if Firebase cart is empty or error occurs
                return loadCartFromLocalStorage();
            }
        } catch (error) {
            console.error('Error loading cart from Firebase:', error);
            return loadCartFromLocalStorage();
        }
    }
    
    // Load cart items from local storage
    function loadCartFromLocalStorage() {
        try {
            const savedCart = localStorage.getItem(STORAGE_KEY);
            
            if (savedCart) {
                const cartItems = JSON.parse(savedCart);
                
                if (cartItems.length === 0) {
                    showEmptyCartMessage();
                    return [];
                }
                
                displayCartItems(cartItems);
                return cartItems;
            } else {
                showEmptyCartMessage();
                return [];
            }
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            showEmptyCartMessage();
            return [];
        }
    }
    
    // Load and display cart items - prioritizes Firebase if user is logged in
    function loadCartItems() {
        // First check if we need to initialize Firebase
        initializeFirebaseIntegration();
        
        // Use Firebase if available and user is logged in, otherwise use local storage
        if (firebaseCartModule && firebase.auth().currentUser) {
            return loadCartFromFirebase();
        } else {
            return loadCartFromLocalStorage();
        }
    }
    
    // Display cart items in the order summary
    function displayCartItems(items) {
        let summaryHTML = '';
        let total = 0;
        
        items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            summaryHTML += `
                <div class="card mb-2 cart-item" data-item-id="${item.id}">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="me-3" style="width: 60px; height: 60px; overflow: hidden; border-radius: 4px;">
                                <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                            <div class="flex-grow-1">
                                <h6 class="mb-0">${item.name}</h6>
                                <div class="d-flex justify-content-between align-items-center mt-2">
                                    <div class="d-flex align-items-center">
                                        <span class="me-2">₹${item.price.toFixed(2)}</span>
                                        <div class="quantity-controls d-flex align-items-center border rounded">
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
        
        if (orderTotalElement) {
            orderTotalElement.textContent = `₹${total.toFixed(2)}`;
        }
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
                incrementItemQuantity(itemId, window.checkoutCartItems);
            });
        });
        
        // Get all minus buttons
        const minusButtons = document.querySelectorAll('.btn-quantity-minus');
        minusButtons.forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.getAttribute('data-item-id');
                decrementItemQuantity(itemId, window.checkoutCartItems);
            });
        });
    }
    
    // Increment item quantity
    function incrementItemQuantity(itemId, items) {
        // Update the items array
        const itemIndex = items.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            items[itemIndex].quantity += 1;
            
            // Update the display
            updateQuantityDisplay(itemId, items[itemIndex]);
            
            // Update the localStorage
            updateLocalStorage(items);
            
            // Update order total
            updateOrderTotal(items);
        }
    }
    
    // Decrement item quantity
    function decrementItemQuantity(itemId, items) {
        // Update the items array
        const itemIndex = items.findIndex(item => item.id === itemId);
        if (itemIndex !== -1 && items[itemIndex].quantity > 1) {
            items[itemIndex].quantity -= 1;
            
            // Update the display
            updateQuantityDisplay(itemId, items[itemIndex]);
            
            // Update the localStorage
            updateLocalStorage(items);
            
            // Update order total
            updateOrderTotal(items);
        }
    }
    
    // Update quantity display
    function updateQuantityDisplay(itemId, item) {
        // Update quantity value
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
            // Save to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
            
            // If Firebase cart module is loaded and user is logged in, also save to Firebase
            if (firebaseCartModule && firebase.auth && firebase.auth().currentUser) {
                firebaseCartModule.saveCartToFirebase(items)
                    .then(result => {
                        if (result.success) {
                            console.log('Cart updated in Firebase from checkout page');
                        } else {
                            console.warn('Failed to update cart in Firebase:', result.error);
                        }
                    })
                    .catch(err => {
                        console.error('Error updating Firebase cart:', err);
                    });
            }
        } catch (error) {
            console.error('Error saving cart to storage:', error);
        }
    }
    
    // Show empty cart message
    function showEmptyCartMessage() {
        if (orderSummaryContainer) {
            orderSummaryContainer.innerHTML = '<p class="text-center text-muted">Your cart is empty. Please add some products before checkout.</p>';
        }
        
        if (orderTotalElement) {
            orderTotalElement.textContent = '₹0.00';
        }
        
        // Disable the submit button
        const submitButton = checkoutForm?.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
        }
    }
    
    // Handle form submission
    async function handleSubmit(e) {
        e.preventDefault();
        
        // Check if the Firebase Orders module is loaded
        if (firebaseOrdersModule) {
            // Check if authentication is required for placing orders
            const authRequirement = firebaseOrdersModule.checkOrderAuthRequirement();
            
            if (authRequirement.requiresAuth && !authRequirement.isAuthenticated) {
                console.log('User authentication required for order placement');
                showCreateAccountModal();
                return;
            }
        }
        
        // Load cart items
        const cartItems = await loadCartItemsFromStorage();
        if (cartItems.length === 0) {
            showErrorModal('Your cart is empty. Please add products before placing an order.');
            return;
        }
        
        // Get form data for the order
        const formData = new FormData(checkoutForm);
        
        // Prepare order data with customer info and products
        const orderData = {
            customer: {
                firstName: formData.get('firstName') || '',
                lastName: formData.get('lastName') || '',
                email: formData.get('email') || '',
                phone: formData.get('phone') || '',
                address: formData.get('address') || '',
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
                
                // Store the Firebase order ID in the order data
                orderData.orderId = saveResult.orderId;
                console.log('Order saved to Firebase with ID:', saveResult.orderId);
            }
            
            // Send order confirmation emails using the Nodemailer server
            try {
                console.log('Sending order confirmation emails via Nodemailer server...');
                const emailServerUrl = window.location.origin + '/api/send-order-email';
                
                // Make API call to the email server
                const emailResponse = await fetch(emailServerUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderData)
                });
                
                const emailResult = await emailResponse.json();
                
                if (emailResult.success) {
                    console.log('Order confirmation emails sent successfully:', emailResult);
                } else {
                    console.warn('Failed to send order confirmation emails:', emailResult.message);
                    // Continue with order processing even if email sending fails
                }
            } catch (emailError) {
                console.error('Error sending order emails:', emailError);
                // Continue with order processing even if email sending fails
            }
            
            // Show order confirmation modal
            showOrderConfirmation(orderData);
            
            // Clear cart after successful order
            clearCart();
            
            // Reset form
            checkoutForm.reset();
            
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
            
        } catch (error) {
            console.error('Error processing order:', error);
            showErrorModal('There was an error processing your order. Please try again later.');
            
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }
    
    // Clear cart from both localStorage and Firebase
    function clearCart() {
        try {
            // Clear localStorage
            localStorage.removeItem(STORAGE_KEY);
            
            // Clear Firebase cart if user is logged in
            if (firebaseCartModule && firebase.auth && firebase.auth().currentUser) {
                firebaseCartModule.clearFirebaseCart()
                    .then(result => {
                        if (result.success) {
                            console.log('Cart cleared from Firebase after order submission');
                        } else {
                            console.warn('Failed to clear Firebase cart:', result.error);
                        }
                    })
                    .catch(err => {
                        console.error('Error clearing Firebase cart:', err);
                    });
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    }
    
    // Show create account modal
    function showCreateAccountModal() {
        // Create the modal HTML if it doesn't exist
        if (!document.getElementById('createAccountModal')) {
            const modalHTML = `
                <div class="modal fade" id="createAccountModal" tabindex="-1" aria-labelledby="createAccountModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="createAccountModalLabel">Create Account Required</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-info" role="alert">
                                    <i class="fas fa-info-circle me-2"></i>
                                    You need to create an account to complete your purchase.
                                </div>
                                <p>Please create an account or sign in to complete your order. Creating an account allows you to:</p>
                                <ul>
                                    <li>Track your order status</li>
                                    <li>Save your delivery information for future purchases</li>
                                    <li>View your order history</li>
                                    <li>Receive exclusive offers and discounts</li>
                                </ul>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <a href="login.html" class="btn btn-outline-primary">Sign In</a>
                                <a href="signup.html" class="btn btn-primary">Create Account</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
        
        // Show the modal
        const createAccountModal = new bootstrap.Modal(document.getElementById('createAccountModal'));
        createAccountModal.show();
    }
    
    // Load cart items from storage (utility function)
    // Checks Firebase first if user is logged in, then falls back to localStorage
    async function loadCartItemsFromStorage() {
        try {
            // Try to get cart from Firebase if user is logged in
            if (firebaseCartModule && firebase.auth && firebase.auth().currentUser) {
                try {
                    const result = await firebaseCartModule.loadCartFromFirebase();
                    if (result.success && result.items.length > 0) {
                        console.log('Cart loaded from Firebase for order processing');
                        return result.items;
                    }
                } catch (firebaseError) {
                    console.error('Error loading cart from Firebase:', firebaseError);
                    // Fall back to localStorage
                }
            }
            
            // Fall back to localStorage
            const savedCart = localStorage.getItem(STORAGE_KEY);
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            return [];
        }
    }
    
    // Calculate total price of cart items
    function calculateTotal(items) {
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    // Generate a random order reference
    function generateOrderReference() {
        const prefix = 'AURIC';
        const timestamp = new Date().getTime().toString().slice(-6);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}-${timestamp}-${random}`;
    }
    
    // Show error modal
    function showErrorModal(message) {
        // Create error modal if it doesn't exist
        if (!document.getElementById('errorModal')) {
            const modalHTML = `
                <div class="modal fade" id="errorModal" tabindex="-1" aria-labelledby="errorModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header bg-danger text-white">
                                <h5 class="modal-title" id="errorModalLabel">Error</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p id="errorMessage"></p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
        
        const errorMessageElement = document.getElementById('errorMessage');
        if (errorMessageElement) {
            errorMessageElement.textContent = message;
        }
        
        const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
        errorModal.show();
    }
    
    // Show order confirmation modal
    function showOrderConfirmation(orderData) {
        // Create confirmation modal if it doesn't exist
        if (!document.getElementById('confirmationModal')) {
            const modalHTML = `
                <div class="modal fade" id="confirmationModal" tabindex="-1" aria-labelledby="confirmationModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header bg-success text-white">
                                <h5 class="modal-title" id="confirmationModalLabel">Order Confirmed</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-success" role="alert">
                                    <i class="fas fa-check-circle me-2"></i>
                                    Your order has been placed successfully!
                                </div>
                                <p><strong>Order Reference:</strong> <span id="orderReference"></span></p>
                                <div id="orderDetails"></div>
                            </div>
                            <div class="modal-footer">
                                <a href="index.html" class="btn btn-primary">Continue Shopping</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
        
        const orderReferenceElement = document.getElementById('orderReference');
        const orderDetailsElement = document.getElementById('orderDetails');
        
        if (orderReferenceElement) {
            orderReferenceElement.textContent = orderData.orderReference;
        }
        
        if (orderDetailsElement) {
            let detailsHTML = `
                <div class="mt-4">
                    <h5>Order Summary</h5>
                    <div class="card">
                        <div class="card-body">
            `;
            
            orderData.products.forEach(item => {
                const itemTotal = item.price * item.quantity;
                detailsHTML += `
                    <div class="d-flex justify-content-between mb-2">
                        <span>${item.name} × ${item.quantity}</span>
                        <span>₹${itemTotal.toFixed(2)}</span>
                    </div>
                `;
            });
            
            detailsHTML += `
                            <hr>
                            <div class="d-flex justify-content-between">
                                <strong>Total</strong>
                                <strong>₹${orderData.orderTotal.toFixed(2)}</strong>
                            </div>
                        </div>
                    </div>
                    
                    <h5 class="mt-4">Customer Information</h5>
                    <div class="card">
                        <div class="card-body">
                            <p><strong>Name:</strong> ${orderData.customer.firstName} ${orderData.customer.lastName}</p>
                            <p><strong>Email:</strong> ${orderData.customer.email}</p>
                            <p><strong>Phone:</strong> ${orderData.customer.phone}</p>
                            <p><strong>Address:</strong> ${orderData.customer.address}</p>
                        </div>
                    </div>
                </div>
            `;
            
            orderDetailsElement.innerHTML = detailsHTML;
        }
        
        const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        confirmationModal.show();
    }
    
    // Initialize the page
    function init() {
        console.log('Initializing checkout page...');
        
        // Load and display cart items
        const cartItems = loadCartItems();
        
        // Store cart items in a global variable for quantity controls
        window.checkoutCartItems = cartItems;
        
        // Set up event listeners
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', handleSubmit);
        }
        
        console.log('Checkout page initialized with cart items:', cartItems?.length || 0);
    }
    
    // Initialize the page
    init();
});