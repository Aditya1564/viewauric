/**
 * Auric Shop Page - New Design
 * 
 * This script handles the shop page functionality:
 * 1. Product filtering by category and availability
 * 2. Sorting products by price (low-high, high-low)
 * 3. Sorting products by newest
 * 4. Modal filter UI
 * 5. Dropdown sort UI
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize shop functionality when DOM is loaded
    initShop();
});

function initShop() {
    const productsGrid = document.getElementById('products-grid');
    const filterOption = document.querySelector('.filter-option');
    const sortOption = document.querySelector('.sort-option');
    const sortDropdown = document.querySelector('.sort-dropdown');
    const sortDropdownOptions = document.querySelectorAll('.sort-dropdown-option');
    const filterModal = document.querySelector('.filter-modal');
    const closeFilterModalBtn = document.querySelector('.close-filter-modal');
    const applyFilterBtn = document.querySelector('.apply-filter-btn');
    const clearFilterBtn = document.querySelector('.clear-filter-btn');
    
    // Check if we're on the shop page
    if (!productsGrid) {
        return; // Not on shop page, exit
    }
    
    console.log('Shop page detected, initializing new shop functionality');
    
    // Get all product items
    const allProducts = [...document.querySelectorAll('.product-card')];
    
    // Current filter and sort settings
    let currentSettings = {
        category: 'all',
        availability: [],
        sortBy: 'featured'
    };
    
    // Set up event listeners for filtering and sorting
    
    // Filter button opens the filter modal
    if (filterOption) {
        filterOption.addEventListener('click', () => {
            if (filterModal) {
                filterModal.classList.add('active');
            }
        });
    }
    
    // Close filter modal
    if (closeFilterModalBtn && filterModal) {
        closeFilterModalBtn.addEventListener('click', () => {
            filterModal.classList.remove('active');
        });
    }
    
    // Sort dropdown toggle
    if (sortOption && sortDropdown) {
        sortOption.addEventListener('click', (e) => {
            e.stopPropagation();
            sortOption.classList.toggle('active');
            sortDropdown.classList.toggle('active');
        });
        
        // Close sort dropdown when clicking outside
        document.addEventListener('click', () => {
            sortOption.classList.remove('active');
            sortDropdown.classList.remove('active');
        });
        
        // Prevent dropdown from closing when clicking inside it
        sortDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Sort dropdown options
    if (sortDropdownOptions) {
        sortDropdownOptions.forEach(option => {
            option.addEventListener('click', () => {
                const sortValue = option.getAttribute('data-sort');
                currentSettings.sortBy = sortValue;
                
                // Update active class
                sortDropdownOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Update sort option text
                const sortText = option.textContent;
                const sortSpan = sortOption.querySelector('span');
                if (sortSpan) {
                    sortSpan.textContent = sortText;
                }
                
                // Close dropdown
                sortDropdown.classList.remove('active');
                sortOption.classList.remove('active');
                
                // Apply filters and sort
                applyFiltersAndSort();
            });
        });
    }
    
    // Apply filter button
    if (applyFilterBtn && filterModal) {
        applyFilterBtn.addEventListener('click', () => {
            // Get selected category
            const categoryRadios = document.querySelectorAll('input[name="category"]');
            let selectedCategory = 'all';
            
            categoryRadios.forEach(radio => {
                if (radio.checked) {
                    selectedCategory = radio.value;
                }
            });
            
            // Get selected availability options
            const availabilityCheckboxes = document.querySelectorAll('input[name="availability"]');
            const selectedAvailability = [];
            
            availabilityCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    selectedAvailability.push(checkbox.value);
                }
            });
            
            // Update current settings
            currentSettings.category = selectedCategory;
            currentSettings.availability = selectedAvailability;
            
            // Close filter modal
            filterModal.classList.remove('active');
            
            // Apply filters and sort
            applyFiltersAndSort();
        });
    }
    
    // Clear filter button
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', () => {
            // Reset all filter inputs
            const categoryRadios = document.querySelectorAll('input[name="category"]');
            const availabilityCheckboxes = document.querySelectorAll('input[name="availability"]');
            
            // Reset category to 'all'
            categoryRadios.forEach(radio => {
                radio.checked = radio.value === 'all';
            });
            
            // Uncheck all availability options
            availabilityCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // Update current settings
            currentSettings.category = 'all';
            currentSettings.availability = [];
        });
    }
    
    // Add to cart buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    if (addToCartButtons) {
        addToCartButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const productCard = button.closest('.product-card');
                const productId = productCard.dataset.productId;
                
                console.log(`Adding product ${productId} to cart`);
                
                // If CartManager exists, add product to cart
                if (typeof CartManager !== 'undefined' && CartManager.addToCart) {
                    // Get product details
                    const productTitle = productCard.querySelector('.product-title').textContent;
                    const productPrice = parseInt(productCard.dataset.price);
                    const productImage = productCard.querySelector('.product-image img').src;
                    
                    const product = {
                        id: productId,
                        name: productTitle,
                        price: productPrice,
                        image: productImage,
                        quantity: 1
                    };
                    
                    CartManager.addToCart(product);
                }
            });
        });
    }
    
    // Initialize with default view
    applyFiltersAndSort();
    
    /**
     * Apply selected filters and sorting
     */
    function applyFiltersAndSort() {
        // Filter products
        let filteredProducts = filterProducts(allProducts, currentSettings.category, currentSettings.availability);
        
        // Sort filtered products
        const sortedProducts = sortProducts(filteredProducts, currentSettings.sortBy);
        
        // Display products
        displayProducts(sortedProducts);
    }
    
    /**
     * Filter products by category and availability
     * @param {Array} products - Array of product elements
     * @param {String} category - Category to filter by
     * @param {Array} availability - Array of availability options
     * @returns {Array} - Filtered products
     */
    function filterProducts(products, category, availability) {
        // First filter by category
        let filteredByCategory = products;
        
        if (category !== 'all') {
            filteredByCategory = products.filter(product => {
                return product.dataset.category === category;
            });
        }
        
        // Then filter by availability if any are selected
        if (availability && availability.length > 0) {
            return filteredByCategory.filter(product => {
                const badge = product.querySelector('.product-badge');
                if (!badge) return false;
                
                const badgeText = badge.textContent.trim().toLowerCase();
                
                return availability.some(option => {
                    if (option === 'ready-to-ship') {
                        return badgeText.includes('ready to ship');
                    } else if (option === 'made-to-order') {
                        return badgeText.includes('made to order');
                    }
                    return false;
                });
            });
        }
        
        return filteredByCategory;
    }
    
    /**
     * Sort products by selected criteria
     * @param {Array} products - Array of product elements to sort
     * @param {String} sortBy - Sorting criteria
     * @returns {Array} - Sorted products
     */
    function sortProducts(products, sortBy) {
        const productsCopy = [...products]; // Create a copy to avoid modifying original
        
        switch (sortBy) {
            case 'price-low-high':
                return productsCopy.sort((a, b) => {
                    const priceA = parseFloat(a.dataset.price);
                    const priceB = parseFloat(b.dataset.price);
                    return priceA - priceB;
                });
                
            case 'price-high-low':
                return productsCopy.sort((a, b) => {
                    const priceA = parseFloat(a.dataset.price);
                    const priceB = parseFloat(b.dataset.price);
                    return priceB - priceA;
                });
                
            case 'newest':
                return productsCopy.sort((a, b) => {
                    const dateA = new Date(a.dataset.date);
                    const dateB = new Date(b.dataset.date);
                    return dateB - dateA; // Newest first
                });
                
            case 'featured':
            default:
                // For featured, keep original order
                return productsCopy;
        }
    }
    
    /**
     * Display products in the grid
     * @param {Array} products - Array of product elements to display
     */
    function displayProducts(products) {
        // Clear grid first
        productsGrid.innerHTML = '';
        
        if (products.length === 0) {
            // Show no results message
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.innerHTML = '<p>No products match your filters. Please try different criteria.</p>';
            productsGrid.appendChild(noResults);
            return;
        }
        
        // Add products with animation
        products.forEach(product => {
            // Clone the node to remove any existing animation classes
            const productClone = product.cloneNode(true);
            
            // Re-attach event listener to add to cart button
            const addToCartBtn = productClone.querySelector('.add-to-cart-btn');
            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const productId = productClone.dataset.productId;
                    console.log(`Adding product ${productId} to cart`);
                    
                    // If CartManager exists, add product to cart
                    if (typeof CartManager !== 'undefined' && CartManager.addToCart) {
                        // Get product details
                        const productTitle = productClone.querySelector('.product-title').textContent;
                        const productPrice = parseInt(productClone.dataset.price);
                        const productImage = productClone.querySelector('.product-image img').src;
                        
                        const product = {
                            id: productId,
                            name: productTitle,
                            price: productPrice,
                            image: productImage,
                            quantity: 1
                        };
                        
                        CartManager.addToCart(product);
                    }
                });
            }
            
            productsGrid.appendChild(productClone);
        });
    }
}