/**
 * Auric Checkout Script
 * Handles the checkout process, including:
 * - Loading cart items from local storage
 * - Displaying items in the order summary
 * - Order form submission
 * - Saving order details
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
                <div class="card mb-2">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="me-3" style="width: 60px; height: 60px; overflow: hidden; border-radius: 4px;">
                                <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                            <div class="flex-grow-1">
                                <h6 class="mb-0">${item.name}</h6>
                                <div class="d-flex justify-content-between align-items-center mt-2">
                                    <small class="text-muted">₹${item.price.toFixed(2)} × ${item.quantity}</small>
                                    <span class="fw-bold">₹${itemTotal.toFixed(2)}</span>
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
        }
        
        if (orderTotalElement) {
            orderTotalElement.textContent = `₹${total.toFixed(2)}`;
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
        
        // Get form data
        const formData = new FormData(checkoutForm);
        const orderData = {
            customer: {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: formData.get('address')
            },
            paymentMethod: formData.get('paymentMethod'),
            notes: formData.get('notes'),
            products: cartItems,
            total: calculateTotal(cartItems),
            orderReference: generateOrderReference()
        };
        
        // Show confirmation modal
        showOrderConfirmation(orderData);
        
        // Clear cart after successful order
        localStorage.removeItem(STORAGE_KEY);
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
        loadCartItems();
        
        // Set up event listeners
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', handleSubmit);
        }
        
        console.log('Checkout page initialized');
    }
    
    // Initialize the page
    init();
});