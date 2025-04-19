document.addEventListener('DOMContentLoaded', function() {
    // Make sure EmailJS is already loaded from the HTML
    if (typeof emailjs !== 'undefined') {
        console.log("EmailJS detected in product-detail.js");
    } else {
        console.warn("EmailJS not detected in product-detail.js - should be loaded in HTML");
    }
    console.log("Product detail script loading...");

    // Product Gallery Thumbnail Functionality
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.getElementById('main-product-image');

    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            // Update active class
            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Update main image
            const thumbnailImg = this.querySelector('img');
            mainImage.src = thumbnailImg.src.replace('w=200', 'w=800');
            mainImage.alt = thumbnailImg.alt;
        });
    });

    // Tab Functionality
    const tabs = document.querySelectorAll('.tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Hide all tab panes
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Show the selected tab pane
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Get product ID from URL if available
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (productId) {
        fetchProductDetails(productId);
    }

    // Quantity selector functionality
    const decreaseBtn = document.getElementById('decrease-quantity');
    const increaseBtn = document.getElementById('increase-quantity');
    const quantityInput = document.getElementById('product-quantity');

    function updateQuantityDisplay() {
        let currentValue = parseInt(quantityInput.value);
        
        // Update the price summary
        const priceQuantityElement = document.getElementById('price-quantity');
        if (priceQuantityElement) {
            priceQuantityElement.textContent = currentValue;
        }
        
        // Update subtotal
        const subtotalDisplay = document.getElementById('subtotal-display');
        const priceText = document.getElementById('product-price').textContent;
        const price = parseInt(priceText.replace(/[₹,]/g, ''));
        const subtotal = price * currentValue;
        
        if (subtotalDisplay) {
            subtotalDisplay.textContent = '₹' + subtotal.toLocaleString('en-IN');
        }
        
        // Update total amount
        const totalAmountDisplay = document.getElementById('total-amount-display');
        if (totalAmountDisplay) {
            totalAmountDisplay.textContent = '₹' + subtotal.toLocaleString('en-IN');
        }
        
        // Update checkout summary quantity if available
        updateSummaryQuantity();
    }

    decreaseBtn.addEventListener('click', function() {
        let currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
            updateQuantityDisplay();
        }
    });

    increaseBtn.addEventListener('click', function() {
        let currentValue = parseInt(quantityInput.value);
        if (currentValue < 10) { // Setting max quantity to 10
            quantityInput.value = currentValue + 1;
            updateQuantityDisplay();
        }
    });

    quantityInput.addEventListener('change', function() {
        let value = parseInt(this.value);
        
        if (isNaN(value) || value < 1) {
            this.value = 1;
        } else if (value > 10) {
            this.value = 10;
        }
        
        updateQuantityDisplay();
    });

    // Buy Now Button - Opens checkout overlay
    const buyNowButton = document.getElementById('buy-now-button');
    const checkoutOverlay = document.getElementById('checkout-overlay');
    const closeCheckoutBtn = document.getElementById('close-checkout');
    
    buyNowButton.addEventListener('click', function() {
        // Update order summary with current product details
        updateOrderSummary();
        // Show checkout overlay
        checkoutOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling behind overlay
    });
    
    closeCheckoutBtn.addEventListener('click', function() {
        checkoutOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    // Cancel shipping button
    document.getElementById('cancel-shipping').addEventListener('click', function() {
        checkoutOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    // Checkout Flow Navigation
    const progressSteps = document.querySelectorAll('.progress-step');
    const checkoutSteps = document.querySelectorAll('.checkout-step');
    
    // Next to payment button
    document.getElementById('next-to-payment').addEventListener('click', function() {
        // Validate shipping form
        const shippingForm = document.getElementById('shipping-form');
        const requiredFields = shippingForm.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = 'red';
                isValid = false;
            } else {
                field.style.borderColor = '';
            }
        });
        
        if (!isValid) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Update progress steps
        progressSteps.forEach(step => step.classList.remove('active'));
        progressSteps[1].classList.add('active');
        progressSteps[0].classList.add('completed');
        
        // Update checkout steps
        checkoutSteps.forEach(step => step.classList.remove('active'));
        checkoutSteps[1].classList.add('active');
        
        // Update summary address
        updateOrderSummary();
    });
    
    // Back to shipping button
    document.getElementById('back-to-shipping').addEventListener('click', function() {
        // Update progress steps
        progressSteps.forEach(step => step.classList.remove('active', 'completed'));
        progressSteps[0].classList.add('active');
        
        // Update checkout steps
        checkoutSteps.forEach(step => step.classList.remove('active'));
        checkoutSteps[0].classList.add('active');
    });
    
    // Place order button
    document.getElementById('place-order').addEventListener('click', function() {
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        
        if (paymentMethod === 'razorpay') {
            initiateRazorpayPayment();
        } else {
            // For COD payment method
            processCashOnDeliveryOrder();
        }
    });
    
    // Shipping method change
    document.querySelectorAll('input[name="shipping"]').forEach(radio => {
        radio.addEventListener('change', function() {
            updateShippingCost();
            updateOrderTotals();
        });
    });
    
    // Payment method change
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const codFee = this.value === 'cod' ? 99 : 0;
            document.getElementById('summary-shipping').textContent = this.value === 'cod' ? 
                'Free + ₹99 COD Fee' : 
                document.querySelector('input[name="shipping"]:checked').value === 'express' ? 
                    '₹250' : 'Free';
            updateOrderTotals();
        });
    });
});

