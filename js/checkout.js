/**
 * Auric Checkout Page functionality
 * Handles checkout form submission, order processing, and email notifications
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Checkout page initialized');
    
    // Initialize EmailJS
    initEmailJS();

    // DOM elements
    const checkoutForm = document.getElementById('checkoutForm');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const orderItems = document.getElementById('orderItems');
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const totalEl = document.getElementById('total');
    const confirmationModal = document.getElementById('confirmationModal');
    const closeModal = document.getElementById('closeModal');
    const continueShopping = document.getElementById('continueShopping');
    const orderReference = document.getElementById('orderReference');
    const orderDetailsConfirmation = document.getElementById('orderDetailsConfirmation');
    
    // Load cart items to order summary
    loadCartItems();
    
    // Event listeners
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleOrderSubmit);
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', closeConfirmationModal);
    }
    
    if (continueShopping) {
        continueShopping.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
    
    // Initialize email functionality (formerly EmailJS)
    function initEmailJS() {
        console.log('Initializing email service');
        // No longer using EmailJS - now using server-side Nodemailer
    }
    
    // Load cart items from localStorage
    function loadCartItems() {
        console.log('Loading cart items for checkout');
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        if (cart.length === 0) {
            // Redirect to cart page if cart is empty
            window.location.href = 'index.html';
            return;
        }
        
        let subtotal = 0;
        const shipping = 0; // Free shipping for now
        
        // Clear order items container
        orderItems.innerHTML = '';
        
        // Add each item to the order summary
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            const orderItemHTML = `
                <div class="order-item">
                    <div class="order-item-image">
                        <img src="${item.image || 'images/product-placeholder.jpg'}" alt="${item.name}">
                    </div>
                    <div class="order-item-details">
                        <h4>${item.name}</h4>
                        <p>Quantity: ${item.quantity}</p>
                    </div>
                    <div class="order-item-price">$${itemTotal.toFixed(2)}</div>
                </div>
            `;
            
            orderItems.innerHTML += orderItemHTML;
        });
        
        // Update totals
        const total = subtotal + shipping;
        subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        shippingEl.textContent = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
        totalEl.textContent = `$${total.toFixed(2)}`;
    }
    
    // Handle order form submission
    async function handleOrderSubmit(e) {
        e.preventDefault();
        
        if (!checkoutForm.checkValidity()) {
            checkoutForm.reportValidity();
            return;
        }
        
        // Show loading state
        placeOrderBtn.classList.add('loading');
        placeOrderBtn.disabled = true;
        
        try {
            // Generate a unique order reference
            const orderRef = generateOrderReference();
            
            // Get cart items
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            
            // Create order summary HTML for email
            const orderSummaryHTML = createOrderSummaryHTML(cart);
            
            // Prepare customer data for email
            const customerName = `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`;
            const customerEmail = document.getElementById('email').value;
            const customerPhone = document.getElementById('phone').value;
            const customerAddress = document.getElementById('address').value;
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
            const orderNotes = document.getElementById('notes').value;
            
            // Get order totals
            const subtotal = parseFloat(subtotalEl.textContent.replace('$', ''));
            const shipping = shippingEl.textContent === 'Free' ? 0 : parseFloat(shippingEl.textContent.replace('$', ''));
            const total = parseFloat(totalEl.textContent.replace('$', ''));
            
            // Prepare template parameters for EmailJS
            const templateParams = {
                order_reference: orderRef,
                from_name: customerName,
                to_email: customerEmail,
                phone: customerPhone,
                address: customerAddress,
                payment_method: paymentMethod,
                notes: orderNotes,
                order_summary: orderSummaryHTML,
                order_total: `$${total.toFixed(2)}`,
                order_date: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            };
            
            console.log('Sending order confirmation email with params:', templateParams);
            
            // Send customer confirmation email
            await sendOrderConfirmationEmail(templateParams);
            
            // Send notification email to shop owner
            await sendOwnerNotificationEmail(templateParams);
            
            // Store order in localStorage
            saveOrderToStorage(orderRef, cart, templateParams);
            
            // Clear cart after successful order
            localStorage.setItem('cart', JSON.stringify([]));
            
            // Display confirmation modal with order details
            showOrderConfirmation(orderRef, cart, total);
            
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('There was an error processing your order. Please try again.');
        } finally {
            // Reset loading state
            placeOrderBtn.classList.remove('loading');
            placeOrderBtn.disabled = false;
        }
    }
    
    // Send order confirmation email to customer using server endpoint
    async function sendOrderConfirmationEmail(templateParams) {
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    emailType: 'customerConfirmation',
                    templateParams: templateParams
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Server responded with status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
            }
            
            const result = await response.json();
            console.log('Customer email sent successfully:', result);
            return result;
        } catch (error) {
            console.error('Error sending customer email:', error);
            throw error;
        }
    }
    
    // Send order notification email to shop owner using server endpoint
    async function sendOwnerNotificationEmail(templateParams) {
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    emailType: 'ownerNotification',
                    templateParams: templateParams
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Server responded with status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
            }
            
            const result = await response.json();
            console.log('Owner notification email sent successfully:', result);
            return result;
        } catch (error) {
            console.error('Error sending owner notification email:', error);
            throw error;
        }
    }
    
    // Generate a unique order reference
    function generateOrderReference() {
        const timestamp = new Date().getTime().toString().slice(-6);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `AUR-${timestamp}-${random}`;
    }
    
    // Create HTML order summary for email
    function createOrderSummaryHTML(cart) {
        let html = `
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
        
        let subtotal = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            html += `
                <tr>
                    <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${item.name}</td>
                    <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${item.price.toFixed(2)}</td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${itemTotal.toFixed(2)}</td>
                </tr>
            `;
        });
        
        const shipping = 0; // Free shipping for now
        const total = subtotal + shipping;
        
        html += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>Subtotal</strong></td>
                        <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>Shipping</strong></td>
                        <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd; font-weight: bold;"><strong>Total</strong></td>
                        <td style="padding: 10px; text-align: right; border: 1px solid #ddd; font-weight: bold;">$${total.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        return html;
    }
    
    // Save order to localStorage
    function saveOrderToStorage(orderRef, cart, orderDetails) {
        // Get existing orders from localStorage
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        
        // Create new order object
        const newOrder = {
            id: orderRef,
            date: new Date().toISOString(),
            items: cart,
            customer: {
                name: orderDetails.from_name,
                email: orderDetails.to_email,
                phone: orderDetails.phone,
                address: orderDetails.address
            },
            payment: orderDetails.payment_method,
            notes: orderDetails.notes,
            total: orderDetails.order_total
        };
        
        // Add new order to orders array
        orders.push(newOrder);
        
        // Save updated orders to localStorage
        localStorage.setItem('orders', JSON.stringify(orders));
        
        console.log('Order saved to localStorage:', newOrder);
    }
    
    // Show order confirmation modal
    function showOrderConfirmation(orderRef, cart, total) {
        // Set order reference in confirmation modal
        orderReference.textContent = orderRef;
        
        // Create order details HTML
        let detailsHTML = '<div class="order-items-confirmation">';
        
        cart.forEach(item => {
            detailsHTML += `
                <div class="order-item-confirmation">
                    <span class="item-name">${item.name}</span>
                    <span class="item-quantity">x${item.quantity}</span>
                    <span class="item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `;
        });
        
        detailsHTML += `
            </div>
            <div class="order-total-confirmation">
                <strong>Total:</strong> $${total.toFixed(2)}
            </div>
        `;
        
        // Set order details in confirmation modal
        orderDetailsConfirmation.innerHTML = detailsHTML;
        
        // Show confirmation modal
        confirmationModal.style.display = 'block';
    }
    
    // Close confirmation modal
    function closeConfirmationModal() {
        confirmationModal.style.display = 'none';
        
        // Redirect to homepage
        window.location.href = 'index.html';
    }
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === confirmationModal) {
            closeConfirmationModal();
        }
    });
});