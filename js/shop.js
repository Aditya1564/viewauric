/**
 * Auric Shop Page
 * 
 * This script handles the shop page functionality:
 * 1. Product filtering by category
 * 2. Sorting products by price (low-high, high-low)
 * 3. Sorting products by newest
 * 4. Updating product count
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize shop functionality when DOM is loaded
    initShop();
});

function initShop() {
    const productsGrid = document.getElementById('products-grid');
    const sortSelect = document.getElementById('sort-by');
    const categorySelect = document.getElementById('filter-category');
    const productCountElement = document.getElementById('product-count');
    
    // Check if we're on the shop page
    if (!productsGrid || !sortSelect || !categorySelect) {
        return; // Not on shop page, exit
    }
    
    console.log('Shop page detected, initializing shop functionality');
    
    // Get all product items
    const allProducts = [...document.querySelectorAll('.product-item')];
    
    // Set up event listeners
    sortSelect.addEventListener('change', () => {
        applyFiltersAndSort();
    });
    
    categorySelect.addEventListener('change', () => {
        applyFiltersAndSort();
    });
    
    // Initialize with default view
    applyFiltersAndSort();
    
    /**
     * Apply selected filters and sorting
     */
    function applyFiltersAndSort() {
        // Get current filter and sort values
        const categoryFilter = categorySelect.value;
        const sortValue = sortSelect.value;
        
        // Filter products
        const filteredProducts = filterProducts(allProducts, categoryFilter);
        
        // Sort filtered products
        const sortedProducts = sortProducts(filteredProducts, sortValue);
        
        // Update product count
        updateProductCount(filteredProducts.length);
        
        // Display products
        displayProducts(sortedProducts);
    }
    
    /**
     * Filter products by category
     * @param {Array} products - Array of product elements
     * @param {String} category - Category to filter by
     * @returns {Array} - Filtered products
     */
    function filterProducts(products, category) {
        if (category === 'all') {
            return products; // Return all products if 'all' is selected
        }
        
        return products.filter(product => {
            return product.dataset.category === category;
        });
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
        
        // Add animation classes
        products.forEach(product => {
            // Clone the node to remove any existing animation classes
            const productClone = product.cloneNode(true);
            productClone.classList.add('visible');
            productsGrid.appendChild(productClone);
        });
        
        // Re-initialize wishlist buttons for newly added elements
        if (typeof WishlistManager !== 'undefined' && WishlistManager.updateWishlistUI) {
            setTimeout(() => {
                WishlistManager.updateWishlistUI();
            }, 100);
        }
    }
    
    /**
     * Update the product count display
     * @param {Number} count - Number of products
     */
    function updateProductCount(count) {
        productCountElement.textContent = count;
    }
}