// Function to load product details from product ID
function fetchProductDetails(productId) {
    // In a real application, you would fetch this data from an API
    // For demonstration, we'll use hardcoded product data
    const products = {
        'diamond-pendant': {
            name: 'Exquisite Diamond Pendant',
            collection: 'Leelah Collection',
            price: '₹58,000',
            originalPrice: '₹72,500',
            description: 'Handcrafted with precision and care, this stunning diamond pendant features a 1.2 carat brilliant-cut diamond surrounded by smaller diamonds in an elegant setting. The pendant hangs from an 18K gold chain with a secure lobster clasp. Perfect for special occasions or as an everyday statement piece.',
            material: '18K Gold',
            stone: 'Diamond',
            carat: '1.2 ct',
            chainLength: '18 inches',
            mainImage: 'https://images.unsplash.com/photo-1608042314453-ae338d80c427?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            images: [
                'https://images.unsplash.com/photo-1608042314453-ae338d80c427?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
                'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
                'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
                'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
            ]
        },
        'emerald-studs': {
            name: 'Emerald Studs',
            collection: 'Nabah Collection',
            price: '₹32,500',
            originalPrice: '₹38,000',
            description: 'These stunning emerald studs feature brilliant green gemstones set in solid gold. The emeralds are ethically sourced and cut to perfection to showcase their natural beauty and brilliance. These versatile earrings are perfect for both everyday wear and special occasions.',
            material: '14K Gold',
            stone: 'Emerald',
            carat: '0.8 ct each',
            backingType: 'Push back',
            mainImage: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            images: [
                'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
                'https://images.unsplash.com/photo-1599459183200-59c7687a0275?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
                'https://images.unsplash.com/photo-1599643477337-3413ad0061c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
                'https://images.unsplash.com/photo-1611591437136-2d9159a2f466?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
            ]
        },
        'rose-gold-bracelet': {
            name: 'Rose Gold Bracelet',
            collection: 'Mathuram Collection',
            price: '₹41,200',
            originalPrice: '₹48,500',
            description: 'This elegant rose gold bracelet features intricate filigree work and a delicate chain design. Handcrafted by master artisans, the bracelet combines traditional techniques with contemporary aesthetics. The lobster clasp ensures secure wear, while the adjustable length offers a perfect fit.',
            material: 'Rose Gold',
            purity: '18K',
            length: 'Adjustable 6.5-7.5 inches',
            weight: '12 grams',
            mainImage: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            images: [
                'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
                'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
                'https://images.unsplash.com/photo-1608042314453-ae338d80c427?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
                'https://images.unsplash.com/photo-1599643477337-3413ad0061c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
            ]
        }
    };

    // Get product data or use default if not found
    const product = products[productId] || products['diamond-pendant'];

    // Update page content with product data
    document.getElementById('product-title').textContent = product.name;
    document.getElementById('product-breadcrumb-name').textContent = product.name;
    document.getElementById('product-collection').textContent = product.collection;
    document.getElementById('product-price').textContent = product.price;
    document.getElementById('product-original-price').textContent = product.originalPrice;
    document.getElementById('product-description').textContent = product.description;
    
    // Update product details
    if (product.material) document.getElementById('product-material').textContent = product.material;
    if (product.stone) document.getElementById('product-stone').textContent = product.stone;
    if (product.carat) document.getElementById('product-carat').textContent = product.carat;
    if (product.chainLength) document.getElementById('product-chain-length').textContent = product.chainLength;
    
    // Update main image
    document.getElementById('main-product-image').src = product.mainImage;
    document.getElementById('main-product-image').alt = product.name;
    
    // Update thumbnails if available
    if (product.images && product.images.length > 0) {
        const thumbnailsContainer = document.querySelector('.product-thumbnail-gallery');
        thumbnailsContainer.innerHTML = '';
        
        product.images.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail' + (index === 0 ? ' active' : '');
            
            const img = document.createElement('img');
            img.src = image;
            img.alt = `${product.name} - View ${index + 1}`;
            
            thumbnail.appendChild(img);
            thumbnailsContainer.appendChild(thumbnail);
            
            thumbnail.addEventListener('click', function() {
                // Update active class
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Update main image
                const mainImage = document.getElementById('main-product-image');
                mainImage.src = img.src.replace('w=200', 'w=800');
                mainImage.alt = img.alt;
            });
        });
    }
}

