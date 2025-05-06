document.addEventListener('DOMContentLoaded', function() {
    // Check for pending cart clear from checkout page
    if (localStorage.getItem('pendingCartClear') === 'true') {
        console.log('DETECTED PENDING CART CLEAR FROM CHECKOUT!');
        const clearTime = parseInt(localStorage.getItem('cartClearTime') || '0');
        const timeSinceClear = Date.now() - clearTime;
        
        // Only execute if it's recent (within last 5 minutes)
        if (timeSinceClear < 5 * 60 * 1000) {
            try {
                console.log('Executing pending cart clear script from checkout page');
                
                // Get the script content
                const scriptContent = localStorage.getItem('cartClearScript');
                
                // Execute the script using eval (in a controlled manner)
                if (scriptContent) {
                    const safeExec = Function(scriptContent);
                    safeExec();
                    console.log('Cart clear script executed successfully');
                }
                
                // Also manually force empty cart panel
                if (typeof forceEmptyCartPanel === 'function') {
                    setTimeout(() => {
                        forceEmptyCartPanel();
                        console.log('Directly called forceEmptyCartPanel');
                    }, 1000); // Delay slightly to ensure DOM is ready
                }
                
                // Brute force direct DOM manipulation for cart panel
                setTimeout(() => {
                    // Clear the cart items container
                    const cartItems = document.getElementById('cartItems');
                    if (cartItems) {
                        cartItems.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
                    }
                    
                    // Reset the cart count badge
                    const countBadges = document.querySelectorAll('.cart-count, .cart-badge, .cart-item-count');
                    countBadges.forEach(badge => {
                        badge.textContent = '0';
                        badge.style.display = 'none'; 
                    });
                    
                    // Reset the cart total
                    const totals = document.querySelectorAll('#cartTotal, .cart-total-amount, .cart-subtotal');
                    totals.forEach(total => {
                        total.textContent = '₹0';
                    });
                }, 1500);
                
                // Clear the pending flag to avoid repeated execution
                localStorage.setItem('pendingCartClear', 'false');
            } catch (error) {
                console.error('Error executing post-checkout cart clear script:', error);
            }
        } else {
            console.log('Pending cart clear too old, ignoring');
            localStorage.setItem('pendingCartClear', 'false');
        }
    }
    
    // Menu Toggle Elements
    const menuToggle = document.getElementById('menuToggle');
    const closeMenu = document.getElementById('closeMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const sidebarMenu = document.getElementById('sidebarMenu');
    
    // Sidebar submenu toggle
    const sidebarNavLinks = document.querySelectorAll('.sidebar-nav-link');
    
    // Tabs
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Slider functionality
    const slides = document.querySelectorAll('.slide');
    const sliderDots = document.querySelectorAll('.slider-dot');
    let currentSlide = 0;
    
    // Banner
    const promoBanners = [
        'Save 20% on exclusive selections - <a href="#">Shop Now</a>',
        'Free shipping on orders over ₹5000 - <a href="#">Learn More</a>',
        'New arrivals for the festive season - <a href="#">View Collection</a>'
    ];
    let currentBanner = 0;
    const bannerText = document.querySelector('.promo-banner p');
    const bannerPrev = document.querySelector('.banner-prev');
    const bannerNext = document.querySelector('.banner-next');
    
    // Menu Toggle Functions
    function openMenu() {
        if (sidebarMenu) {
            sidebarMenu.classList.add('active');
            if (menuOverlay) menuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log('Menu opened');
        } else {
            console.error('Sidebar menu element not found');
        }
    }
    
    function closeMenuFunction() {
        if (sidebarMenu) {
            sidebarMenu.classList.remove('active');
            if (menuOverlay) menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
            console.log('Menu closed');
        }
    }
    
    // Event Listeners for menu toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            openMenu();
        });
    } else {
        console.error('Menu toggle element not found');
    }
    
    if (closeMenu) {
        closeMenu.addEventListener('click', function(e) {
            if (e) e.preventDefault();
            closeMenuFunction();
        });
    }
    
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenuFunction);
    }
    
    // Submenu toggle functionality
    function toggleSubmenu(linkElement, submenuId) {
        if (!linkElement || !submenuId) return;
        
        const submenu = document.getElementById(submenuId);
        if (!submenu) return;
        
        // Toggle submenu visibility
        submenu.classList.toggle('active');
        
        // Toggle chevron icon
        const chevron = linkElement.querySelector('i');
        if (chevron) {
            if (submenu.classList.contains('active')) {
                chevron.classList.remove('fa-chevron-right');
                chevron.classList.add('fa-chevron-down');
            } else {
                chevron.classList.remove('fa-chevron-down');
                chevron.classList.add('fa-chevron-right');
            }
        }
    }
    
    // Setup submenu toggles
    const submenuToggles = [
        { link: document.getElementById('earringsLink'), submenuId: 'earringsSubmenu' },
        { link: document.getElementById('necklaceLink'), submenuId: 'necklaceSubmenu' },
        { link: document.getElementById('banglesLink'), submenuId: 'banglesSubmenu' },
        { link: document.getElementById('chainsLink'), submenuId: 'chainsSubmenu' },
        { link: document.getElementById('accessoriesLink'), submenuId: 'accessoriesSubmenu' },
        { link: document.getElementById('collectionsLink'), submenuId: 'collectionsSubmenu' }
    ];
    
    submenuToggles.forEach(item => {
        if (item.link) {
            item.link.addEventListener('click', function(e) {
                e.preventDefault();
                toggleSubmenu(this, item.submenuId);
            });
        }
    });
    
    // Tabs Functionality
    if(tabs.length > 0) {
        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                tabContents[index].classList.add('active');
            });
        });
    }
    
    // Slider Functionality - Simple and reliable
    let sliderInterval;
    
    function showSlide(index) {
        // Remove active class from all slides and dots
        for (let i = 0; i < slides.length; i++) {
            slides[i].classList.remove('active');
            sliderDots[i].classList.remove('active');
        }
        
        // Add active class to current slide and dot
        slides[index].classList.add('active');
        sliderDots[index].classList.add('active');
        
        currentSlide = index;
    }
    
    // Function to advance to the next slide
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }
    
    // Function to start auto-sliding
    function startAutoSlide() {
        // Clear any existing interval first
        if (sliderInterval) {
            clearInterval(sliderInterval);
            console.log("Cleared previous slide interval");
        }
        
        // Set a new interval
        sliderInterval = setInterval(function() {
            nextSlide();
            console.log("Auto advanced to next slide");
        }, 3000); // Change slide every 3 seconds
        
        console.log("Auto slide started with interval of 3 seconds");
    }
    
    // Initialize slider if elements exist
    if (slides.length > 0 && sliderDots.length > 0) {
        console.log("Found " + slides.length + " slides and " + sliderDots.length + " dots");
        
        // Initialize slider
        showSlide(0);
        console.log("Initial slide shown");
        
        // Start auto sliding
        startAutoSlide();
        
        // Add click event to dots
        for (let i = 0; i < sliderDots.length; i++) {
            sliderDots[i].addEventListener('click', function() {
                console.log("Manual switch to slide " + i);
                showSlide(i);
                // Reset the timer when manually changing slides
                startAutoSlide();
            });
        }
    }
    
    // Banner functionality
    function changeBanner(direction) {
        if (direction === 'next') {
            currentBanner = (currentBanner + 1) % promoBanners.length;
        } else {
            currentBanner = (currentBanner - 1 + promoBanners.length) % promoBanners.length;
        }
        
        bannerText.innerHTML = promoBanners[currentBanner];
    }
    
    if(bannerPrev && bannerNext && bannerText) {
        bannerPrev.addEventListener('click', () => changeBanner('prev'));
        bannerNext.addEventListener('click', () => changeBanner('next'));
    }

    // Mobile helper function to test if menu is working
    window.openMobileMenu = function() {
        openMenu();
    };
    
    window.closeMobileMenu = function() {
        closeMenuFunction();
    };
});