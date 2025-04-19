/**
 * Divas Mantra Navigation System
 * Exactly matching website screenshots for desktop and mobile
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Navigation system initialized');
    
    // Main navigation elements
    const menuButton = document.getElementById('menuButton');
    const closeButton = document.getElementById('closeButton');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    // Submenu views
    const mainMenuView = document.getElementById('mainMenuView');
    const earringsSubmenuView = document.getElementById('earringsSubmenuView');
    const closeEarringsButton = document.getElementById('closeEarringsButton');
    const backFromEarrings = document.getElementById('backFromEarrings');
    
    // Menu links
    const menuLinks = document.querySelectorAll('.menu-link');
    const categoryHeaders = document.querySelectorAll('.category-header');
    
    // Verify elements
    console.log('Navigation elements found:', {
        menuButton: !!menuButton,
        closeButton: !!closeButton,
        mobileMenu: !!mobileMenu,
        menuLinks: menuLinks.length
    });
    
    /**
     * Open the mobile menu with smooth animation
     */
    function openMobileMenu() {
        console.log('Opening mobile menu');
        if (mobileMenu) {
            mobileMenu.classList.add('active');
            menuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Reset to main menu view
            if (mainMenuView) {
                mainMenuView.style.display = 'block';
            }
            if (earringsSubmenuView) {
                earringsSubmenuView.style.display = 'none';
            }
        }
    }
    
    /**
     * Close the mobile menu with smooth animation
     */
    function closeMobileMenu() {
        console.log('Closing mobile menu');
        if (mobileMenu) {
            mobileMenu.classList.remove('active');
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    /**
     * Toggle a submenu open/closed with smooth animation
     */
    function toggleSubmenu(e) {
        e.preventDefault();
        const submenuId = this.getAttribute('data-submenu');
        console.log('Toggling submenu:', submenuId);
        
        // For any submenu link, handle the click
        if (submenuId && submenuId.endsWith('-submenu')) {
            const targetSubmenu = document.getElementById(submenuId);
            
            // If we have a specific target submenu view defined, use it
            // This is just a special case for the earrings submenu in our example
            if (submenuId === 'earrings-submenu' && earringsSubmenuView) {
                // Reset transform and set initial state for animation
                earringsSubmenuView.style.transform = 'translateX(100%)';
                earringsSubmenuView.style.visibility = 'visible';
                earringsSubmenuView.style.display = 'block';
                earringsSubmenuView.style.opacity = '1';
                
                // Force a reflow to ensure the initial state is rendered
                void earringsSubmenuView.offsetWidth;
                
                // Trigger the slide-in animation
                earringsSubmenuView.classList.add('active');
                earringsSubmenuView.style.transform = 'translateX(0)';
                
                // After animation completes, hide the main menu
                setTimeout(() => {
                    if (mainMenuView) {
                        mainMenuView.style.display = 'none';
                    }
                }, 300);
            } else {
                // Generic handling for other submenu views would go here
                // For now just log a message that we'd need to set up additional submenu views
                console.log('Submenu view not yet implemented for:', submenuId);
            }
        }
    }
    
    /**
     * Toggle a category header's submenu
     */
    function toggleCategory(e) {
        e.preventDefault();
        
        // Find the submenu associated with this category
        const submenu = this.nextElementSibling;
        
        if (submenu && submenu.classList.contains('submenu')) {
            // Toggle the active state
            const isActive = submenu.classList.contains('active');
            
            // Update the icon based on state
            const icon = this.querySelector('i');
            if (icon) {
                if (isActive) {
                    // Closing the submenu
                    submenu.classList.remove('active');
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-right');
                } else {
                    // Opening the submenu
                    submenu.classList.add('active');
                    icon.classList.remove('fa-chevron-right');
                    icon.classList.add('fa-chevron-down');
                }
            }
        }
    }
    
    /**
     * Return to the main menu from a submenu view with smooth transition
     */
    function backToMainMenu(e) {
        e.preventDefault();
        if (mainMenuView && earringsSubmenuView) {
            console.log('Going back to main menu');
            
            // First make sure the main menu is visible behind the submenu
            mainMenuView.style.display = 'block';
            mainMenuView.style.opacity = '1';
            
            // Start the animation to slide out the submenu
            earringsSubmenuView.style.transform = 'translateX(100%)';
            earringsSubmenuView.classList.remove('active');
            
            // After transition is complete, reset and hide the submenu view
            setTimeout(() => {
                // Reset submenu states
                earringsSubmenuView.style.display = 'none';
                earringsSubmenuView.style.visibility = 'hidden';
                earringsSubmenuView.style.opacity = '0';
                
                // Make sure any scrolling in the submenu doesn't affect main menu
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
                if (mainMenuView) {
                    mainMenuView.scrollTop = 0;
                }
            }, 350); // Match the transition time
        }
    }
    
    // Event Listeners
    if (menuButton) {
        menuButton.addEventListener('click', function(e) {
            e.preventDefault();
            openMobileMenu();
        });
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', function(e) {
            e.preventDefault();
            closeMobileMenu();
        });
    }
    
    if (closeEarringsButton) {
        closeEarringsButton.addEventListener('click', function(e) {
            e.preventDefault();
            closeMobileMenu();
        });
    }
    
    if (backFromEarrings) {
        backFromEarrings.addEventListener('click', backToMainMenu);
    }
    
    // Add click events to menu links
    menuLinks.forEach(link => {
        link.addEventListener('click', toggleSubmenu);
    });
    
    // Add click events to category headers
    categoryHeaders.forEach(header => {
        header.addEventListener('click', toggleCategory);
    });
    
    // Close menu when clicking on overlay
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMobileMenu);
    }
});