// Function to initialize Razorpay payment
function initiateRazorpayPayment() {
    // Get product details
    const productName = document.getElementById('product-title').textContent;
    const productImage = document.getElementById('main-product-image').src;
    const quantity = document.getElementById('product-quantity').value;
    
    // Get customer details from form
    const name = document.getElementById('full-name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address1 = document.getElementById('address1').value;
    const address2 = document.getElementById('address2').value || '';
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const pincode = document.getElementById('pincode').value;
    const country = document.getElementById('country').value;
    const orderNotes = document.getElementById('order-notes').value || '';
    
    // Get shipping method
    const shippingMethod = document.querySelector('input[name="shipping"]:checked').value;
    
    // Format full shipping address
    const shippingAddress = `${address1}, ${address2 ? address2 + ', ' : ''}${city}, ${state}, ${pincode}, ${country}`;
    
    // Get total amount
    const totalAmount = document.getElementById('summary-total').textContent;
    const totalAmountValue = parseInt(totalAmount.replace(/[₹,]/g, ''));
    
    // Convert price from ₹XX,XXX format to number in paise (for Razorpay)
    const amountInPaise = totalAmountValue * 100;
    
    // Create a unique order ID
    const orderId = 'DM' + Math.floor(Math.random() * 10000000) + '_' + Date.now();
    
    // Razorpay options
    const options = {
        key: "rzp_test_T8EE9FAEIYQ8dX", // Your Razorpay key
        amount: amountInPaise,
        currency: "INR",
        name: "Divas Mantra",
        description: `Purchase of ${productName} (Qty: ${quantity})`,
        image: "https://your-logo-url.png", // Replace with your logo URL
        handler: function(response) {
            // Send order notification email
            sendOrderNotificationEmail({
                orderId: orderId,
                paymentId: response.razorpay_payment_id,
                productName: productName,
                quantity: quantity,
                totalAmount: totalAmount,
                customerName: name,
                customerEmail: email,
                customerPhone: phone,
                shippingAddress: shippingAddress,
                shippingMethod: shippingMethod === 'express' ? 'Express (1-2 days)' : 'Standard (3-5 days)',
                orderNotes: orderNotes,
                paymentMethod: 'Razorpay Online Payment'
            });
            
            // Create order date in dd/mm/yyyy format
            const today = new Date();
            const orderDate = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
            
            // Payment successful - show confirmation
            completeOrder(orderId, orderDate);
        },
        prefill: {
            name: name,
            email: email,
            contact: phone
        },
        notes: {
            order_id: orderId,
            product_name: productName,
            quantity: quantity,
            shipping_address: shippingAddress
        },
        theme: {
            color: "#8B4513"
        }
    };
    
    // Initialize Razorpay
    try {
        const razorpayObject = new Razorpay(options);
        razorpayObject.open();
    } catch (error) {
        console.error("Razorpay initialization failed:", error);
        alert("Payment initialization failed. Please try again later.");
    }
}

// Send order notification email using EmailJS
function sendOrderNotificationEmail(orderData) {
    console.log('sendOrderNotificationEmail called with orderData:', JSON.stringify(orderData));
    
    try {
        // A simple function to verify EmailJS is working without sending a test email
        const testEmailJSDirectly = function() {
            console.log("Verifying EmailJS availability...");
            
            if (typeof emailjs === 'undefined') {
                console.error("EmailJS not available for direct use");
                return Promise.reject(new Error("EmailJS not available"));
            }
            
            // Instead of sending a test email, just resolve the promise if EmailJS is available
            return Promise.resolve({
                status: 200,
                text: "EmailJS is available"
            });
        };
        
        // If EmailJS isn't available at all, we can't proceed
        if (typeof emailjs === 'undefined' && typeof window.sendOrderNotificationEmail !== 'function') {
            console.error('EmailJS is not defined and global function not available');
            console.log('Attempting to initialize EmailJS directly...');
            
            // Try to load and initialize EmailJS dynamically as a last resort
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
            script.async = true;
            
            script.onload = function() {
                console.log('EmailJS script loaded dynamically');
                if (typeof emailjs !== 'undefined') {
                    emailjs.init("kgPufTcnaqYTFmAYI");
                    console.log('EmailJS initialized after dynamic loading');
                    // Try again after initialization
                    sendOrderNotificationEmail(orderData);
                }
            };
            
            script.onerror = function() {
                console.error('Failed to load EmailJS script dynamically');
                alert('Order notification service is unavailable. Please contact customer support.');
            };
            
            document.head.appendChild(script);
            return;
        }
        
        // First, try the window function (defined in HTML) which is our primary method
        if (typeof window.sendOrderNotificationEmail === 'function' && window.sendOrderNotificationEmail !== sendOrderNotificationEmail) {
            console.log('Using global sendOrderNotificationEmail function from HTML');
            return window.sendOrderNotificationEmail(orderData);
        } 
        // If global function not available or is this same function (preventing recursion), use direct approach
        else {
            console.log('Using direct EmailJS implementation in product-detail.js');
            
            // Run a direct test first to verify EmailJS is working
            return testEmailJSDirectly()
                .then(function(response) {
                    console.log('Direct EmailJS test successful!', response.status, response.text);
                    
                    // Format order date
                    const orderDate = orderData.orderDate || new Date().toLocaleDateString('en-IN');
                    
                    // Format order summary for merchant email
                    const orderSummary = `Product: ${orderData.productName || "Jewelry Item"}
Quantity: ${orderData.quantity || "1"}
Price: ${orderData.totalAmount || "₹0"}`;

                    // Format customer details for merchant email
                    const customerDetails = `Name: ${orderData.customerName || "Customer"}
Email: ${orderData.customerEmail || "customer@example.com"}
Phone: ${orderData.customerPhone || "Not provided"}
Shipping Address: ${orderData.shippingAddress || "Not provided"}
Shipping Method: ${orderData.shippingMethod || "Standard"}`;

                    // Create merchant template params with formatted fields for the owner template
                    const merchantTemplateParams = {
                        order_id: orderData.orderId || "DM" + Math.floor(Math.random() * 10000000).toString().padStart(7, '0'),
                        payment_id: orderData.paymentId || 'COD - Payment on delivery',
                        order_summary: orderSummary,
                        customer_details: customerDetails,
                        payment_method: orderData.paymentMethod || "Not specified",
                        order_notes: orderData.orderNotes || "None",
                        order_date: orderDate
                    };
                    
                    console.log('Sending actual merchant email with parameters:', JSON.stringify(merchantTemplateParams));
                    
                    // Send merchant email with actual order data
                    return emailjs.send("service_ymsufda", "template_a8trd51", merchantTemplateParams);
                })
                .then(function(response) {
                    console.log('Merchant email sent successfully!', response.status, response.text);
                    
                    // Format order date
                    const orderDate = orderData.orderDate || new Date().toLocaleDateString('en-IN');
                    
                    // Create customer template params
                    const customerTemplateParams = {
                        to_name: orderData.customerName || "Customer",
                        email: orderData.customerEmail || "", // Adding email for the reply-to field
                        order_id: orderData.orderId || "DM" + Math.floor(Math.random() * 10000000).toString().padStart(7, '0'),
                        product_name: orderData.productName || "Jewelry Item",
                        quantity: orderData.quantity || "1",
                        total_amount: orderData.totalAmount || "₹0",
                        shipping_address: orderData.shippingAddress || "Not provided",
                        shipping_method: orderData.shippingMethod || "Standard",
                        payment_method: orderData.paymentMethod || "Not specified",
                        order_date: orderDate
                    };
                    
                    console.log('Sending customer email with template_skjqdcg:', JSON.stringify(customerTemplateParams));
                    
                    // Send customer email
                    // Use the correct customer template ID
                    return emailjs.send("service_ymsufda", "template_skjqdcg", customerTemplateParams);
                })
                .then(function(response) {
                    console.log('Customer email sent successfully!', response.status, response.text);
                    
                    // Show confirmation message
                    const confirmationMsg = document.createElement('div');
                    confirmationMsg.className = 'email-confirmation';
                    confirmationMsg.innerHTML = `
                        <div class="confirmation-message">
                            <i class="fas fa-check-circle"></i>
                            <p>Order confirmation sent</p>
                        </div>
                    `;
                    document.body.appendChild(confirmationMsg);
                    
                    // Remove message after 3 seconds
                    setTimeout(() => {
                        confirmationMsg.style.opacity = '0';
                        setTimeout(() => {
                            confirmationMsg.remove();
                        }, 500);
                    }, 3000);
                    
                    return response;
                })
                .catch(function(error) {
                    console.error('Failed to send order notification email:', error);
                    
                    // Log detailed error for debugging
                    if (error && error.text) {
                        console.error('EmailJS error details:', error.text);
                    }
                    
                    alert('There was an issue sending the order confirmation. Please contact customer support for assistance.');
                    
                    // Try re-initializing EmailJS in case that's the issue
                    console.log('Re-initializing EmailJS and retrying with actual order data...');
                    
                    if (typeof emailjs !== 'undefined') {
                        // Re-initialize with explicit key
                        emailjs.init("kgPufTcnaqYTFmAYI");
                        
                        // No test email - just log the result
                        console.log('EmailJS has been re-initialized. Suggest trying again or contacting support.');
                    }
                });
        }
    } catch (error) {
        console.error('Exception in sendOrderNotificationEmail:', error);
        alert('There was an unexpected error with the notification system. Please contact customer support.');
        return Promise.reject(error);
    }
}

// Function to show payment success message
function showPaymentSuccessMessage(paymentId, productName) {
    // Create success message overlay
    const successOverlay = document.createElement('div');
    successOverlay.className = 'payment-success-overlay';
    successOverlay.innerHTML = `
        <div class="payment-success-modal">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2>Payment Successful!</h2>
            <p>Thank you for your purchase of <strong>${productName}</strong>.</p>
            <p>Your payment reference: <span class="payment-id">${paymentId}</span></p>
            <button class="close-success-btn">Continue Shopping</button>
        </div>
    `;
    document.body.appendChild(successOverlay);
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    // Add event listener to close button
    const closeBtn = successOverlay.querySelector('.close-success-btn');
    closeBtn.addEventListener('click', function() {
        successOverlay.remove();
        document.body.style.overflow = '';
        window.location.href = 'index.html'; // Redirect to home page
    });
}

// Update summary quantity in checkout
function updateSummaryQuantity() {
    const quantity = document.getElementById('product-quantity').value;
    if (document.getElementById('summary-quantity')) {
        document.getElementById('summary-quantity').textContent = quantity;
    }
    updateOrderTotals();
}

// Update shipping cost based on selected shipping method
function updateShippingCost() {
    const shippingMethod = document.querySelector('input[name="shipping"]:checked').value;
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    let shippingText = 'Free';
    
    if (shippingMethod === 'express') {
        shippingText = '₹250';
    }
    
    if (paymentMethod === 'cod') {
        shippingText = shippingMethod === 'express' ? 
            '₹250 + ₹99 COD Fee' : 'Free + ₹99 COD Fee';
    }
    
    document.getElementById('summary-shipping').textContent = shippingText;
}

// Update order totals based on product price, quantity, shipping and payment method
function updateOrderTotals() {
    // Get product price without currency and commas
    const priceElement = document.getElementById('product-price');
    const priceText = priceElement ? priceElement.textContent : '₹58,000';
    const price = parseInt(priceText.replace(/[₹,]/g, ''));
    
    // Get quantity
    const quantity = parseInt(document.getElementById('product-quantity').value);
    
    // Calculate subtotal
    const subtotal = price * quantity;
    
    // Get shipping cost
    const shippingMethod = document.querySelector('input[name="shipping"]:checked').value;
    const shippingCost = shippingMethod === 'express' ? 250 : 0;
    
    // Get payment method - COD fee if applicable
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    const codFee = paymentMethod === 'cod' ? 99 : 0;
    
    // Calculate tax (5%)
    const tax = Math.round(subtotal * 0.05);
    
    // Calculate grand total
    const grandTotal = subtotal + shippingCost + codFee + tax;
    
    // Update summary elements
    if (document.getElementById('summary-subtotal')) {
        document.getElementById('summary-subtotal').textContent = '₹' + subtotal.toLocaleString('en-IN');
        document.getElementById('summary-tax').textContent = '₹' + tax.toLocaleString('en-IN');
        document.getElementById('summary-total').textContent = '₹' + grandTotal.toLocaleString('en-IN');
    }
    
    return grandTotal;
}

// Update order summary with product details
function updateOrderSummary() {
    // Get product details
    const productName = document.getElementById('product-title').textContent;
    const productImage = document.getElementById('main-product-image').src;
    const productPrice = document.getElementById('product-price').textContent;
    
    // Get quantity
    const quantity = document.getElementById('product-quantity').value;
    
    // Update summary elements
    document.getElementById('summary-product-name').textContent = productName;
    document.getElementById('summary-product-image').src = productImage;
    document.getElementById('summary-product-price').textContent = productPrice;
    document.getElementById('summary-quantity').textContent = quantity;
    
    // Update totals
    updateShippingCost();
    updateOrderTotals();
}

// Process Cash on Delivery order
function processCashOnDeliveryOrder() {
    // Get product details
    const productName = document.getElementById('product-title').textContent;
    const productImage = document.getElementById('main-product-image').src;
    const quantity = document.getElementById('product-quantity').value;
    
    // Generate random order number
    const orderNumber = 'DM' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    
    // Get current date in dd/mm/yyyy format
    const today = new Date();
    const orderDate = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
    
    // Get customer details from form
    const name = document.getElementById('full-name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address1 = document.getElementById('address1').value;
    const address2 = document.getElementById('address2').value || '';
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const pincode = document.getElementById('pincode').value;
    const country = document.getElementById('country').value;
    const orderNotes = document.getElementById('order-notes').value || '';
    
    // Get shipping method
    const shippingMethod = document.querySelector('input[name="shipping"]:checked').value;
    
    // Format full shipping address
    const shippingAddress = `${address1}, ${address2 ? address2 + ', ' : ''}${city}, ${state}, ${pincode}, ${country}`;
    
    // Get total amount
    const totalAmount = document.getElementById('summary-total').textContent;
    
    // Send order notification email
    sendOrderNotificationEmail({
        orderId: orderNumber,
        paymentId: 'COD - Payment on delivery',
        productName: productName,
        quantity: quantity,
        totalAmount: totalAmount,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress: shippingAddress,
        shippingMethod: shippingMethod === 'express' ? 'Express (1-2 days)' : 'Standard (3-5 days)',
        orderNotes: orderNotes,
        paymentMethod: 'Cash on Delivery'
    });
    
    // Complete the order
    completeOrder(orderNumber, orderDate);
}

// Complete order and show confirmation
function completeOrder(orderNumber, orderDate) {
    // If order number and date weren't provided, generate them
    if (!orderNumber) {
        orderNumber = 'DM' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    }
    
    if (!orderDate) {
        const today = new Date();
        orderDate = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
    }
    
    // Get total amount
    const totalAmount = document.getElementById('summary-total').textContent;
    
    // Get shipping address components
    const name = document.getElementById('full-name').value;
    const address1 = document.getElementById('address1').value;
    const address2 = document.getElementById('address2').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const pincode = document.getElementById('pincode').value;
    const country = document.getElementById('country').value;
    
    // Format shipping address
    const shippingAddress = `${name}, ${address1}, ${address2 ? address2 + ', ' : ''}${city}, ${state}, ${pincode}, ${country}`;
    
    // Update confirmation page elements
    document.getElementById('confirmation-order-number').textContent = orderNumber;
    document.getElementById('confirmation-order-date').textContent = orderDate;
    document.getElementById('confirmation-order-total').textContent = totalAmount;
    document.getElementById('confirmation-shipping-address').textContent = shippingAddress;
    
    // Update progress steps
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach(step => step.classList.remove('active'));
    progressSteps[2].classList.add('active');
    progressSteps[0].classList.add('completed');
    progressSteps[1].classList.add('completed');
    
    // Show confirmation step
    const checkoutSteps = document.querySelectorAll('.checkout-step');
    checkoutSteps.forEach(step => step.classList.remove('active'));
    checkoutSteps[2].classList.add('active');
}