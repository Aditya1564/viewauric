document.addEventListener('DOMContentLoaded', function() {
    // Add global flags for tracking authentication state
    window.authCheckAttempts = 0;
    window.isUserAuthenticated = false;
    window.cartLoadedForCheckout = false;
    
    // First try to get the current user synchronously
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
            console.log("User already authenticated on page load:", currentUser.email);
            window.isUserAuthenticated = true;
            loadCartItems();
            window.cartLoadedForCheckout = true;
        } else {
            console.log("No user found synchronously, checking auth state...");
            checkUserAuthenticationWithRetry();
        }
    } else {
        // Firebase not available, fall back to localStorage check
        const localUser = localStorage.getItem('currentUser');
        const userLoggedIn = localStorage.getItem('userLoggedIn');
        if ((localUser && localUser !== 'null') || userLoggedIn === 'true') {
            console.log("User authenticated via localStorage");
            window.isUserAuthenticated = true;
            loadCartItems();
            window.cartLoadedForCheckout = true;
        } else {
            console.log("No user found in localStorage, checking again...");
            checkUserAuthenticationWithRetry();
        }
    }
    
    // Form submission
    document.getElementById('checkoutForm').addEventListener('submit', handleOrderSubmit);

    // Initialize email functionality
    initEmailJS();
    
    // Note: updateOrderSummary will be called after loadCartItems only if user is authenticated
    
    // Add event listener for confirmation modal close button
    document.getElementById('closeConfirmationBtn').addEventListener('click', function() {
        // Make sure cart is cleared before redirecting
        try {
            console.log("Clearing cart before redirecting to homepage");
            if (typeof clearCart === 'function') {
                clearCart();
            } else {
                localStorage.removeItem('auricCart');
                localStorage.removeItem('auricCartItems');
                localStorage.removeItem('cartItems');
            }
        } catch (err) {
            console.error("Error clearing cart on redirect:", err);
        }
        
        // Redirect to homepage
        window.location.href = 'index.html';
    });
    
    // Initialize email functionality
    function initEmailJS() {
        console.log("Email service initialized (now using Nodemailer on backend)");
        
        // Setup confirmation modal close button
        const closeConfirmationBtn = document.getElementById('closeConfirmationBtn');
        if (closeConfirmationBtn) {
            closeConfirmationBtn.addEventListener('click', () => {
                // Clear any Razorpay payment details
                localStorage.removeItem('razorpay_payment_id');
                localStorage.removeItem('razorpay_order_id');
                localStorage.removeItem('razorpay_signature');
                
                // Redirect to homepage
                window.location.href = 'index.html';
            });
        }
        
        // Setup event for when confirmation modal is hidden
        const confirmationModal = document.getElementById('confirmationModal');
        if (confirmationModal) {
            confirmationModal.addEventListener('hidden.bs.modal', () => {
                // Clear any Razorpay payment details
                localStorage.removeItem('razorpay_payment_id');
                localStorage.removeItem('razorpay_order_id');
                localStorage.removeItem('razorpay_signature');
            });
        }
    }
    
    // Load cart items from localStorage - works with Auric cart system
    function loadCartItems() {
        try {
            console.log('Loading cart items for checkout...');
            // Check for cart data in multiple possible localStorage keys
            let cartItems = [];
            const auricCartItems = localStorage.getItem('auricCartItems');
            const auricCart = localStorage.getItem('auricCart');
            const localCartItems = localStorage.getItem('cartItems');
            
            // Try auricCartItems first (primary cart storage)
            if (auricCartItems) {
                try {
                    const parsedItems = JSON.parse(auricCartItems);
                    // Check if it's an array or object with items property
                    if (Array.isArray(parsedItems)) {
                        cartItems = parsedItems;
                        console.log('Cart items loaded from auricCartItems (array):', cartItems.length);
                    } else if (parsedItems && parsedItems.items && Array.isArray(parsedItems.items)) {
                        cartItems = parsedItems.items;
                        console.log('Cart items loaded from auricCartItems (object.items):', cartItems.length);
                    }
                } catch (e) {
                    console.error('Error parsing auricCartItems:', e);
                }
            } 
            // Then try auricCart
            if (cartItems.length === 0 && auricCart) {
                try {
                    const parsedItems = JSON.parse(auricCart);
                    // Check if it's an array or object with items property
                    if (Array.isArray(parsedItems)) {
                        cartItems = parsedItems;
                        console.log('Cart items loaded from auricCart (array):', cartItems.length);
                    } else if (parsedItems && parsedItems.items && Array.isArray(parsedItems.items)) {
                        cartItems = parsedItems.items;
                        console.log('Cart items loaded from auricCart (object.items):', cartItems.length);
                    }
                } catch (e) {
                    console.error('Error parsing auricCart:', e);
                }
            }
            // Finally check legacy storage
            if (cartItems.length === 0 && localCartItems) {
                try {
                    const parsedItems = JSON.parse(localCartItems);
                    // Check if it's an array or object with items property
                    if (Array.isArray(parsedItems)) {
                        cartItems = parsedItems;
                        console.log('Cart items loaded from cartItems (array):', cartItems.length);
                    } else if (parsedItems && parsedItems.items && Array.isArray(parsedItems.items)) {
                        cartItems = parsedItems.items;
                        console.log('Cart items loaded from cartItems (object.items):', cartItems.length);
                    }
                } catch (e) {
                    console.error('Error parsing cartItems:', e);
                }
            }
            
            // Debug - check exact cart item structure
            if (cartItems.length > 0) {
                console.log('First cart item structure:', JSON.stringify(cartItems[0]));
            }
            
            // Always clear the productList first
            const productList = document.getElementById('productList');
            productList.innerHTML = '';
            
            if (cartItems.length > 0) {
                console.log('Adding cart items to checkout form:', cartItems);
                
                // Add products from cart
                cartItems.forEach(item => {
                    const productItem = document.createElement('div');
                    productItem.className = 'product-item card mb-3';
                    productItem.innerHTML = `
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-6 mb-3 mb-md-0">
                                    <label for="product_${item.productId}" class="form-label">Product Name</label>
                                    <input type="text" class="form-control product-name" id="product_${item.productId}" 
                                        name="product_${item.productId}" value="${item.name}" required>
                                </div>
                                <div class="col-md-2 mb-3 mb-md-0">
                                    <label for="quantity_${item.productId}" class="form-label">Quantity</label>
                                    <input type="number" class="form-control product-quantity" id="quantity_${item.productId}" 
                                        name="quantity_${item.productId}" min="1" value="${item.quantity}" required>
                                </div>
                                <div class="col-md-3 mb-3 mb-md-0">
                                    <label for="price_${item.productId}" class="form-label">Price</label>
                                    <div class="input-group">
                                        <span class="input-group-text">₹</span>
                                        <input type="number" class="form-control product-price" id="price_${item.productId}" 
                                            name="price_${item.productId}" min="1" step="1" value="${item.price}" required>
                                    </div>
                                </div>
                                <div class="col-md-1 d-flex align-items-center justify-content-end mt-3 mt-md-0">
                                    <button type="button" class="btn btn-danger btn-sm remove-product">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    productList.appendChild(productItem);
                });
            } else {
                console.log('No cart items found, adding default product');
                // If there are no cart items, add a default empty product
                const defaultProduct = document.createElement('div');
                defaultProduct.className = 'product-item card mb-3';
                defaultProduct.innerHTML = `
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-6 mb-3 mb-md-0">
                                <label for="product1" class="form-label">Product Name</label>
                                <input type="text" class="form-control product-name" id="product1" name="product1" value="Diamond Ring" required>
                            </div>
                            <div class="col-md-2 mb-3 mb-md-0">
                                <label for="quantity1" class="form-label">Quantity</label>
                                <input type="number" class="form-control product-quantity" id="quantity1" name="quantity1" min="1" value="1" required>
                            </div>
                            <div class="col-md-3 mb-3 mb-md-0">
                                <label for="price1" class="form-label">Price</label>
                                <div class="input-group">
                                    <span class="input-group-text">₹</span>
                                    <input type="number" class="form-control product-price" id="price1" name="price1" min="1" step="1" value="25999" required>
                                </div>
                            </div>
                            <div class="col-md-1 d-flex align-items-center justify-content-end mt-3 mt-md-0">
                                <button type="button" class="btn btn-danger btn-sm remove-product" disabled>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                productList.appendChild(defaultProduct);
            }
            
            // Add event listeners to all products
            setupProductListeners();
            
            // Update order summary
            updateOrderSummary();
        } catch (error) {
            console.error('Error loading cart items:', error);
        }
    }
    
    // Set up event listeners for product inputs
    function setupProductListeners() {
        const productItems = document.querySelectorAll('.product-item');
        
        productItems.forEach(item => {
            const quantityInput = item.querySelector('.product-quantity');
            const priceInput = item.querySelector('.product-price');
            const removeButton = item.querySelector('.remove-product');
            
            // Update summary when quantity or price changes
            if (quantityInput) {
                quantityInput.addEventListener('input', updateOrderSummary);
            }
            
            if (priceInput) {
                priceInput.addEventListener('input', updateOrderSummary);
            }
            
            // Remove product when remove button is clicked
            if (removeButton) {
                removeButton.addEventListener('click', function() {
                    // Only remove if it's not the only product
                    if (document.querySelectorAll('.product-item').length > 1) {
                        item.remove();
                        updateOrderSummary();
                    }
                });
            }
        });
        
        // Enable/disable remove buttons based on product count
        updateRemoveButtons();
    }
    
    // Add a new product item
    function addProduct() {
        const productList = document.getElementById('productList');
        const productCount = productList.querySelectorAll('.product-item').length + 1;
        
        const productItem = document.createElement('div');
        productItem.className = 'product-item card mb-3';
        productItem.innerHTML = `
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-6 mb-3 mb-md-0">
                        <label for="product${productCount}" class="form-label">Product Name</label>
                        <input type="text" class="form-control product-name" id="product${productCount}" name="product${productCount}" required>
                    </div>
                    <div class="col-md-2 mb-3 mb-md-0">
                        <label for="quantity${productCount}" class="form-label">Quantity</label>
                        <input type="number" class="form-control product-quantity" id="quantity${productCount}" name="quantity${productCount}" min="1" value="1" required>
                    </div>
                    <div class="col-md-3 mb-3 mb-md-0">
                        <label for="price${productCount}" class="form-label">Price</label>
                        <div class="input-group">
                            <span class="input-group-text">₹</span>
                            <input type="number" class="form-control product-price" id="price${productCount}" name="price${productCount}" min="1" step="1" required>
                        </div>
                    </div>
                    <div class="col-md-1 d-flex align-items-center justify-content-end mt-3 mt-md-0">
                        <button type="button" class="btn btn-danger btn-sm remove-product">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        productList.appendChild(productItem);
        
        // Add event listeners to new product
        setupProductListeners();
        
        // Update order summary
        updateOrderSummary();
    }
    
    // Enable/disable remove buttons based on product count
    function updateRemoveButtons() {
        const removeButtons = document.querySelectorAll('.remove-product');
        const productCount = document.querySelectorAll('.product-item').length;
        
        removeButtons.forEach(button => {
            button.disabled = productCount <= 1;
        });
    }
    
    // Calculate total for a single product
    function calculateProductTotal(item) {
        const quantity = parseFloat(item.querySelector('.product-quantity').value) || 0;
        const price = parseFloat(item.querySelector('.product-price').value) || 0;
        return quantity * price;
    }
    
    // Update order summary
    function updateOrderSummary() {
        // Get cart items directly from localStorage
        let cartItems = [];
        try {
            const auricCartItems = localStorage.getItem('auricCartItems');
            if (auricCartItems) {
                cartItems = JSON.parse(auricCartItems);
            }
        } catch (error) {
            console.error('Error parsing cart items:', error);
        }
        
        const orderSummary = document.getElementById('orderSummary');
        let summaryHTML = '';
        let orderTotal = 0;
        
        if (cartItems.length === 0) {
            orderSummary.innerHTML = '<p>No products added yet.</p>';
            document.getElementById('orderTotal').textContent = '₹0';
            return;
        }
        
        summaryHTML = '<div class="order-items-container">';
        
        cartItems.forEach((item, index) => {
            const productName = item.name;
            const quantity = item.quantity;
            const price = item.price;
            const image = item.image;
            const productTotal = quantity * price;
            const productId = item.productId;
            
            orderTotal += productTotal;
            
            summaryHTML += `
                <div class="order-item mb-3" data-product-id="${productId}">
                    <div class="d-flex align-items-center">
                        <div class="order-item-image me-3">
                            <img src="${image}" alt="${productName}" class="img-thumbnail" style="width: 60px; height: 60px; object-fit: cover;">
                        </div>
                        <div class="order-item-details flex-grow-1">
                            <h6 class="mb-1">${productName}</h6>
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="quantity-controls">
                                    <button type="button" class="btn btn-sm btn-outline-secondary decrement-quantity" data-product-id="${productId}">-</button>
                                    <span class="quantity-value mx-2">${quantity}</span>
                                    <button type="button" class="btn btn-sm btn-outline-secondary increment-quantity" data-product-id="${productId}">+</button>
                                </div>
                                <div class="order-item-price">
                                    <span>₹${price}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="order-item-total mt-2 text-end">
                        <strong>Total: ₹${productTotal}</strong>
                    </div>
                    <hr>
                </div>
            `;
        });
        
        summaryHTML += '</div>';
        orderSummary.innerHTML = summaryHTML;
        document.getElementById('orderTotal').textContent = `₹${orderTotal}`;
        
        // Add event listeners to the newly created buttons
        document.querySelectorAll('.increment-quantity').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                incrementCartItemQuantity(productId);
            });
        });
        
        document.querySelectorAll('.decrement-quantity').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                decrementCartItemQuantity(productId);
            });
        });
    }
    
    // Function to increment cart item quantity
    function incrementCartItemQuantity(productId) {
        const cartItems = JSON.parse(localStorage.getItem('auricCartItems') || '[]');
        const itemIndex = cartItems.findIndex(item => item.productId === productId);
        
        if (itemIndex !== -1) {
            cartItems[itemIndex].quantity += 1;
            cartItems[itemIndex].updatedAt = new Date().toISOString();
            localStorage.setItem('auricCartItems', JSON.stringify(cartItems));
            
            // Update the UI
            updateOrderSummary();
        }
    }
    
    // Function to decrement cart item quantity
    function decrementCartItemQuantity(productId) {
        const cartItems = JSON.parse(localStorage.getItem('auricCartItems') || '[]');
        const itemIndex = cartItems.findIndex(item => item.productId === productId);
        
        if (itemIndex !== -1 && cartItems[itemIndex].quantity > 1) {
            cartItems[itemIndex].quantity -= 1;
            cartItems[itemIndex].updatedAt = new Date().toISOString();
            localStorage.setItem('auricCartItems', JSON.stringify(cartItems));
        } else if (itemIndex !== -1 && cartItems[itemIndex].quantity === 1) {
            // If quantity is 1, remove the item
            cartItems.splice(itemIndex, 1);
            localStorage.setItem('auricCartItems', JSON.stringify(cartItems));
        }
        
        // Update the UI
        updateOrderSummary();
    }
    
    // Handle order submission
    async function handleOrderSubmit(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // No need for EmailJS credentials anymore - using Nodemailer on backend
        
        // Generate a unique order reference
        const orderReference = generateOrderReference();
        
        // Prepare template parameters
        const orderDetails = prepareOrderSummary();
        const templateParams = {
            order_reference: orderReference,
            from_name: document.getElementById('firstName').value + ' ' + document.getElementById('lastName').value,
            to_email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            phone: document.getElementById('phone').value,
            payment_method: document.querySelector('input[name="paymentMethod"]:checked').value,
            notes: document.getElementById('notes').value,
            order_summary: orderDetails.orderSummaryHTML,
            order_total: document.getElementById('orderTotal').textContent,
            order_date: new Date().toLocaleString()
        };
        
        // Check if Razorpay payment method is selected
        const isRazorpaySelected = document.getElementById('razorpay').checked;
        
        try {
            // Disable the submit button
            const submitBtn = document.querySelector('#checkoutForm button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Processing...
            `;
            
            // If Razorpay is selected, handle Razorpay payment first
            if (isRazorpaySelected) {
                try {
                    await handleRazorpayPayment(orderReference, orderDetails.orderTotal);
                } catch (error) {
                    console.error("Razorpay payment failed:", error);
                    throw new Error("Payment failed. Please try again.");
                }
            }
            
            try {
                console.log("Sending customer email via server endpoint");
                // Send email to customer using our Node.js backend
                const customerResponse = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        emailType: 'customerConfirmation',
                        templateParams: templateParams
                    })
                });
                
                if (!customerResponse.ok) {
                    const errorData = await customerResponse.json();
                    throw new Error(`Server responded with status: ${customerResponse.status}, message: ${errorData.error || 'Unknown error'}`);
                }
                
                const customerResult = await customerResponse.json();
                console.log("Customer email result:", customerResult);
                
                console.log("Sending owner email via server endpoint");
                // Send email to owner using our Node.js backend
                const ownerResponse = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        emailType: 'ownerNotification',
                        templateParams: templateParams
                    })
                });
                
                if (!ownerResponse.ok) {
                    const errorData = await ownerResponse.json();
                    throw new Error(`Server responded with status: ${ownerResponse.status}, message: ${errorData.error || 'Unknown error'}`);
                }
                
                const ownerResult = await ownerResponse.json();
                console.log("Owner email result:", ownerResult);
            } catch (error) {
                console.error("Email sending error details:", error);
                throw error;
            }
            
            // Reset form
            document.getElementById('checkoutForm').reset();
            
            // Clear the cart in localStorage
            console.log('Order completed successfully, clearing cart');
            localStorage.removeItem('auricCart');
            localStorage.removeItem('auricCartItems');
            localStorage.removeItem('cartItems'); // Clear legacy cart also
            
            // Clear the order summary display
            const orderSummary = document.getElementById('orderSummary');
            if (orderSummary) {
                orderSummary.innerHTML = '<p>No products added yet.</p>';
                document.getElementById('orderTotal').textContent = '₹0';
            }
            
            // If we have direct access to Cart API from cart.js, use it
            if (typeof clearCart === 'function') {
                try {
                    console.log('Using cart.js API to clear cart');
                    clearCart();
                } catch (err) {
                    console.error('Error using clearCart API:', err);
                }
            }
            
            // If Firebase auth is available, clear Firestore cart too
            if (typeof auth !== 'undefined' && auth && auth.currentUser) {
                try {
                    // Clear Firestore cart
                    console.log('User is logged in, clearing Firestore cart');
                    const userId = auth.currentUser.uid;
                    db.collection('carts').doc(userId).set({
                        items: [],
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastOperation: 'clear',
                        operationTimestamp: Date.now(),
                        lastSyncedDevice: navigator.userAgent,
                        deviceId: localStorage.getItem('auricCartDeviceId') || 'checkout-device',
                        lastSyncedAt: new Date().toISOString(),
                        cartVersion: Date.now().toString(),
                        itemCount: 0
                    });
                } catch (err) {
                    console.error('Failed to clear Firestore cart, but order was successful:', err);
                }
            }
            
            // Show confirmation modal
            document.getElementById('orderReference').textContent = orderReference;
            document.getElementById('orderDetails').innerHTML = orderDetails.modalSummaryHTML;
            
            // Check if Razorpay payment was made and display payment info
            if (isRazorpaySelected && localStorage.getItem('razorpay_payment_id')) {
                const paymentId = localStorage.getItem('razorpay_payment_id');
                document.getElementById('paymentId').textContent = paymentId;
                document.getElementById('paymentMethod').textContent = 'Razorpay (Online)';
                document.getElementById('paymentDetails').style.display = 'block';
            }
            
            const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
            confirmationModal.show();
            
            // Re-enable the submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            
        } catch (error) {
            console.error('Error sending email:', error);
            showError('Failed to send order confirmation. Please try again later.');
            
            // Re-enable the submit button
            const submitBtn = document.querySelector('#checkoutForm button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Place Order';
        }
    }
    
    // Validate the form
    function validateForm() {
        const form = document.getElementById('checkoutForm');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }
        
        // Check if there are any items in the cart
        const cartItems = JSON.parse(localStorage.getItem('auricCartItems') || '[]');
        if (cartItems.length === 0) {
            showError('Your cart is empty. Please add items to your cart before checking out.');
            return false;
        }
        
        return true;
    }
    
    // Generate a unique order reference
    function generateOrderReference() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `AUR-${timestamp}-${random}`;
    }
    
    // Prepare order summary for email and display
    function prepareOrderSummary() {
        // Get cart items directly from localStorage
        let cartItems = [];
        try {
            const auricCartItems = localStorage.getItem('auricCartItems');
            if (auricCartItems) {
                cartItems = JSON.parse(auricCartItems);
            }
        } catch (error) {
            console.error('Error parsing cart items:', error);
        }
        
        let orderTotal = 0;
        
        // Create HTML table for email
        let emailSummaryHTML = `
            <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Product</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Quantity</th>
                        <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Price</th>
                        <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Total</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Create HTML summary for confirmation modal
        let modalSummaryHTML = `
            <table class="table table-bordered mt-4">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Image</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        cartItems.forEach(item => {
            const productName = item.name;
            const quantity = item.quantity;
            const price = item.price;
            const image = item.image;
            const total = quantity * price;
            
            orderTotal += total;
            
            // Add row to email table
            emailSummaryHTML += `
                <tr>
                    <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${productName}</td>
                    <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${quantity}</td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₹${price}</td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₹${total}</td>
                </tr>
            `;
            
            // Add row to modal table
            modalSummaryHTML += `
                <tr>
                    <td>${productName}</td>
                    <td><img src="${image}" alt="${productName}" class="img-thumbnail" style="width: 50px; height: 50px; object-fit: cover;"></td>
                    <td>${quantity}</td>
                    <td>₹${price}</td>
                    <td>₹${total}</td>
                </tr>
            `;
        });
        
        // Add total to email table
        emailSummaryHTML += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>Total</strong></td>
                        <td style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>₹${orderTotal}</strong></td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        // Add total to modal table
        modalSummaryHTML += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4" class="text-end"><strong>Total</strong></td>
                        <td><strong>₹${orderTotal}</strong></td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        return {
            orderSummaryHTML: emailSummaryHTML,
            modalSummaryHTML: modalSummaryHTML,
            orderTotal: orderTotal
        };
    }
    
    // Show error message
    function showError(message) {
        // Display error in modal
        const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
        document.getElementById('errorMessage').textContent = message;
        errorModal.show();
    }
    
    // Check user authentication with retry functionality
    function checkUserAuthenticationWithRetry() {
        window.authCheckAttempts++;
        console.log(`Checking user authentication (attempt ${window.authCheckAttempts})...`);
        
        // Maximum number of attempts before showing auth modal
        const MAX_ATTEMPTS = 2;
        
        // Check multiple sources for authentication status
        const sources = [
            // 1. Check Firebase auth directly (synchronous)
            () => {
                if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                    console.log(`Auth source 1: User is authenticated as ${firebase.auth().currentUser.email}`);
                    return true;
                }
                return false;
            },
            // 2. Check localStorage values
            () => {
                const localUser = localStorage.getItem('currentUser');
                const localUserLoggedIn = localStorage.getItem('userLoggedIn');
                if ((localUser && localUser !== 'null') || localUserLoggedIn === 'true') {
                    console.log('Auth source 2: User is authenticated via localStorage');
                    return true;
                }
                return false;
            },
            // 3. Check if user auth data is available in any other form
            () => {
                if (window.isUserAuthenticated) {
                    console.log('Auth source 3: User is authenticated via global flag');
                    return true;
                }
                return false;
            }
        ];
        
        // Check all authentication sources
        let isAuthenticated = false;
        for (const checkSource of sources) {
            if (checkSource()) {
                isAuthenticated = true;
                break;
            }
        }
        
        if (isAuthenticated) {
            window.isUserAuthenticated = true;
            if (!window.cartLoadedForCheckout) {
                loadCartItems();
                window.cartLoadedForCheckout = true;
            }
            return;
        }
        
        // If we've tried enough times and the user still isn't authenticated, show the auth modal
        if (window.authCheckAttempts >= MAX_ATTEMPTS) {
            console.log(`Authentication failed after ${window.authCheckAttempts} attempts, showing auth modal`);
            showAuthRequiredModal();
            localStorage.setItem('redirectAfterLogin', 'checkout.html');
            return;
        }
        
        // Set up async auth state tracking if Firebase is available
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    console.log(`Auth state change detected: User is authenticated as ${user.email}`);
                    window.isUserAuthenticated = true;
                    if (!window.cartLoadedForCheckout) {
                        loadCartItems();
                        window.cartLoadedForCheckout = true;
                    }
                } else if (window.authCheckAttempts < MAX_ATTEMPTS) {
                    // Try again after a short delay
                    setTimeout(checkUserAuthenticationWithRetry, 500);
                }
            });
        } else {
            // No Firebase, try again after a short delay
            setTimeout(checkUserAuthenticationWithRetry, 500);
        }
    }
    
    // Show authentication required modal
    function showAuthRequiredModal() {
        // Check if modal already exists in HTML
        let authModal = document.getElementById('authRequiredModal');
        
        // If modal doesn't exist, create it
        if (!authModal) {
            const modalHTML = `
                <div class="modal fade" id="authRequiredModal" tabindex="-1" aria-labelledby="authRequiredModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content border-0 shadow">
                            <div class="modal-header border-0 bg-primary text-white">
                                <h5 class="modal-title fw-bold" id="authRequiredModalLabel">Create an Account</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body p-4">
                                <div class="row">
                                    <div class="col-12 col-md-6 mb-4 mb-md-0">
                                        <div class="text-center mb-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="bi bi-person-plus text-primary" viewBox="0 0 16 16">
                                                <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H1s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C9.516 10.68 8.289 10 6 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                                                <path fill-rule="evenodd" d="M13.5 5a.5.5 0 0 1 .5.5V7h1.5a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0V8h-1.5a.5.5 0 0 1 0-1H13V5.5a.5.5 0 0 1 .5-.5z"/>
                                            </svg>
                                        </div>
                                        <h5 class="text-center fw-bold mb-3">New Customer</h5>
                                        <p class="text-center mb-4">Create an account to track orders and enjoy member benefits</p>
                                        <div class="d-grid">
                                            <a href="signup.html" class="btn btn-primary btn-lg">Create Account</a>
                                        </div>
                                    </div>
                                    <div class="col-12 col-md-6">
                                        <div class="text-center mb-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="bi bi-person-check text-secondary" viewBox="0 0 16 16">
                                                <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H1s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C9.516 10.68 8.289 10 6 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                                                <path fill-rule="evenodd" d="M15.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L12.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
                                            </svg>
                                        </div>
                                        <h5 class="text-center fw-bold mb-3">Returning Customer</h5>
                                        <p class="text-center mb-4">Sign in to your account to complete your purchase</p>
                                        <div class="d-grid">
                                            <a href="login.html" class="btn btn-outline-secondary btn-lg">Sign In</a>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mt-4 pt-3 border-top">
                                    <h6 class="fw-bold">Why create an account?</h6>
                                    <div class="row mt-3">
                                        <div class="col-6">
                                            <div class="d-flex align-items-center mb-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill text-success me-2" viewBox="0 0 16 16">
                                                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                                                </svg>
                                                <span>Order tracking</span>
                                            </div>
                                            <div class="d-flex align-items-center mb-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill text-success me-2" viewBox="0 0 16 16">
                                                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                                                </svg>
                                                <span>Faster checkout</span>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="d-flex align-items-center mb-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill text-success me-2" viewBox="0 0 16 16">
                                                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                                                </svg>
                                                <span>Exclusive offers</span>
                                            </div>
                                            <div class="d-flex align-items-center mb-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill text-success me-2" viewBox="0 0 16 16">
                                                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                                                </svg>
                                                <span>Saved preferences</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Append modal to body
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHTML;
            document.body.appendChild(modalContainer.firstElementChild);
            
            // Initialize the modal
            authModal = document.getElementById('authRequiredModal');
        }
        
        // Show the modal
        const bsModal = new bootstrap.Modal(authModal);
        bsModal.show();
        
        // Add event listener for when modal is hidden to redirect
        authModal.addEventListener('hidden.bs.modal', function () {
            window.location.href = 'signup.html';
        });
    }
    
    // Handle Razorpay payment
    async function handleRazorpayPayment(orderReference, amount) {
        // Convert amount to paise (Razorpay expects amount in smallest currency unit)
        const amountInPaise = Math.round(amount * 100);
        
        // Get user details for Razorpay options
        const name = document.getElementById('firstName').value + ' ' + document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        
        // Create a Razorpay order first
        try {
            const response = await fetch('/api/create-razorpay-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: amountInPaise,
                    currency: 'INR',
                    receipt: orderReference,
                }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to create Razorpay order');
            }
            
            const orderData = await response.json();
            console.log('Razorpay order created:', orderData);
            
            // Initialize Razorpay payment
            return new Promise((resolve, reject) => {
                const options = {
                    key: orderData.key, // From the API response
                    amount: amountInPaise,
                    currency: 'INR',
                    name: 'Auric Jewelry',
                    description: 'Order: ' + orderReference,
                    order_id: orderData.id,
                    prefill: {
                        name: name,
                        email: email,
                        contact: phone
                    },
                    theme: {
                        color: '#3399cc'
                    },
                    handler: function(response) {
                        // This handler is called when payment is successful
                        console.log('Razorpay payment successful:', response);
                        // Add payment details to localStorage for reference
                        localStorage.setItem('razorpay_payment_id', response.razorpay_payment_id);
                        localStorage.setItem('razorpay_order_id', response.razorpay_order_id);
                        localStorage.setItem('razorpay_signature', response.razorpay_signature);
                        resolve(response);
                    },
                    modal: {
                        ondismiss: function() {
                            // This function runs when the Razorpay popup is closed without payment
                            console.log('Razorpay popup closed without payment');
                            reject(new Error('Payment cancelled'));
                        }
                    }
                };
                
                const rzp = new Razorpay(options);
                rzp.open();
            });
        } catch (error) {
            console.error('Error in Razorpay process:', error);
            throw error;
        }
    }
});