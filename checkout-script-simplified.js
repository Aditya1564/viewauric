document.addEventListener('DOMContentLoaded', function() {
    // Simple checkout page without storage dependencies
    
    // Form submission
    document.getElementById('checkoutForm').addEventListener('submit', handleOrderSubmit);

    // Initialize cart
    loadCartItems();
    
    // Add event listener for confirmation modal close button
    document.getElementById('closeConfirmationBtn').addEventListener('click', function() {
        // Redirect to homepage
        window.location.href = 'index.html';
    });
    
    // Load sample cart items for demo
    function loadCartItems() {
        console.log('Loading demo cart items for checkout...');
        
        // Sample cart items for demonstration
        const cartItems = [
            {
                id: 'demo1',
                name: 'Emerald Earrings',
                price: 32500,
                image: 'images/product-category/IMG_20250504_150241.jpg',
                quantity: 1
            },
            {
                id: 'demo2',
                name: 'Diamond Necklace',
                price: 45000,
                image: 'images/product-category/IMG_20250504_150655.jpg',
                quantity: 1
            }
        ];
        
        // Always clear the productList first
        const productList = document.getElementById('productList');
        if (productList) {
            productList.innerHTML = '';
            
            // Add cart items to the list
            cartItems.forEach(item => {
                const productHtml = `
                    <div class="checkout-product" data-id="${item.id}">
                        <div class="checkout-product-image">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="checkout-product-details">
                            <h3>${item.name}</h3>
                            <div class="checkout-product-controls">
                                <div class="checkout-quantity">
                                    <button class="checkout-quantity-btn minus" data-id="${item.id}">-</button>
                                    <input type="number" value="${item.quantity}" min="1" class="checkout-quantity-input" data-id="${item.id}">
                                    <button class="checkout-quantity-btn plus" data-id="${item.id}">+</button>
                                </div>
                                <div class="checkout-product-price">₹${item.price.toLocaleString()}</div>
                                <button class="checkout-remove-btn" data-id="${item.id}">Remove</button>
                            </div>
                        </div>
                    </div>
                `;
                productList.innerHTML += productHtml;
            });
            
            // Update the order summary
            updateOrderSummary(cartItems);
            
            // Setup product listeners
            setupProductListeners();
        }
    }
    
    // Set up listeners for quantity controls and remove buttons
    function setupProductListeners() {
        // Plus buttons
        document.querySelectorAll('.checkout-quantity-btn.plus').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                incrementCartItemQuantity(productId);
            });
        });
        
        // Minus buttons
        document.querySelectorAll('.checkout-quantity-btn.minus').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                decrementCartItemQuantity(productId);
            });
        });
        
        // Remove buttons
        document.querySelectorAll('.checkout-remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                const productElement = document.querySelector(`.checkout-product[data-id="${productId}"]`);
                if (productElement) {
                    productElement.remove();
                    updateOrderSummary();
                }
            });
        });
        
        // Quantity inputs
        document.querySelectorAll('.checkout-quantity-input').forEach(input => {
            input.addEventListener('change', function() {
                updateOrderSummary();
            });
        });
    }
    
    // Increment cart item quantity
    function incrementCartItemQuantity(productId) {
        const quantityInput = document.querySelector(`.checkout-quantity-input[data-id="${productId}"]`);
        if (quantityInput) {
            quantityInput.value = parseInt(quantityInput.value) + 1;
            updateOrderSummary();
        }
    }
    
    // Decrement cart item quantity
    function decrementCartItemQuantity(productId) {
        const quantityInput = document.querySelector(`.checkout-quantity-input[data-id="${productId}"]`);
        if (quantityInput && parseInt(quantityInput.value) > 1) {
            quantityInput.value = parseInt(quantityInput.value) - 1;
            updateOrderSummary();
        }
    }
    
    // Update order summary based on cart items
    function updateOrderSummary() {
        const products = document.querySelectorAll('.checkout-product');
        let subtotal = 0;
        let totalItems = 0;
        
        products.forEach(product => {
            const productId = product.getAttribute('data-id');
            const quantityInput = document.querySelector(`.checkout-quantity-input[data-id="${productId}"]`);
            const price = parseInt(product.querySelector('.checkout-product-price').textContent.replace('₹', '').replace(',', ''));
            const quantity = parseInt(quantityInput.value);
            
            subtotal += price * quantity;
            totalItems += quantity;
        });
        
        // Calculate taxes (5%) and shipping (₹100 if subtotal < ₹50000, otherwise free)
        const taxRate = 0.05;
        const taxes = subtotal * taxRate;
        const shipping = subtotal < 50000 ? 100 : 0;
        const total = subtotal + taxes + shipping;
        
        // Update summary
        document.getElementById('cartSubtotal').textContent = `₹${subtotal.toLocaleString()}`;
        document.getElementById('cartTaxes').textContent = `₹${taxes.toLocaleString()}`;
        document.getElementById('cartShipping').textContent = shipping === 0 ? 'Free' : `₹${shipping.toLocaleString()}`;
        document.getElementById('cartTotal').textContent = `₹${total.toLocaleString()}`;
        document.getElementById('razorpayAmount').textContent = `₹${total.toLocaleString()}`;
        
        // Update hidden fields for order processing
        document.getElementById('orderSubtotal').value = subtotal;
        document.getElementById('orderTaxes').value = taxes;
        document.getElementById('orderShipping').value = shipping;
        document.getElementById('orderTotal').value = total;
        
        return { subtotal, taxes, shipping, total, count: totalItems };
    }
    
    // Handle form submission
    async function handleOrderSubmit(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        const orderData = prepareOrderData();
        
        // Create an order reference number
        const orderReference = generateOrderReference();
        document.getElementById('orderReference').textContent = orderReference;
        
        // Create order summary HTML
        const orderSummary = prepareOrderSummary();
        document.getElementById('orderSummaryTable').innerHTML = orderSummary.html;
        document.getElementById('orderTotalConfirmation').textContent = `₹${orderSummary.orderTotal.toLocaleString()}`;
        
        // Show confirmation
        const confirmationModal = document.getElementById('confirmationModal');
        confirmationModal.style.display = 'flex';
    }
    
    // Validate the checkout form
    function validateForm() {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;
        const city = document.getElementById('city').value;
        const state = document.getElementById('state').value;
        const zip = document.getElementById('zip').value;
        
        if (!name || !email || !phone || !address || !city || !state || !zip) {
            showError('Please fill in all required fields');
            return false;
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Please enter a valid email address');
            return false;
        }
        
        // Basic phone validation (10 digits)
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            showError('Please enter a valid 10-digit phone number');
            return false;
        }
        
        return true;
    }
    
    // Prepare order data from form
    function prepareOrderData() {
        const orderData = {
            customer: {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value
            },
            shipping: {
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                zip: document.getElementById('zip').value
            },
            payment: {
                method: document.querySelector('input[name="paymentMethod"]:checked').value
            },
            items: [],
            summary: {
                subtotal: parseFloat(document.getElementById('orderSubtotal').value),
                taxes: parseFloat(document.getElementById('orderTaxes').value),
                shipping: parseFloat(document.getElementById('orderShipping').value),
                total: parseFloat(document.getElementById('orderTotal').value)
            }
        };
        
        // Get items from the product list
        document.querySelectorAll('.checkout-product').forEach(product => {
            const id = product.getAttribute('data-id');
            const name = product.querySelector('h3').textContent;
            const price = parseInt(product.querySelector('.checkout-product-price').textContent.replace('₹', '').replace(',', ''));
            const quantity = parseInt(product.querySelector('.checkout-quantity-input').value);
            const image = product.querySelector('img').src;
            
            orderData.items.push({
                id,
                name,
                price,
                quantity,
                image
            });
        });
        
        return orderData;
    }
    
    // Generate a random order reference number
    function generateOrderReference() {
        const prefix = 'AUR';
        const timestamp = Date.now().toString().substr(-6);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}-${timestamp}-${random}`;
    }
    
    // Prepare order summary for display in confirmation modal
    function prepareOrderSummary() {
        const products = document.querySelectorAll('.checkout-product');
        let html = '';
        let orderSubtotal = 0;
        let orderTotal = 0;
        
        products.forEach(product => {
            const name = product.querySelector('h3').textContent;
            const price = parseInt(product.querySelector('.checkout-product-price').textContent.replace('₹', '').replace(',', ''));
            const quantity = parseInt(product.querySelector('.checkout-quantity-input').value);
            const itemTotal = price * quantity;
            
            html += `
                <tr>
                    <td>${name}</td>
                    <td>₹${price.toLocaleString()}</td>
                    <td>${quantity}</td>
                    <td>₹${itemTotal.toLocaleString()}</td>
                </tr>
            `;
            
            orderSubtotal += itemTotal;
        });
        
        // Get summary values
        const taxRate = 0.05;
        const taxes = orderSubtotal * taxRate;
        const shipping = orderSubtotal < 50000 ? 100 : 0;
        orderTotal = orderSubtotal + taxes + shipping;
        
        // Add summary rows
        html += `
            <tr class="summary-row">
                <td colspan="3">Subtotal</td>
                <td>₹${orderSubtotal.toLocaleString()}</td>
            </tr>
            <tr class="summary-row">
                <td colspan="3">Taxes (5%)</td>
                <td>₹${taxes.toLocaleString()}</td>
            </tr>
            <tr class="summary-row">
                <td colspan="3">Shipping</td>
                <td>${shipping === 0 ? 'Free' : `₹${shipping.toLocaleString()}`}</td>
            </tr>
        `;
        
        return { html, orderSubtotal, orderTotal };
    }
    
    // Show error message
    function showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Hide after 4 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 4000);
    }
});