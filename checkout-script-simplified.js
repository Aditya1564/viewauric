/**
 * Auric Checkout Script
 * Handles the checkout process, including:
 * - Loading cart items from local storage
 * - Displaying items in the order summary
 * - Order form submission with account creation popup
 */

document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const STORAGE_KEY = 'auric_cart_items';
    
    // DOM Elements
    const orderSummaryContainer = document.getElementById('orderSummary');
    const orderTotalElement = document.getElementById('orderTotal');
    const checkoutForm = document.getElementById('checkoutForm');
    const productListContainer = document.getElementById('productList');
    
    // Load and display cart items
    function loadCartItems() {
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
    function updateLocalStorage(items) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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
    function handleSubmit(e) {
        e.preventDefault();
        
        const cartItems = loadCartItemsFromStorage();
        if (cartItems.length === 0) {
            showErrorModal('Your cart is empty. Please add products before placing an order.');
            return;
        }
        
        // Show account creation popup instead of proceeding with order
        showCreateAccountModal();
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
    function loadCartItemsFromStorage() {
        try {
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
        const errorMessageElement = document.getElementById('errorMessage');
        if (errorMessageElement) {
            errorMessageElement.textContent = message;
        }
        
        const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
        errorModal.show();
    }
    
    // Show order confirmation modal
    function showOrderConfirmation(orderData) {
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
                                <strong>₹${orderData.total.toFixed(2)}</strong>
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
                            <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
                        </div>
                    </div>
                </div>
            `;
            
            orderDetailsElement.innerHTML = detailsHTML;
        }
        
        // Show the confirmation modal
        const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        confirmationModal.show();
        
        // Set up the close button to redirect to homepage
        const closeButton = document.getElementById('closeConfirmationBtn');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                window.location.href = 'index.html';
            });
        }
    }
    
    // Initialize checkout page
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
        
        console.log('Checkout page initialized with cart items:', cartItems.length);
    }
    
    // Initialize the page
    init();
});