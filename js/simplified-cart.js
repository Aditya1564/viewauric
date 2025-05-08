/**
 * Simplified Cart System
 * In-memory cart implementation with no storage persistence
 */

// Cart object to hold items in memory
class AuricCart {
  constructor() {
    // Cart state
    this.items = [];
    this.initialized = false;
    
    // DOM elements
    this.cartCountElement = null;
    this.cartTotalElement = null;
    this.slidingCartItemsContainer = null;
    this.addToCartButtons = null;
    
    this.initialize();
  }
  
  initialize() {
    if (this.initialized) return;
    
    console.log('Initializing simplified cart system');
    
    // Initialize DOM elements
    this.cartCountElement = document.querySelector('.cart-count');
    this.cartTotalElement = document.querySelector('.subtotal-amount');
    this.slidingCartItemsContainer = document.getElementById('sliding-cart-items');
    this.addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Show empty cart message initially
    this.updateCartUI();
    
    this.initialized = true;
    console.log('Simplified cart system initialized');
  }
  
  setupEventListeners() {
    // Add to cart button click handlers
    this.addToCartButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const productCard = button.closest('.product-card, .arrival-item, .product-details');
        
        if (productCard) {
          // Extract product information
          const productId = productCard.dataset.productId || `product-${Date.now()}`;
          const name = productCard.querySelector('.product-title, .arrival-title')?.textContent || 'Product';
          const priceElement = productCard.querySelector('.current-price, .product-price');
          const price = priceElement ? this.extractPrice(priceElement.textContent) : 1999;
          const image = productCard.querySelector('img')?.src || '';
          
          this.addItem({
            productId,
            name,
            price,
            image,
            quantity: 1
          });
          
          console.log(`Added product to cart: ${name}`);
          this.showAddToCartConfirmation(name);
        } else {
          console.error('Product card not found');
        }
      });
    });
    
    // Event delegation for cart item buttons (increment, decrement, remove)
    if (this.slidingCartItemsContainer) {
      this.slidingCartItemsContainer.addEventListener('click', (e) => {
        const target = e.target;
        
        // Handle quantity increment
        if (target.classList.contains('increment-quantity')) {
          const productId = target.closest('.cart-item').dataset.productId;
          this.incrementQuantity(productId);
        }
        
        // Handle quantity decrement
        else if (target.classList.contains('decrement-quantity')) {
          const productId = target.closest('.cart-item').dataset.productId;
          this.decrementQuantity(productId);
        }
        
        // Handle remove item
        else if (target.classList.contains('remove-item')) {
          const productId = target.closest('.cart-item').dataset.productId;
          this.removeItem(productId);
        }
      });
    }
    
    // Setup checkout button
    const checkoutButton = document.querySelector('.checkout-btn');
    if (checkoutButton) {
      checkoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (this.items.length === 0) {
          alert('Your cart is empty. Please add items before proceeding to checkout.');
          return;
        }
        
        window.location.href = 'checkout.html';
      });
    }
  }
  
  // Extract price value from formatted price string
  extractPrice(priceString) {
    const numericString = priceString.replace(/[^0-9.]/g, '');
    return parseFloat(numericString) || 0;
  }
  
  // Add an item to the cart
  addItem(item) {
    const existingItemIndex = this.items.findIndex(i => i.productId === item.productId);
    
    if (existingItemIndex !== -1) {
      // Item already exists, increment quantity
      this.items[existingItemIndex].quantity += 1;
    } else {
      // Add new item
      this.items.push(item);
    }
    
    // Update UI
    this.updateCartUI();
    this.renderCartItems();
  }
  
  // Remove an item from the cart
  removeItem(productId) {
    this.items = this.items.filter(item => item.productId !== productId);
    
    // Update UI
    this.updateCartUI();
    this.renderCartItems();
    
    console.log(`Removed product from cart: ${productId}`);
  }
  
  // Increment item quantity
  incrementQuantity(productId) {
    const item = this.items.find(item => item.productId === productId);
    
    if (item) {
      item.quantity += 1;
      
      // Update UI
      this.updateCartUI();
      this.renderCartItems();
      
      console.log(`Incremented quantity for ${productId}`);
    }
  }
  
  // Decrement item quantity
  decrementQuantity(productId) {
    const item = this.items.find(item => item.productId === productId);
    
    if (item) {
      if (item.quantity > 1) {
        item.quantity -= 1;
      } else {
        // Remove the item if quantity becomes 0
        this.removeItem(productId);
        return;
      }
      
      // Update UI
      this.updateCartUI();
      this.renderCartItems();
      
      console.log(`Decremented quantity for ${productId}`);
    }
  }
  
  // Get the total quantity of items in the cart
  getTotalQuantity() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }
  
  // Calculate the cart subtotal
  calculateSubtotal() {
    return this.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }
  
  // Format price as Indian Rupees
  formatPrice(price) {
    return `₹${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
  
  // Update the cart UI with current totals
  updateCartUI() {
    const totalQuantity = this.getTotalQuantity();
    const subtotal = this.calculateSubtotal();
    
    // Update cart count badge
    if (this.cartCountElement) {
      this.cartCountElement.textContent = totalQuantity;
      this.cartCountElement.style.display = totalQuantity > 0 ? 'block' : 'none';
    }
    
    // Update subtotal amount
    if (this.cartTotalElement) {
      this.cartTotalElement.textContent = this.formatPrice(subtotal);
    }
    
    console.log(`Cart updated: ${totalQuantity} items, total: ${this.formatPrice(subtotal)}`);
  }
  
  // Render cart items in the cart container
  renderCartItems() {
    if (!this.slidingCartItemsContainer) return;
    
    if (this.items.length === 0) {
      // Show empty cart message
      this.slidingCartItemsContainer.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
      return;
    }
    
    // Create HTML for cart items
    let html = '';
    
    this.items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      
      html += `
        <div class="cart-item" data-product-id="${item.productId}">
          <div class="cart-item-image">
            <img src="${item.image}" alt="${item.name}">
          </div>
          <div class="cart-item-details">
            <h4 class="cart-item-title">${item.name}</h4>
            <div class="cart-item-price">${this.formatPrice(item.price)}</div>
            <div class="cart-item-controls">
              <div class="quantity-controls">
                <button class="quantity-btn decrement-quantity">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn increment-quantity">+</button>
              </div>
              <button class="remove-item">Remove</button>
            </div>
          </div>
          <div class="cart-item-total">${this.formatPrice(itemTotal)}</div>
        </div>
      `;
    });
    
    // Update the cart container with the generated HTML
    this.slidingCartItemsContainer.innerHTML = html;
  }
  
  // Show a confirmation message after adding to cart
  showAddToCartConfirmation(productName) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('add-to-cart-toast');
    
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'add-to-cart-toast';
      toast.className = 'toast-message';
      document.body.appendChild(toast);
    }
    
    // Set the message
    toast.textContent = `${productName} added to cart`;
    toast.classList.add('show');
    
    // Hide the toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
  
  // Clear the cart (for checkout completion)
  clearCart() {
    this.items = [];
    this.updateCartUI();
    this.renderCartItems();
    console.log('Cart cleared');
  }
}

// Initialize the cart when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Create a global cart instance
  window.cart = new AuricCart();
  
  // Make a direct cart toggle fallback available
  setupDirectCartToggle();
});

// Direct minimal cart panel functionality - as a global fallback
function setupDirectCartToggle() {
  console.log('Setting up direct cart toggle as additional failsafe');
  
  // Skip if on checkout page
  if (window.location.pathname.includes('checkout.html')) {
    console.log("On checkout page - skipping direct cart toggle setup");
    return;
  }
  
  // Find elements needed for basic cart panel operation
  const cartToggle = document.querySelector('.cart-toggle');
  const cartPanel = document.querySelector('.cart-panel');
  const cartOverlay = document.querySelector('.cart-overlay');
  const closeCartBtn = document.querySelector('.close-cart-btn');
  const continueShopping = document.querySelector('.cart-panel-buttons .view-cart-btn');
  
  if (cartToggle && cartPanel && cartOverlay) {
    // Handle opening the cart panel
    cartToggle.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Direct cart toggle clicked');
      
      // Show panel and overlay
      cartPanel.style.right = '0';
      cartPanel.classList.add('active');
      cartOverlay.style.display = 'block';
      cartOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    
    // Handle closing via close button
    if (closeCartBtn) {
      closeCartBtn.addEventListener('click', function() {
        cartPanel.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    }
    
    // Handle closing via overlay
    cartOverlay.addEventListener('click', function() {
      cartPanel.classList.remove('active');
      cartOverlay.classList.remove('active');
      document.body.style.overflow = '';
    });
    
    // Handle continue shopping button
    if (continueShopping) {
      continueShopping.addEventListener('click', function(e) {
        e.preventDefault();
        cartPanel.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    }
  } else {
    console.error('Direct cart toggle setup failed - missing elements');
  }
}