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
    
    console.log('URL Parameters:', urlParams.toString());
    console.log('Product ID from URL:', productId);
    
    if (productId) {
        console.log('Loading product details for:', productId);
        fetchProductDetails(productId);
    } else {
        // Default to emerald-studs if no ID is specified
        console.log('No product ID found in URL, defaulting to emerald-studs');
        fetchProductDetails('emerald-studs');
    }

    // Quantity selector functionality
    const decreaseBtn = document.getElementById('decrease-quantity');
    const increaseBtn = document.getElementById('increase-quantity');
    const quantityInput = document.getElementById('product-quantity');

    function updateQuantityDisplay() {
        if (!quantityInput) {
            console.error('Quantity input element not found');
            return;
        }
        
        let currentValue = parseInt(quantityInput.value);
        
        // Update the price summary
        const priceQuantityElement = document.getElementById('price-quantity');
        if (priceQuantityElement) {
            priceQuantityElement.textContent = currentValue;
        }
        
        // Update subtotal
        const subtotalDisplay = document.getElementById('subtotal-display');
        const productPriceElement = document.getElementById('product-price');
        
        if (productPriceElement && subtotalDisplay) {
            const priceText = productPriceElement.textContent;
            const price = parseInt(priceText.replace(/[₹,]/g, ''));
            const subtotal = price * currentValue;
            subtotalDisplay.textContent = '₹' + subtotal.toLocaleString('en-IN');
        }
        
        // Update total amount
        const totalAmountDisplay = document.getElementById('total-amount-display');
        if (totalAmountDisplay && productPriceElement) {
            const priceText = productPriceElement.textContent;
            const price = parseInt(priceText.replace(/[₹,]/g, ''));
            const subtotal = price * currentValue;
            totalAmountDisplay.textContent = '₹' + subtotal.toLocaleString('en-IN');
        }
        
        // Update checkout summary quantity if available
        try {
            updateSummaryQuantity();
        } catch (e) {
            console.log('Summary quantity update skipped:', e.message);
        }
    }

    // Add event listeners only if the elements exist
    if (decreaseBtn && quantityInput) {
        decreaseBtn.addEventListener('click', function() {
            let currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
                updateQuantityDisplay();
            }
        });
    }

    if (increaseBtn && quantityInput) {
        increaseBtn.addEventListener('click', function() {
            let currentValue = parseInt(quantityInput.value);
            if (currentValue < 10) { // Setting max quantity to 10
                quantityInput.value = currentValue + 1;
                updateQuantityDisplay();
            }
        });
    }

    if (quantityInput) {
        quantityInput.addEventListener('change', function() {
            let value = parseInt(this.value);
            
            if (isNaN(value) || value < 1) {
                this.value = 1;
            } else if (value > 10) {
                this.value = 10;
            }
            
            updateQuantityDisplay();
        });
    }

    // Buy Now Button - Opens checkout overlay
    const buyNowButton = document.getElementById('buy-now-button');
    const checkoutOverlay = document.getElementById('checkout-overlay');
    const closeCheckoutBtn = document.getElementById('close-checkout');
    
    // Add event listeners if elements exist
    if (buyNowButton && checkoutOverlay) {
        buyNowButton.addEventListener('click', function() {
            try {
                // Update order summary with current product details
                updateOrderSummary();
                // Show checkout overlay
                checkoutOverlay.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevent scrolling behind overlay
            } catch (e) {
                console.error('Error showing checkout:', e);
            }
        });
    }
    
    if (closeCheckoutBtn && checkoutOverlay) {
        closeCheckoutBtn.addEventListener('click', function() {
            checkoutOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Cancel shipping button
    const cancelShippingBtn = document.getElementById('cancel-shipping');
    if (cancelShippingBtn && checkoutOverlay) {
        cancelShippingBtn.addEventListener('click', function() {
            checkoutOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Checkout Flow Navigation
    const progressSteps = document.querySelectorAll('.progress-step');
    const checkoutSteps = document.querySelectorAll('.checkout-step');
    
    // Next to payment button
    const nextToPaymentBtn = document.getElementById('next-to-payment');
    if (nextToPaymentBtn) {
        nextToPaymentBtn.addEventListener('click', function() {
            try {
                // Validate shipping form
                const shippingForm = document.getElementById('shipping-form');
                if (!shippingForm) {
                    console.error('Shipping form not found');
                    return;
                }
                
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
                if (progressSteps.length >= 2) {
                    progressSteps.forEach(step => step.classList.remove('active'));
                    progressSteps[1].classList.add('active');
                    progressSteps[0].classList.add('completed');
                }
                
                // Update checkout steps
                if (checkoutSteps.length >= 2) {
                    checkoutSteps.forEach(step => step.classList.remove('active'));
                    checkoutSteps[1].classList.add('active');
                }
                
                // Update summary address
                updateOrderSummary();
            } catch (e) {
                console.error('Error proceeding to payment:', e);
            }
        });
    }
    
    // Back to shipping button
    const backToShippingBtn = document.getElementById('back-to-shipping');
    if (backToShippingBtn) {
        backToShippingBtn.addEventListener('click', function() {
            try {
                // Update progress steps
                if (progressSteps.length > 0) {
                    progressSteps.forEach(step => step.classList.remove('active', 'completed'));
                    progressSteps[0].classList.add('active');
                }
                
                // Update checkout steps
                if (checkoutSteps.length >= 2) {
                    checkoutSteps.forEach(step => step.classList.remove('active'));
                    checkoutSteps[0].classList.add('active');
                }
            } catch (e) {
                console.error('Error returning to shipping:', e);
            }
        });
    }
    
    // Place order button
    const placeOrderBtn = document.getElementById('place-order');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', function() {
            try {
                const paymentMethodEl = document.querySelector('input[name="payment"]:checked');
                if (!paymentMethodEl) {
                    alert('Please select a payment method');
                    return;
                }
                
                const paymentMethod = paymentMethodEl.value;
                
                if (paymentMethod === 'razorpay') {
                    initiateRazorpayPayment();
                } else {
                    // For COD payment method
                    processCashOnDeliveryOrder();
                }
            } catch (e) {
                console.error('Error placing order:', e);
            }
        });
    }
    
    // Shipping method change
    const shippingRadios = document.querySelectorAll('input[name="shipping"]');
    if (shippingRadios.length > 0) {
        shippingRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                try {
                    updateShippingCost();
                    updateOrderTotals();
                } catch (e) {
                    console.error('Error updating shipping cost:', e);
                }
            });
        });
    }
    
    // Payment method change
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    if (paymentRadios.length > 0) {
        paymentRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                try {
                    const shippingEl = document.getElementById('summary-shipping');
                    if (shippingEl) {
                        const codFee = this.value === 'cod' ? 99 : 0;
                        const shippingRadioChecked = document.querySelector('input[name="shipping"]:checked');
                        let shippingMethod = 'standard';
                        if (shippingRadioChecked) {
                            shippingMethod = shippingRadioChecked.value;
                        }
                        
                        shippingEl.textContent = this.value === 'cod' ? 
                            'Free + ₹99 COD Fee' : 
                            shippingMethod === 'express' ? '₹250' : 'Free';
                    }
                    updateOrderTotals();
                } catch (e) {
                    console.error('Error updating payment method:', e);
                }
            });
        });
    }
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
            ],
            detailsContent: `
                <p>This exquisite diamond pendant is part of our exclusive Leelah Collection, inspired by traditional designs with a modern twist. Each piece is meticulously crafted by our master jewelers using ethically sourced materials.</p>
                <ul>
                    <li>18K gold pendant featuring a 1.2 carat center diamond</li>
                    <li>Surrounded by 0.5 carats of smaller diamonds</li>
                    <li>Certified by the Gemological Institute</li>
                    <li>Includes a matching 18K gold chain</li>
                    <li>Pendant dimensions: 15mm x 10mm</li>
                    <li>Comes in a luxury jewelry box</li>
                </ul>
            `,
            careContent: `
                <h3>Jewelry Care Instructions</h3>
                <p>To maintain the beauty and longevity of your diamond pendant, please follow these care instructions:</p>
                <ul>
                    <li>Store in the provided jewelry box when not in use</li>
                    <li>Avoid contact with perfumes, lotions, and cosmetics</li>
                    <li>Remove before swimming, bathing, or engaging in physical activities</li>
                    <li>Clean gently with a soft cloth and mild soap solution</li>
                    <li>Have your jewelry professionally cleaned once a year</li>
                </ul>
            `,
            shippingContent: `
                <h3>Shipping Information</h3>
                <p>We offer free insured shipping on all orders.</p>
                <ul>
                    <li>Standard delivery: 3-5 business days</li>
                    <li>Express delivery: 1-2 business days (additional charges apply)</li>
                    <li>International shipping available</li>
                </ul>
                
                <h3>Return Policy</h3>
                <p>We want you to be completely satisfied with your purchase. If for any reason you're not, you may return it within 15 days of receipt.</p>
                <ul>
                    <li>Item must be unworn and in original condition</li>
                    <li>Include all original packaging and documentation</li>
                    <li>Custom orders are non-returnable</li>
                    <li>Return shipping costs are the responsibility of the customer</li>
                </ul>
            `
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
            ],
            detailsContent: `
                <p>These exquisite emerald studs represent the perfect marriage of traditional craftsmanship and contemporary design. Each piece is meticulously handcrafted by our master artisans using ethically sourced, genuine emeralds and precious metals.</p>
                <ul>
                    <li><strong>Material:</strong> 18K Gold with genuine emerald center stones</li>
                    <li><strong>Gemstone:</strong> Natural emeralds (0.85 carats total weight)</li>
                    <li><strong>Clarity:</strong> VS clarity with exceptional color saturation</li>
                    <li><strong>Setting:</strong> Secure 4-prong setting for daily wear</li>
                    <li><strong>Certificate:</strong> Includes gemstone authenticity certificate</li>
                    <li><strong>Backing:</strong> Push-back closures for comfort and security</li>
                    <li><strong>Dimensions:</strong> 8mm diameter facing</li>
                    <li><strong>Weight:</strong> 3.2 grams (pair)</li>
                    <li><strong>Packaging:</strong> Presented in a signature Divas Mantra luxury gift box</li>
                    <li><strong>Origin:</strong> Handcrafted in Jaipur, India</li>
                </ul>
            `,
            careContent: `
                <h3>Emerald Jewelry Care Instructions</h3>
                <p>Emeralds require special care to maintain their brilliance and integrity. Following these guidelines will help preserve the beauty of your emerald studs for generations:</p>
                <ul>
                    <li><strong>Storage:</strong> Store your emerald studs separately in the provided jewelry box to prevent scratches. Emeralds rank 7.5-8 on the Mohs hardness scale and can be scratched by harder gemstones.</li>
                    <li><strong>Chemical Exposure:</strong> Emeralds are particularly sensitive to chemicals. Avoid exposure to household cleaning products, hairspray, perfumes, and cosmetics which can damage the gem's surface or affect the clarity treatment.</li>
                    <li><strong>Cleaning:</strong> Clean your emerald studs gently using a soft, lint-free cloth. For deeper cleaning, use only lukewarm water with a mild, phosphate-free soap. Never use ultrasonic cleaners or steam cleaners, as these can damage emeralds.</li>
                    <li><strong>Temperature:</strong> Avoid extreme temperature changes, as thermal shock can cause emeralds to crack. Remove your studs before saunas, hot tubs, or any high-heat activities.</li>
                    <li><strong>Physical Activities:</strong> Remove your emerald studs before engaging in sports, exercise, or manual labor to prevent damage from impact or excessive pressure.</li>
                    <li><strong>Professional Care:</strong> We recommend bringing your emerald jewelry for professional inspection and gentle cleaning once a year to ensure the settings remain secure.</li>
                    <li><strong>Oil Treatment Maintenance:</strong> Many emeralds are oil-treated to enhance clarity. This treatment may need to be refreshed every few years depending on wear. Our lifetime care program includes complimentary re-oiling when necessary.</li>
                </ul>
            `,
            shippingContent: `
                <h3>Shipping Information</h3>
                <p>At Divas Mantra, we understand the importance of your fine jewelry purchase. All our pieces are securely packaged and fully insured during transit.</p>
                
                <h4>Domestic Shipping</h4>
                <ul>
                    <li><strong>Free Standard Shipping:</strong> 3-5 business days (orders over ₹15,000)</li>
                    <li><strong>Premium Delivery:</strong> 2-3 business days (₹1,200)</li>
                    <li><strong>Express Delivery:</strong> 1-2 business days (₹2,500)</li>
                    <li><strong>Same-Day Delivery:</strong> Available in select metro cities for orders placed before 11 AM (₹3,500)</li>
                </ul>
                
                <h4>International Shipping</h4>
                <ul>
                    <li><strong>Standard International:</strong> 7-10 business days (₹5,000)</li>
                    <li><strong>Express International:</strong> 3-5 business days (₹8,000)</li>
                    <li><strong>Note:</strong> Import duties and taxes are the responsibility of the recipient</li>
                </ul>
                
                <h4>Packaging</h4>
                <p>Each piece arrives in our signature gift packaging, which includes:</p>
                <ul>
                    <li>Handcrafted wooden jewelry box with soft velvet interior</li>
                    <li>Certificate of authenticity and gemstone details</li>
                    <li>Jewelry care guide</li>
                    <li>Complementary cleaning cloth</li>
                </ul>
                
                <h3>Return Policy</h3>
                <p>We want you to be completely satisfied with your Divas Mantra jewelry. If for any reason you're not entirely happy with your purchase, we offer an easy return process.</p>
                
                <h4>Return Eligibility</h4>
                <ul>
                    <li><strong>Return Window:</strong> Within 30 days of delivery</li>
                    <li><strong>Condition:</strong> Item must be unworn, unaltered, with all original tags and protective coverings</li>
                    <li><strong>Packaging:</strong> All original packaging, certificates, and accessories must be included</li>
                    <li><strong>Exceptions:</strong> Custom-designed pieces, engraved items, and special orders are non-returnable</li>
                </ul>
                
                <h4>Exchange & Refund Process</h4>
                <ul>
                    <li><strong>Exchange:</strong> Complimentary for size adjustments or different styles</li>
                    <li><strong>Store Credit:</strong> Full value of the purchase (valid for 1 year)</li>
                    <li><strong>Refund:</strong> Original payment method (processed within 7-10 business days after inspection)</li>
                    <li><strong>Return Shipping:</strong> Return shipping costs are covered for exchanges; ₹1,000 deduction applies for refunds</li>
                </ul>
                
                <p>To initiate a return, please contact our customer care team at <strong>care@divasmantra.com</strong> or call us at <strong>+91 98765 43210</strong>.</p>
            `
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
            ],
            detailsContent: `
                <p>This exquisite rose gold bracelet is an elegant masterpiece from our exclusive Mathuram Collection. Inspired by classical floral motifs with a contemporary twist, each piece is meticulously handcrafted by our master artisans using the finest materials.</p>
                <ul>
                    <li><strong>Material:</strong> 18K Rose Gold with signature polished finish</li>
                    <li><strong>Design:</strong> Intricate filigree work with hand-engraved floral motifs</li>
                    <li><strong>Weight:</strong> 12 grams of solid gold</li>
                    <li><strong>Dimensions:</strong> 6mm width with adjustable 6.5-7.5 inch length</li>
                    <li><strong>Clasp:</strong> Custom-designed secure lobster clasp with safety catch</li>
                    <li><strong>Surface Finish:</strong> Hand-polished with satin accents</li>
                    <li><strong>Craftsmanship:</strong> Each piece requires 25+ hours of skilled artisan work</li>
                    <li><strong>Hallmark:</strong> BIS hallmarked and certified</li>
                    <li><strong>Packaging:</strong> Presented in a signature velvet-lined wooden jewelry box</li>
                    <li><strong>Origin:</strong> Handcrafted in Jaipur, India</li>
                </ul>
            `,
            careContent: `
                <h3>Rose Gold Jewelry Care Instructions</h3>
                <p>Rose gold jewelry requires special attention to maintain its distinctive warm hue and delicate craftsmanship. Follow these guidelines to preserve your bracelet's beauty for generations:</p>
                <ul>
                    <li><strong>Daily Wear:</strong> While rose gold is durable for everyday wear, we recommend removing your bracelet during activities that may subject it to harsh impact or chemicals.</li>
                    <li><strong>Storage:</strong> Store your rose gold bracelet separately in the provided jewelry box to prevent scratches and tangling with other pieces.</li>
                    <li><strong>Chemical Exposure:</strong> Avoid contact with chlorine, household cleaners, perfumes, and lotions which can affect the color and finish of rose gold.</li>
                    <li><strong>Cleaning:</strong> Clean your bracelet gently with a soft, lint-free cloth. For deeper cleaning, use warm water with mild soap and a soft brush to gently clean intricate areas. Rinse thoroughly and pat dry with a soft cloth.</li>
                    <li><strong>Professional Care:</strong> We recommend professional cleaning twice a year to maintain the bracelet's luster and structural integrity.</li>
                    <li><strong>Color Maintenance:</strong> Rose gold may naturally develop a richer patina over time. This is normal and often enhances the vintage appeal of the piece. If you prefer the original finish, professional polishing can restore it.</li>
                    <li><strong>Clasp Check:</strong> Periodically check the clasp mechanism to ensure it remains secure. If you notice any issues, please contact our jewelry care specialists.</li>
                </ul>
                <p>As part of our commitment to lifelong quality, we offer complimentary basic cleaning and clasp checks for all registered pieces twice a year.</p>
            `,
            shippingContent: `
                <h3>Shipping Information</h3>
                <p>At Divas Mantra, we understand the importance of your fine jewelry purchase. All our pieces are securely packaged and fully insured during transit.</p>
                
                <h4>Domestic Shipping</h4>
                <ul>
                    <li><strong>Free Standard Shipping:</strong> 3-5 business days (orders over ₹15,000)</li>
                    <li><strong>Premium Delivery:</strong> 2-3 business days (₹1,200)</li>
                    <li><strong>Express Delivery:</strong> 1-2 business days (₹2,500)</li>
                    <li><strong>Same-Day Delivery:</strong> Available in select metro cities for orders placed before 11 AM (₹3,500)</li>
                </ul>
                
                <h4>International Shipping</h4>
                <ul>
                    <li><strong>Standard International:</strong> 7-10 business days (₹5,000)</li>
                    <li><strong>Express International:</strong> 3-5 business days (₹8,000)</li>
                    <li><strong>Note:</strong> Import duties and taxes are the responsibility of the recipient</li>
                </ul>
                
                <h4>Packaging</h4>
                <p>Each piece arrives in our signature gift packaging, which includes:</p>
                <ul>
                    <li>Handcrafted wooden jewelry box with soft velvet interior</li>
                    <li>Certificate of authenticity</li>
                    <li>Jewelry care guide</li>
                    <li>Complementary cleaning cloth</li>
                </ul>
                
                <h3>Return Policy</h3>
                <p>We want you to be completely satisfied with your Divas Mantra jewelry. If for any reason you're not entirely happy with your purchase, we offer an easy return process.</p>
                
                <h4>Return Eligibility</h4>
                <ul>
                    <li><strong>Return Window:</strong> Within 30 days of delivery</li>
                    <li><strong>Condition:</strong> Item must be unworn, unaltered, with all original tags and protective coverings</li>
                    <li><strong>Packaging:</strong> All original packaging, certificates, and accessories must be included</li>
                    <li><strong>Exceptions:</strong> Custom-designed pieces, engraved items, and special orders are non-returnable</li>
                </ul>
                
                <h4>Exchange & Refund Process</h4>
                <ul>
                    <li><strong>Exchange:</strong> Complimentary for size adjustments or different styles</li>
                    <li><strong>Store Credit:</strong> Full value of the purchase (valid for 1 year)</li>
                    <li><strong>Refund:</strong> Original payment method (processed within 7-10 business days after inspection)</li>
                    <li><strong>Return Shipping:</strong> Return shipping costs are covered for exchanges; ₹1,000 deduction applies for refunds</li>
                </ul>
                
                <p>To initiate a return, please contact our customer care team at <strong>care@divasmantra.com</strong> or call us at <strong>+91 98765 43210</strong>.</p>
            `
        }
    };

    // Get product data or use default if not found
    const product = products[productId] || products['diamond-pendant'];

    // Helper function to safely update element text content
    function safeUpdateElement(id, value) {
        const element = document.getElementById(id);
        if (element && value) {
            element.textContent = value;
        }
    }

    // Update basic product information
    safeUpdateElement('product-title', product.name);
    safeUpdateElement('product-price', product.price);
    safeUpdateElement('product-brand', 'Jewellery Hubb Jaipur');
    
    // Update tab content
    console.log('Attempting to update tab content for', product.name);
    console.log('Available tabs:', document.querySelectorAll('.tab-pane').length);
    console.log('Tab IDs:', Array.from(document.querySelectorAll('.tab-pane')).map(el => el.id));
    
    if (product.detailsContent) {
        console.log('Details content available:', product.detailsContent.substring(0, 50) + '...');
        const detailsTab = document.getElementById('details');
        console.log('Details tab found:', detailsTab ? 'Yes' : 'No');
        if (detailsTab) {
            console.log('Found details tab, updating content');
            detailsTab.innerHTML = product.detailsContent;
        } else {
            console.error('Details tab element not found');
        }
    } else {
        console.error('No details content available for', product.name);
    }
    
    if (product.careContent) {
        const careTab = document.getElementById('care');
        if (careTab) {
            console.log('Found care tab, updating content');
            careTab.innerHTML = product.careContent;
        } else {
            console.error('Care tab element not found');
        }
    }
    
    if (product.shippingContent) {
        const shippingTab = document.getElementById('shipping');
        if (shippingTab) {
            console.log('Found shipping tab, updating content');
            shippingTab.innerHTML = product.shippingContent;
        } else {
            console.error('Shipping tab element not found');
        }
    }
    
    // Update main image
    const mainImage = document.getElementById('main-product-image');
    if (mainImage) {
        mainImage.src = product.mainImage;
        mainImage.alt = product.name;
    }
    
    // Update thumbnails if available
    if (product.images && product.images.length > 0) {
        const thumbnailsContainer = document.querySelector('.product-thumbnail-gallery');
        if (thumbnailsContainer) {
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
                    if (mainImage) {
                        mainImage.src = img.src.replace('w=200', 'w=800');
                        mainImage.alt = img.alt;
                    }
                });
            });
        }
    }
}

