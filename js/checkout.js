/**
 * Auric Checkout System
 * Handles the checkout process, Razorpay integration, and order processing
 * Author: Auric Jewelry
 * Version: 1.0.1
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Checkout.js initialized at:', new Date().toISOString());
  
  // Initialize EmailJS with the public key provided by the user
  try {
    // Initialize with public key and specify default service
    emailjs.init("eWkroiiJhLnSK1_Pn");
    console.log('EmailJS initialized successfully with public key: eWkroiiJhLnSK1_Pn');
  } catch (error) {
    console.error('Error initializing EmailJS:', error);
  }
  
  // Set up checkout object with methods for handling the checkout process
  const Checkout = {
    
    // Configuration properties
    config: {
      shippingFee: 99, // Standard shipping fee
      currencyCode: 'INR',
      currencySymbol: '₹',
      emailServiceId: 'service_prdjwt4',
      ownerTemplateId: 'template_zzlllxm',  // Template for sending notification to store owner
      customerTemplateId: 'template_guvarr1', // Template for sending receipt to customer
      ownerEmail: 'auricbysubha.web@gmail.com', // Shop owner email address
    },
    
    // Cart data
    cart: {
      items: [],
      subtotal: 0,
      total: 0
    },
    
    // DOM Elements
    elements: {
      orderItemsContainer: document.querySelector('.order-items'),
      subtotalElement: document.querySelector('.summary-subtotal'),
      shippingElement: document.querySelector('.summary-shipping'),
      totalElement: document.querySelector('.summary-total'),
      checkoutForm: document.getElementById('checkout-form'),
      placeOrderBtn: document.getElementById('place-order-btn'),
      authMessage: document.getElementById('auth-message')
    },
    
    /**
     * Initialize the checkout process
     */
    init: function() {
      // Check if user is authenticated
      this.checkAuth();
      
      // Load cart data
      this.loadCartItems();
      
      // Set up event listeners
      this.setupEventListeners();
      
      console.log('Checkout system initialized');
    },
    
    /**
     * Check if user is authenticated
     * Redirect to login if not logged in
     */
    checkAuth: function() {
      auth.onAuthStateChanged((user) => {
        if (user) {
          // User is logged in, prefill email and continue
          console.log('User authenticated:', user.email);
          if (this.elements.checkoutForm) {
            this.elements.checkoutForm.style.display = 'flex';
          }
          if (this.elements.authMessage) {
            this.elements.authMessage.style.display = 'none';
          }
          
          // Pre-fill email if available
          const emailInput = document.getElementById('email');
          if (emailInput && user.email) {
            emailInput.value = user.email;
          }
          
          // Pre-fill name if available
          const nameInput = document.getElementById('full-name');
          if (nameInput && user.displayName) {
            nameInput.value = user.displayName;
          }
        } else {
          // User is not logged in, show auth message
          console.log('User not authenticated, showing login message');
          if (this.elements.checkoutForm) {
            this.elements.checkoutForm.style.display = 'none';
          }
          if (this.elements.authMessage) {
            this.elements.authMessage.style.display = 'block';
          }
        }
      });
    },
    
    /**
     * Load cart items from cart.js system
     */
    loadCartItems: function() {
      console.log('Attempting to load cart items...');
      
      try {
        // Try each possible localStorage key to find cart data
        let storedCart = null;
        
        // First check if we're logged in - prioritize Firestore data for logged in users
        if (auth.currentUser) {
          console.log('User is logged in, loading cart from Firestore');
          this.loadCartFromFirestore(auth.currentUser.uid);
          return; // Early return since Firestore will handle everything
        }
        
        // If not logged in, try the most current format
        storedCart = localStorage.getItem('auricCartItems');
        if (storedCart) {
          console.log('Found cart data in auricCartItems');
        }
        
        // If not found, try the sync metadata format
        if (!storedCart) {
          const cartData = localStorage.getItem('auricCart');
          if (cartData) {
            console.log('Found cart data in auricCart');
            storedCart = cartData;
          }
        }
        
        // Last attempt - try legacy storage format
        if (!storedCart) {
          const cartState = localStorage.getItem('cartState');
          if (cartState) {
            console.log('Found cart data in cartState (legacy format)');
            storedCart = cartState;
          }
        }
        
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          console.log('Parsed cart data:', parsedCart);
          
          // Handle different possible formats
          if (Array.isArray(parsedCart)) {
            // Direct array format
            this.cart.items = parsedCart;
            console.log('Cart items loaded (array format):', this.cart.items);
          } else if (parsedCart.items && Array.isArray(parsedCart.items)) {
            // Object with items array
            this.cart.items = parsedCart.items;
            console.log('Cart items loaded (object.items format):', this.cart.items);
          } else {
            // Unknown format
            console.error('Unknown cart data format:', parsedCart);
            this.cart.items = [];
          }
          
          // For debugging - print out each item in the cart
          this.cart.items.forEach((item, index) => {
            console.log(`Cart item ${index}:`, item);
          });
          
          // If cart is empty after parsing, show empty message
          if (this.cart.items.length === 0) {
            console.log('Cart is empty after parsing');
            this.showEmptyCartMessage();
            return;
          }
          
          // Calculate totals
          this.calculateTotals();
          
          // Render items in order summary
          this.renderOrderItems();
        } else {
          console.log('No cart data found in any storage location');
          this.showEmptyCartMessage();
        }
      } catch (error) {
        console.error('Error loading cart items:', error);
        console.error('Error details:', error.message);
        this.showEmptyCartMessage();
      }
    },
    
    /**
     * Show message for empty cart
     */
    loadCartFromFirestore: function(userId) {
      console.log('Loading cart from Firestore in checkout.js');
      
      // Get the cart data from Firestore
      db.collection('carts').doc(userId).get()
        .then((doc) => {
          if (doc.exists && doc.data().items) {
            // Get items from Firestore
            const firestoreItems = doc.data().items;
            console.log('Found cart items in Firestore:', firestoreItems.length);
            
            // Ensure all items have valid quantity values
            const validatedItems = firestoreItems.map(item => {
              // Force quantity to be 1 if it's invalid or not provided
              if (!item.quantity || isNaN(item.quantity) || item.quantity < 1) {
                console.log('Fixed invalid quantity for item:', item.name);
                item.quantity = 1;
              }
              return item;
            });
            
            // Update our cart with Firestore data
            this.cart.items = validatedItems;
            
            // If cart is empty after parsing, show empty message
            if (this.cart.items.length === 0) {
              console.log('Cart is empty after Firestore load');
              this.showEmptyCartMessage();
              return;
            }
            
            // Calculate totals
            this.calculateTotals();
            
            // Render items in order summary
            this.renderOrderItems();
          } else {
            console.log('No cart found in Firestore or cart is empty');
            this.showEmptyCartMessage();
          }
        })
        .catch(error => {
          console.error('Error loading cart from Firestore:', error);
          this.showEmptyCartMessage();
        });
    },
    
    showEmptyCartMessage: function() {
      if (this.elements.orderItemsContainer) {
        this.elements.orderItemsContainer.innerHTML = `
          <div class="empty-cart-message">
            <p>Your cart is empty. Please add some items before checkout.</p>
            <a href="index.html" class="continue-shopping-btn">Continue Shopping</a>
          </div>
        `;
      }
      
      // Disable place order button
      if (this.elements.placeOrderBtn) {
        this.elements.placeOrderBtn.disabled = true;
      }
    },
    
    /**
     * Calculate subtotal and total based on cart items
     */
    calculateTotals: function() {
      // Calculate subtotal
      this.cart.subtotal = this.cart.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
      
      // Calculate total with shipping
      this.cart.total = this.cart.subtotal + this.config.shippingFee;
      
      // Update UI
      this.updateTotalsUI();
    },
    
    /**
     * Update totals in the UI
     */
    updateTotalsUI: function() {
      if (this.elements.subtotalElement) {
        this.elements.subtotalElement.textContent = `${this.config.currencySymbol}${this.cart.subtotal.toLocaleString('en-IN')}`;
      }
      
      if (this.elements.shippingElement) {
        this.elements.shippingElement.textContent = `${this.config.currencySymbol}${this.config.shippingFee.toLocaleString('en-IN')}`;
      }
      
      if (this.elements.totalElement) {
        this.elements.totalElement.textContent = `${this.config.currencySymbol}${this.cart.total.toLocaleString('en-IN')}`;
      }
    },
    
    /**
     * Render order items in the order summary
     */
    renderOrderItems: function() {
      if (!this.elements.orderItemsContainer) return;
      
      if (this.cart.items.length === 0) {
        this.showEmptyCartMessage();
        return;
      }
      
      let html = '';
      
      this.cart.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        
        html += `
          <div class="order-item" data-product-id="${item.productId}">
            <div class="order-item-image">
              <img src="${item.image || 'images/product-category/IMG_20250504_150241.jpg'}" alt="${item.name}">
            </div>
            <div class="order-item-details">
              <h4>${item.name}</h4>
              <div class="order-item-price">${this.config.currencySymbol}${item.price.toLocaleString('en-IN')}</div>
              <div class="order-item-quantity">Quantity: ${item.quantity}</div>
            </div>
            <div class="order-item-total">
              ${this.config.currencySymbol}${itemTotal.toLocaleString('en-IN')}
            </div>
          </div>
        `;
      });
      
      this.elements.orderItemsContainer.innerHTML = html;
    },
    
    /**
     * Set up event listeners for the checkout form
     */
    setupEventListeners: function() {
      if (this.elements.checkoutForm) {
        this.elements.checkoutForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.processCheckout();
        });
      }
    },
    
    /**
     * Process the checkout when form is submitted
     */
    processCheckout: function() {
      // Check if cart is empty
      if (this.cart.items.length === 0) {
        alert('Your cart is empty. Please add some items before checkout.');
        return;
      }
      
      // Check if user is logged in
      if (!auth.currentUser) {
        alert('Please log in to continue with checkout.');
        window.location.href = 'login.html';
        return;
      }
      
      // Validate form fields
      const form = this.elements.checkoutForm;
      if (!form.checkValidity()) {
        alert('Please fill in all required fields correctly');
        form.reportValidity();
        return;
      }
      
      // Get form data
      const formData = new FormData(form);
      const orderData = {
        customerId: auth.currentUser.uid,
        customerEmail: formData.get('email') || auth.currentUser.email, // Use form email first, fallback to auth email
        customerName: formData.get('fullName'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        postalCode: formData.get('postalCode'),
        country: formData.get('country'),
        orderNotes: formData.get('orderNotes') || '',
        items: this.cart.items,
        subtotal: this.cart.subtotal,
        shipping: this.config.shippingFee,
        total: this.cart.total,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      console.log('Processing checkout with data:', orderData);
      
      // Show loading state
      this.setLoadingState(true);
      
      // Create Razorpay order first
      this.createRazorpayOrder(orderData);
    },
    
    /**
     * Create a Razorpay order via server API
     * This creates an order on our server, which would normally interact with Razorpay's API
     */
    createRazorpayOrder: function(orderData) {
      console.log('Creating Razorpay order with data:', orderData);
      
      // Set loading state to indicate processing
      this.setLoadingState(true);
      
      // Create order data for API request
      const orderRequest = {
        amount: orderData.total * 100, // Amount in paisa
        currency: this.config.currencyCode,
        receipt: 'auric_' + Date.now(),
        notes: {
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.phone,
          shippingAddress: orderData.address
        }
      };
      
      console.log('Sending order request to server API:', orderRequest);
      
      // Call our server API to create a Razorpay order
      fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderRequest)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to create order: ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        console.log('Order created successfully:', data);
        
        // Store the order ID in the order data
        orderData.razorpayOrderId = data.id;
        
        // If direct checkout option is enabled, open Razorpay payment form
        // In test mode, we can open without an order_id
        this.openRazorpayCheckout(orderData);
      })
      .catch(error => {
        console.error('Error creating order:', error);
        alert('There was an error processing your order. Please try again.');
        this.setLoadingState(false);
        
        // Fallback for testing: open Razorpay without order_id
        console.log('Using fallback method for Razorpay checkout');
        orderData.razorpayOrderId = "order_demo_" + Date.now();
        this.openRazorpayCheckout(orderData);
      });
    },
    
    /**
     * Open the Razorpay checkout popup
     */
    openRazorpayCheckout: function(orderData) {
      console.log('Attempting to open Razorpay checkout...');
      
      // Check if Razorpay is available
      if (typeof Razorpay === 'undefined') {
        console.error('Razorpay SDK not loaded');
        alert('Could not load payment gateway. Please refresh the page and try again.');
        this.setLoadingState(false);
        return;
      }
      
      const self = this; // Store reference to 'this' for use in callbacks
      
      // Simplified options for the most reliable test mode operation
      const options = {
        key: "rzp_test_qZWULE2MoPHZJv", // Razorpay test key provided by user
        amount: orderData.total * 100, // Amount in paisa (e.g., 10000 for ₹100)
        currency: "INR",
        name: "Auric Jewelry",
        description: "Premium Jewelry Purchase",
        image: "https://i.imgur.com/n5tjHFD.png", // Hosted image URL
        
        // Handler called after payment success
        handler: function(response) {
          console.log('Payment successful:', response);
          
          // Add payment details to order data
          orderData.paymentId = response.razorpay_payment_id;
          orderData.status = 'paid';
          
          // Save order to Firestore
          self.saveOrderToFirestore(orderData);
        },
        
        // Pre-fill customer information
        prefill: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          contact: orderData.phone
        },
        
        // Add notes for admin reference
        notes: {
          address: orderData.address,
          orderId: orderData.razorpayOrderId
        },
        
        // Theme settings
        theme: {
          color: "#D4AF37" // Gold color matching Auric theme
        },
        
        // Modal settings
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled by user');
            self.setLoadingState(false);
          },
          animate: true,
          backdropclose: false
        }
      };
      
      console.log('Razorpay options:', options);
      
      try {
        // Create and open Razorpay checkout form
        window.rzp1 = new Razorpay(options);
        
        // Add payment failed event handler
        window.rzp1.on('payment.failed', function(response) {
          console.error('Payment failed:', response.error);
          alert('Payment failed: ' + response.error.description);
          self.setLoadingState(false);
        });
        
        // Open the payment form
        window.rzp1.open();
        console.log('Razorpay payment form opened');
      } catch (error) {
        console.error('Error opening Razorpay:', error);
        alert('Could not open payment gateway. Please try again.');
        this.setLoadingState(false);
      }
    },
    
    /**
     * Save order to Firestore after successful payment
     */
    saveOrderToFirestore: function(orderData) {
      console.log('Saving order to Firestore:', orderData);
      
      // Generate a unique order ID for our system
      const orderId = 'AUR-' + Date.now().toString().slice(-8);
      orderData.orderId = orderId;
      
      // Save order to Firestore
      db.collection('orders').doc(orderId).set(orderData)
        .then(() => {
          console.log('Order saved successfully:', orderId);
          
          // Send confirmation emails
          this.sendConfirmationEmails(orderData);
          
          // Clear the cart
          this.clearCart();
          
          // Show success message
          this.showOrderSuccess(orderData);
        })
        .catch(error => {
          console.error('Error saving order:', error);
          alert('Payment was successful, but there was an error saving your order. Please contact customer support with your Razorpay Payment ID: ' + orderData.paymentId);
          this.setLoadingState(false);
        });
    },
    
    /**
     * Send parameters to EmailJS templates
     * This only sends parameters to EmailJS service, which handles the templates and email delivery
     */
    sendConfirmationEmails: function(orderData) {
      console.log('Preparing template parameters for EmailJS');
      
      // Format items for email templates
      const itemsHtml = orderData.items.map(item => {
        return `${item.name} x ${item.quantity} - ₹${(item.price * item.quantity).toLocaleString('en-IN')}`;
      }).join('<br>');
      
      // Create parameters for customer template - ensure recipient is explicitly set
      const customerTemplateParams = {
        to_name: orderData.customerName,
        to_email: orderData.customerEmail, // Using customer's email from the form
        reply_to: this.config.ownerEmail, // Shop email for customer to reply to
        recipient: orderData.customerEmail, // Explicitly set recipient as customer email
        send_to: orderData.customerEmail, // Additional parameter to ensure correct routing
        order_id: orderData.orderId,
        order_date: new Date().toLocaleDateString('en-IN'),
        items: itemsHtml,
        subtotal: `₹${orderData.subtotal.toLocaleString('en-IN')}`,
        shipping: `₹${orderData.shipping.toLocaleString('en-IN')}`,
        total: `₹${orderData.total.toLocaleString('en-IN')}`,
        payment_id: orderData.paymentId,
        shipping_address: `${orderData.address}, ${orderData.city}, ${orderData.state}, ${orderData.postalCode}, ${orderData.country}`
      };
      
      // Create parameters for store owner template - ensure recipient is shop owner
      const ownerTemplateParams = {
        customer_name: orderData.customerName,
        customer_email: orderData.customerEmail,
        reply_to: orderData.customerEmail, // Let owner reply to customer
        recipient: this.config.ownerEmail, // Shop owner email from config
        send_to: this.config.ownerEmail, // Additional parameter to ensure correct routing
        customer_phone: orderData.phone,
        order_id: orderData.orderId,
        order_date: new Date().toLocaleDateString('en-IN'),
        items: itemsHtml,
        total: `₹${orderData.total.toLocaleString('en-IN')}`,
        payment_id: orderData.paymentId,
        shipping_address: `${orderData.address}, ${orderData.city}, ${orderData.state}, ${orderData.postalCode}, ${orderData.country}`
      };
      
      // Log template information with explicit routing information
      console.log('EmailJS template configuration:', {
        service_id: this.config.emailServiceId,
        customer_template_id: `${this.config.customerTemplateId} (sending to: ${orderData.customerEmail})`,
        owner_template_id: `${this.config.ownerTemplateId} (sending to: ${this.config.ownerEmail})`
      });
      
      // First, send the customer email - this template should be configured to send to the customer
      console.log(`Sending customer receipt to: ${orderData.customerEmail}`);
      this.sendTemplateParameters(
        this.config.emailServiceId, 
        this.config.customerTemplateId, 
        customerTemplateParams
      );
      
      // Then, send the owner notification - this template should be configured to send to the owner
      console.log(`Sending owner notification to: ${this.config.ownerEmail}`);
      this.sendTemplateParameters(
        this.config.emailServiceId, 
        this.config.ownerTemplateId, 
        ownerTemplateParams
      );
    },
    
    /**
     * Helper method to send parameters to an EmailJS template
     * This just sends the parameters - EmailJS handles the actual email delivery
     * Using explicit destination management to avoid routing issues
     */
    sendTemplateParameters: function(serviceId, templateId, parameters) {
      // Clone the parameters to avoid modifying the original
      const templateParams = {...parameters};
      
      // Store the recipient email before sending to make explicit in console
      const recipient = templateParams.recipient || templateParams.to_email;
      console.log(`Sending template ${templateId} parameters for recipient: ${recipient}`);
      
      // Send the parameters to EmailJS service
      emailjs.send(serviceId, templateId, templateParams)
        .then(function(response) {
          console.log(`Template parameters sent successfully to ${recipient}:`, response);
        })
        .catch(function(error) {
          console.error(`Error sending template parameters to ${recipient}:`, error);
        });
    },
    
    /**
     * Clear the cart after successful order
     */
    clearCart: function() {
      // Clear cart items array
      this.cart.items = [];
      
      // Clear all localStorage cart items to ensure consistency
      localStorage.setItem('auricCartItems', JSON.stringify([]));
      localStorage.setItem('auricCart', JSON.stringify([])); 
      
      // If user is logged in, clear Firestore cart
      if (auth.currentUser) {
        db.collection('carts').doc(auth.currentUser.uid).set({
          items: [],
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          deviceId: localStorage.getItem('auricCartDeviceId') || 'unknown',
          cartVersion: Date.now().toString(),
          lastOperation: 'clear',
          operationTimestamp: Date.now()
        }).then(() => {
          console.log('Cart cleared in Firestore');
        }).catch(error => {
          console.error('Error clearing cart in Firestore:', error);
        });
      }
    },
    
    /**
     * Show success message after order completion
     */
    showOrderSuccess: function(orderData) {
      // Create success page content
      const successHtml = `
        <div class="checkout-success">
          <div class="icon"><i class="fas fa-check-circle"></i></div>
          <h2>Order Placed Successfully!</h2>
          <p>Thank you for your purchase. We have received your order and will process it shortly.</p>
          
          <div class="order-details">
            <p><span class="label">Order Number:</span> ${orderData.orderId}</p>
            <p><span class="label">Date:</span> ${new Date().toLocaleDateString('en-IN')}</p>
            <p><span class="label">Total Amount:</span> ₹${orderData.total.toLocaleString('en-IN')}</p>
            <p><span class="label">Payment ID:</span> ${orderData.paymentId}</p>
          </div>
          
          <p>A confirmation email has been sent to <strong>${orderData.customerEmail}</strong>.</p>
          <a href="index.html" class="continue-shopping">Continue Shopping</a>
        </div>
      `;
      
      // Replace checkout container with success message
      document.querySelector('.checkout-container').innerHTML = successHtml;
      
      // Update page title
      document.querySelector('.page-title').textContent = 'Order Confirmation';
      
      // Scroll to top of page
      window.scrollTo(0, 0);
    },
    
    /**
     * Set loading state for the place order button
     */
    setLoadingState: function(isLoading) {
      if (this.elements.placeOrderBtn) {
        if (isLoading) {
          this.elements.placeOrderBtn.classList.add('loading');
          this.elements.placeOrderBtn.textContent = 'Processing...';
          this.elements.placeOrderBtn.disabled = true;
        } else {
          this.elements.placeOrderBtn.classList.remove('loading');
          this.elements.placeOrderBtn.textContent = 'Place Order';
          this.elements.placeOrderBtn.disabled = false;
        }
      }
    }
  };
  
  // Initialize the checkout system
  Checkout.init();
});