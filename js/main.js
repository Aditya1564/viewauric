document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing menu system');
    
    // Initialize CartManager if available
    if (window.CartManager && typeof CartManager.init === 'function') {
        CartManager.init();
        console.log("CartManager initialized from main.js");
        
        // Make cart functions available globally
        window.openCart = function() {
            console.log("Global openCart called");
            CartManager.openCartPanel();
        };
        
        window.closeCart = function() {
            console.log("Global closeCart called");
            CartManager.closeCartPanel();
        };
        
        window.toggleCart = function() {
            console.log("Global toggleCart called");
            CartManager.toggleCartPanel();
        };
    }
    
    // Menu elements
    const menuToggle = document.getElementById('menuToggle');
    const closeMenu = document.getElementById('closeMenu');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    // Debug elements presence
    console.log('menuToggle:', menuToggle ? 'found' : 'missing');
    console.log('closeMenu:', closeMenu ? 'found' : 'missing');
    console.log('sidebarMenu:', sidebarMenu ? 'found' : 'missing');
    console.log('menuOverlay:', menuOverlay ? 'found' : 'missing');
    
    // Menu toggle functionality
    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            console.log('Menu toggle clicked');
            if (sidebarMenu) {
                sidebarMenu.classList.add('active');
                console.log('Added active class to sidebarMenu');
            }
            if (menuOverlay) {
                menuOverlay.classList.add('active');
                console.log('Added active class to menuOverlay');
            }
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeMenu) {
        closeMenu.addEventListener('click', function(e) {
            console.log('Close menu clicked');
            if (sidebarMenu) {
                sidebarMenu.classList.remove('active');
                console.log('Removed active class from sidebarMenu');
            }
            if (menuOverlay) {
                menuOverlay.classList.remove('active');
                console.log('Removed active class from menuOverlay');
            }
            document.body.style.overflow = '';
        });
    }
    
    if (menuOverlay) {
        menuOverlay.addEventListener('click', function(e) {
            console.log('Menu overlay clicked');
            if (sidebarMenu) {
                sidebarMenu.classList.remove('active');
                console.log('Removed active class from sidebarMenu');
            }
            if (menuOverlay) {
                menuOverlay.classList.remove('active');
                console.log('Removed active class from menuOverlay');
            }
            document.body.style.overflow = '';
        });
    }
    
    // Global helper functions for debugging
    window.toggleSidebar = function() {
        console.log('Manual sidebar toggle called');
        if (sidebarMenu) {
            sidebarMenu.classList.toggle('active');
            console.log('Toggled sidebarMenu');
        }
        if (menuOverlay) {
            menuOverlay.classList.toggle('active'); 
            console.log('Toggled menuOverlay');
        }
    };

    // Submenu toggle functionality
    const submenuItems = {
        'earringsLink': 'earringsSubmenu',
        'necklaceLink': 'necklaceSubmenu',
        'banglesLink': 'banglesSubmenu',
        'chainsLink': 'chainsSubmenu',
        'accessoriesLink': 'accessoriesSubmenu',
        'collectionsLink': 'collectionsSubmenu'
    };

    // Set up event listeners for each submenu toggle
    for (const linkId in submenuItems) {
        const link = document.getElementById(linkId);
        const submenuId = submenuItems[linkId];
        
        if (link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const submenu = document.getElementById(submenuId);
                
                // Only toggle if submenu exists
                if (submenu) {
                    submenu.classList.toggle('active');
                    
                    // Toggle icon rotation
                    const icon = this.querySelector('i');
                    if (icon) {
                        if (submenu.classList.contains('active')) {
                            icon.classList.remove('fa-chevron-right');
                            icon.classList.add('fa-chevron-down');
                        } else {
                            icon.classList.remove('fa-chevron-down');
                            icon.classList.add('fa-chevron-right');
                        }
                    }
                }
            });
        }
    }
});