// Function to initialize Razorpay payment
function initiateRazorpayPayment() {
    try {
        // Get product details safely
        const productTitleEl = document.getElementById('product-title');
        const productImageEl = document.getElementById('main-product-image');
        const quantityEl = document.getElementById('product-quantity');
        
        if (!productTitleEl || !productImageEl || !quantityEl) {
            console.error('Missing required elements for payment');
            alert('Unable to process payment at this time. Some product details are missing.');
            return;
        }
        
        const productName = productTitleEl.textContent;
        const productImage = productImageEl.src;
        const quantity = quantityEl.value;
    
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
  } catch (error) {
    console.error("Payment setup error:", error);
    alert("Payment processing error. Please try again later.");
  }
}

// Final completely rewritten function to GUARANTEE no test emails are sent
function sendOrderNotificationEmail(orderData) {
    // Put in a global override to catch and prevent any test email attempts
    window.originalConsoleLog = window.originalConsoleLog || console.log;
    console.log = function() {
        const args = Array.from(arguments);
        if (args[0] === "Running direct EmailJS test...") {
            window.originalConsoleLog.call(console, "🛑 PREVENTED TEST EMAIL");
            return; // Block the test message
        }
        window.originalConsoleLog.apply(console, args);
    };
    
    try {
        window.originalConsoleLog.call(console, '📧 Sending real order email for order:', orderData.orderId);
        
        if (!emailjs) {
            alert('Email service unavailable');
            return Promise.reject('EmailJS not available');
        }
        
        // Generate required parameters
        const orderDate = orderData.orderDate || new Date().toLocaleDateString();
        const orderId = orderData.orderId || "DM" + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
        
        // 1. Send merchant notification DIRECTLY (no test)
        const merchantData = {
            order_id: orderId,
            payment_id: orderData.paymentId || '',
            order_summary: `Product: ${orderData.productName}\nQuantity: ${orderData.quantity}\nPrice: ${orderData.totalAmount}`,
            customer_details: `Name: ${orderData.customerName}\nEmail: ${orderData.customerEmail}\nPhone: ${orderData.customerPhone}\nAddress: ${orderData.shippingAddress}`,
            payment_method: orderData.paymentMethod || '',
            order_notes: orderData.orderNotes || '',
            order_date: orderDate
        };
        
        window.originalConsoleLog.call(console, '📧 Merchant email parameters:', JSON.stringify(merchantData));
        
        // Direct call without any test or verification
        return emailjs.send("service_ymsufda", "template_a8trd51", merchantData)
            .then(function() {
                window.originalConsoleLog.call(console, '✓ Merchant email sent');
                
                // 2. Send customer email
                const customerData = {
                    to_name: orderData.customerName || '',
                    email: orderData.customerEmail || '', // Essential for reply-to functionality
                    order_id: orderId,
                    product_name: orderData.productName || '',
                    quantity: orderData.quantity || '',
                    total_amount: orderData.totalAmount || '',
                    shipping_address: orderData.shippingAddress || '',
                    shipping_method: orderData.shippingMethod || '',
                    payment_method: orderData.paymentMethod || '',
                    order_date: orderDate
                };
                
                window.originalConsoleLog.call(console, '📧 Customer email parameters:', JSON.stringify(customerData));
                return emailjs.send("service_ymsufda", "template_skjqdcg", customerData);
            })
            .then(function() {
                window.originalConsoleLog.call(console, '✓ Customer email sent');
                
                // Show success UI
                const msg = document.createElement('div');
                msg.className = 'email-confirmation';
                msg.innerHTML = `<div class="confirmation-message"><i class="fas fa-check-circle"></i><p>Order confirmation sent</p></div>`;
                document.body.appendChild(msg);
                setTimeout(() => {
                    msg.style.opacity = '0';
                    setTimeout(() => msg.remove(), 500);
                }, 3000);
                
                return {status: 200, text: "Emails sent"};
            })
            .catch(function(error) {
                window.originalConsoleLog.call(console, '❌ Email error:', error);
                alert('Email sending failed. Please contact support.');
                return Promise.reject(error);
            });
    } catch (error) {
        window.originalConsoleLog.call(console, '❌ Unexpected error:', error);
        alert('Notification system error. Please contact support.');
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
    try {
        // Get product price without currency and commas
        const priceElement = document.getElementById('product-price');
        const priceText = priceElement ? priceElement.textContent : '₹58,000';
        const price = parseInt(priceText.replace(/[₹,]/g, ''));
        
        // Get quantity safely
        const quantityInput = document.getElementById('product-quantity');
        if (!quantityInput) {
            console.log('Quantity input not found, using default quantity of 1');
            return; // Exit early if we can't find the quantity element
        }
        const quantity = parseInt(quantityInput.value) || 1;
        
        // Calculate subtotal
        const subtotal = price * quantity;
        
        // Get shipping cost safely
        const shippingMethodEl = document.querySelector('input[name="shipping"]:checked');
        if (!shippingMethodEl) {
            console.log('Shipping method not found');
            return; // Exit early if we can't find the shipping method
        }
        const shippingMethod = shippingMethodEl.value;
        const shippingCost = shippingMethod === 'express' ? 250 : 0;
        
        // Get payment method safely
        const paymentMethodEl = document.querySelector('input[name="payment"]:checked');
        if (!paymentMethodEl) {
            console.log('Payment method not found');
            return; // Exit early if we can't find the payment method
        }
        const paymentMethod = paymentMethodEl.value;
        const codFee = paymentMethod === 'cod' ? 99 : 0;
        
        // Calculate tax (5%)
        const tax = Math.round(subtotal * 0.05);
        
        // Calculate grand total
        const grandTotal = subtotal + shippingCost + codFee + tax;
        
        // Update summary elements safely
        const summarySubtotal = document.getElementById('summary-subtotal');
        const summaryTax = document.getElementById('summary-tax');
        const summaryTotal = document.getElementById('summary-total');
        
        if (summarySubtotal && summaryTax && summaryTotal) {
            summarySubtotal.textContent = '₹' + subtotal.toLocaleString('en-IN');
            summaryTax.textContent = '₹' + tax.toLocaleString('en-IN');
            summaryTotal.textContent = '₹' + grandTotal.toLocaleString('en-IN');
        }
    } catch (error) {
        console.error('Error updating order totals:', error);
    }
    
    // For backward compatibility, return a default value
    return 0;
}

// Update order summary with product details
function updateOrderSummary() {
    try {
        // Get product details safely
        const titleEl = document.getElementById('product-title');
        const imageEl = document.getElementById('main-product-image');
        const priceEl = document.getElementById('product-price');
        const quantityEl = document.getElementById('product-quantity');
        
        // Check if all required elements exist
        if (!titleEl || !imageEl || !priceEl || !quantityEl) {
            console.error('Missing required product elements for summary');
            return;
        }
        
        const productName = titleEl.textContent;
        const productImage = imageEl.src;
        const productPrice = priceEl.textContent;
        const quantity = quantityEl.value;
        
        // Get summary elements
        const summaryNameEl = document.getElementById('summary-product-name');
        const summaryImageEl = document.getElementById('summary-product-image');
        const summaryPriceEl = document.getElementById('summary-product-price');
        const summaryQuantityEl = document.getElementById('summary-quantity');
        
        // Check if summary elements exist
        if (!summaryNameEl || !summaryImageEl || !summaryPriceEl || !summaryQuantityEl) {
            console.error('Missing required summary elements');
            return;
        }
        
        // Update summary elements
        summaryNameEl.textContent = productName;
        summaryImageEl.src = productImage;
        summaryPriceEl.textContent = productPrice;
        summaryQuantityEl.textContent = quantity;
        
        // Update totals
        try {
            updateShippingCost();
        } catch (e) {
            console.error('Error updating shipping cost:', e);
        }
        
        try {
            updateOrderTotals();
        } catch (e) {
            console.error('Error updating order totals:', e);
        }
    } catch (error) {
        console.error('Error updating order summary:', error);
    }
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