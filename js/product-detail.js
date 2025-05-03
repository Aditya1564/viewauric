document.addEventListener('DOMContentLoaded', function() {
    console.log("Product detail script loading...");
    
    // Function to safely update an element's text content if it exists
    function safeUpdateElement(id, value) {
        try {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                console.log(`Successfully updated element ${id} with value:`, value);
                return true;
            } else {
                console.warn(`Element with ID '${id}' not found, cannot update with value:`, value);
                return false;
            }
        } catch (error) {
            console.error(`Error updating element with ID '${id}':`, error);
            return false;
        }
    }
    
    // Product Gallery Thumbnail Functionality
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.getElementById('main-product-image');

    // Only attach event listeners if thumbnails exist
    if (thumbnails && thumbnails.length > 0 && mainImage) {
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', function() {
                // Update active class
                thumbnails.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                // Update main image
                const thumbnailImg = this.querySelector('img');
                if (thumbnailImg) {
                    mainImage.src = thumbnailImg.src.replace('w=200', 'w=800');
                    mainImage.alt = thumbnailImg.alt;
                }
            });
        });
    } else {
        console.log('Product thumbnails or main image not found');
    }

    // Tab Functionality
    const tabs = document.querySelectorAll('.tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Only attach event listeners if tabs exist
    if (tabs && tabs.length > 0 && tabPanes && tabPanes.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                // Hide all tab panes
                tabPanes.forEach(pane => pane.classList.remove('active'));

                // Show the selected tab pane
                const tabId = this.getAttribute('data-tab');
                const selectedPane = document.getElementById(tabId);
                if (selectedPane) {
                    selectedPane.classList.add('active');
                } else {
                    console.warn(`Tab pane with ID '${tabId}' not found`);
                }
            });
        });
    } else {
        console.log('Product tabs or tab panes not found');
    }

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
        safeUpdateElement('price-quantity', currentValue);
    }

    // Decrease quantity button
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', function() {
            if (!quantityInput) return;
            let currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
                updateQuantityDisplay();
            }
        });
    }

    // Increase quantity button
    if (increaseBtn) {
        increaseBtn.addEventListener('click', function() {
            if (!quantityInput) return;
            let currentValue = parseInt(quantityInput.value);
            quantityInput.value = currentValue + 1;
            updateQuantityDisplay();
        });
    }

    // Direct input change
    if (quantityInput) {
        quantityInput.addEventListener('change', function() {
            let currentValue = parseInt(this.value);
            
            // Ensure value is at least 1
            if (isNaN(currentValue) || currentValue < 1) {
                this.value = 1;
            }
            
            updateQuantityDisplay();
        });
    }

    // Add to Cart button
    const addToCartBtn = document.getElementById('add-to-cart');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            try {
                // Get product details
                const productTitle = document.getElementById('product-title');
                const productPrice = document.getElementById('product-price');
                const productImage = document.getElementById('main-product-image');
                const quantity = quantityInput ? quantityInput.value : 1;
                
                if (!productTitle || !productPrice || !productImage) {
                    console.error('Missing required product elements');
                    return;
                }
                
                const productData = {
                    name: productTitle.textContent,
                    price: productPrice.textContent,
                    image: productImage.src,
                    quantity: quantity
                };
                
                console.log('Adding to cart:', productData);
                
                // Show success message
                const successMsg = document.createElement('div');
                successMsg.className = 'add-to-cart-success';
                successMsg.innerHTML = `
                    <div class="success-message">
                        <i class="fas fa-check-circle"></i>
                        <p>Added to cart successfully!</p>
                    </div>
                `;
                document.body.appendChild(successMsg);
                
                // Remove after 3 seconds
                setTimeout(() => {
                    successMsg.style.opacity = '0';
                    setTimeout(() => successMsg.remove(), 500);
                }, 3000);
            } catch (error) {
                console.error('Error adding to cart:', error);
            }
        });
    }

    // Product details for each product ID
    function fetchProductDetails(productId) {
        let productData;

        // Product database with static information
        const productDatabase = {
            'emerald-studs': {
                title: 'Emerald Studded Earrings',
                price: '₹58,000',
                description: 'Handcrafted elegant emerald studded earrings featuring 2.4 carat natural emeralds set in solid 18K gold with diamond accents.',
                imgMain: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
                images: [
                    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200',
                    'https://images.unsplash.com/photo-1596944924616-7b38e7cfbfc8?w=200',
                    'https://images.unsplash.com/photo-1633810203744-c850551a1846?w=200',
                    'https://images.unsplash.com/photo-1611085583191-a3b181a88552?w=200'
                ],
                detailsContent: `
                    <h3>Emerald Studded Earrings - Premium Collection</h3>
                    <p>These exquisite emerald earrings represent the pinnacle of our jewelry craftsmanship, featuring natural emeralds sourced ethically from the mines of Colombia, renowned for producing the finest quality emeralds in the world.</p>
                    <ul>
                        <li><strong>Stone:</strong> 2.4 carat natural emeralds (1.2 carat each)</li>
                        <li><strong>Cut:</strong> Classic octagon cut with 58 facets for maximum brilliance</li>
                        <li><strong>Color:</strong> Rich green with exceptional clarity</li>
                        <li><strong>Metal:</strong> 18K solid gold (yellow gold setting)</li>
                        <li><strong>Accents:</strong> 16 round-cut diamonds (0.32 total carat weight)</li>
                        <li><strong>Style:</strong> Stud earrings with secure screw backs</li>
                        <li><strong>Dimensions:</strong> 9.5mm x 8mm</li>
                        <li><strong>Weight:</strong> 4.8 grams total</li>
                        <li><strong>Certification:</strong> Includes GIA certification for emeralds</li>
                        <li><strong>Origin:</strong> Emeralds sourced from Colombia, handcrafted in Jaipur</li>
                    </ul>
                `,
                careContent: `
                    <h3>Emerald Jewelry Care Instructions</h3>
                    <p>Emeralds are precious gemstones that require special care to maintain their beauty and integrity. Please follow these guidelines:</p>
                    <ul>
                        <li><strong>Storage:</strong> Store your emerald earrings separately from other jewelry to prevent scratches. We recommend keeping them in the provided jewelry box with the soft compartment dividers.</li>
                        <li><strong>Cleaning:</strong> Clean your emerald earrings gently using a soft, lint-free cloth. Avoid using ultrasonic cleaners or steam cleaners as they can damage emeralds.</li>
                        <li><strong>Chemical Exposure:</strong> Remove your earrings before swimming, bathing, or using household cleaners, as chlorine and harsh chemicals can damage both the emeralds and the gold setting.</li>
                        <li><strong>Physical Activity:</strong> Remove earrings before exercising or engaging in physical activities to prevent damage or loss.</li>
                        <li><strong>Oil Treatment:</strong> Many emeralds are treated with oil to enhance their appearance. This treatment may diminish over time, so avoid exposing the stones to heat or solvents which can dry out the oil.</li>
                        <li><strong>Professional Cleaning:</strong> We recommend having your emerald earrings professionally cleaned and inspected annually by our jewelry experts.</li>
                        <li><strong>Reapplication:</strong> Every 2-3 years, consider having the emeralds professionally re-oiled to maintain their optimal appearance.</li>
                    </ul>
                    <p>Remember that emeralds are rated 7.5-8 on the Mohs hardness scale, making them more susceptible to damage than diamonds. With proper care, your emerald earrings will remain beautiful for generations.</p>
                `,
                shippingContent: `
                    <h3>Shipping & Returns</h3>
                    <p>At Divas Mantra, we ensure that your precious jewelry reaches you safely and efficiently.</p>
                    
                    <h4>Shipping Policy:</h4>
                    <ul>
                        <li><strong>Free Insured Shipping:</strong> All orders above ₹25,000 qualify for free, fully insured shipping across India.</li>
                        <li><strong>Delivery Timeline:</strong> Standard delivery within 3-5 business days. Express delivery (₹950 additional charge) available for 1-2 business days delivery.</li>
                        <li><strong>International Shipping:</strong> We ship worldwide. International delivery typically takes 5-7 business days and includes customs clearance assistance.</li>
                        <li><strong>Packaging:</strong> All jewelry comes in our signature wooden gift box with certification and authenticity documents.</li>
                        <li><strong>Tracking:</strong> A tracking number will be provided via email once your order ships.</li>
                    </ul>
                    
                    <h4>Returns & Exchanges:</h4>
                    <ul>
                        <li><strong>30-Day Returns:</strong> We offer a 30-day return policy for unworn items in original condition with all documentation.</li>
                        <li><strong>Exchange Process:</strong> Complimentary exchanges are available. Simply contact our customer service team to initiate the process.</li>
                        <li><strong>Custom Orders:</strong> Made-to-order or personalized pieces cannot be returned unless there is a manufacturing defect.</li>
                        <li><strong>Return Shipping:</strong> Return shipping is complimentary for domestic orders. International customers are responsible for return shipping costs.</li>
                    </ul>
                    
                    <h4>Lifetime Warranty:</h4>
                    <p>Our emerald jewelry comes with a lifetime warranty against manufacturing defects. We also offer:</p>
                    <ul>
                        <li>Complimentary cleaning and inspection twice a year</li>
                        <li>One-time ring size adjustment (if applicable)</li>
                        <li>Setting repair if stones become loose due to normal wear</li>
                    </ul>
                    
                    <p>For any questions regarding shipping or returns, please contact our customer service team at support@divasmantra.com or call +91 98765 43210 during business hours.</p>
                `
            },
            'rose-gold-bracelet': {
                title: 'Rose Gold Filigree Bracelet',
                price: '₹32,500',
                description: 'Delicate rose gold bracelet featuring intricate filigree work with traditional motifs, handcrafted by master artisans from the Mathuram Collection.',
                imgMain: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800',
                images: [
                    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200',
                    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200',
                    'https://images.unsplash.com/photo-1596944924616-7b38e7cfbfc8?w=200',
                    'https://images.unsplash.com/photo-1633810203744-c850551a1846?w=200'
                ],
                detailsContent: `
                    <h3>Rose Gold Filigree Bracelet - Mathuram Collection</h3>
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
                        <li>Certificate of Authenticity with hallmark details</li>
                        <li>Detailed care instructions</li>
                        <li>Complimentary polishing cloth</li>
                    </ul>
                    
                    <h4>Returns & Exchanges</h4>
                    <ul>
                        <li><strong>30-Day Return Policy:</strong> We offer a 30-day money-back guarantee for unworn, unaltered items in original packaging</li>
                        <li><strong>Exchange Policy:</strong> Complimentary exchanges are available within 30 days of purchase</li>
                        <li><strong>Return Process:</strong> Please contact our customer care team to initiate a return or exchange</li>
                        <li><strong>Refund Processing:</strong> Refunds are processed within 7 business days of receiving the returned item</li>
                    </ul>
                    
                    <p>For any questions regarding shipping or returns, please contact our customer service team at support@divasmantra.com or call +91 98765 43210.</p>
                `
            }
        };

        // Retrieve product data
        if (productDatabase[productId]) {
            productData = productDatabase[productId];
            console.log('Found product data for:', productId);
            
            // Update product details on the page
            if (safeUpdateElement('product-title', productData.title)) {
                console.log('Updated product title');
            }
            
            if (safeUpdateElement('product-price', productData.price)) {
                console.log('Updated product price');
            }
            
            if (safeUpdateElement('product-description', productData.description)) {
                console.log('Updated product description');
            }
            
            // Update main product image
            const mainImage = document.getElementById('main-product-image');
            if (mainImage) {
                mainImage.src = productData.imgMain;
                mainImage.alt = productData.title;
                console.log('Updated main product image');
            } else {
                console.warn('Main product image element not found');
            }
            
            // Update thumbnail images
            const thumbnailContainer = document.querySelector('.product-thumbnails');
            if (thumbnailContainer && productData.images && productData.images.length > 0) {
                let thumbnailHTML = '';
                
                productData.images.forEach((img, index) => {
                    const activeClass = index === 0 ? 'active' : '';
                    thumbnailHTML += `
                        <div class="thumbnail ${activeClass}">
                            <img src="${img}" alt="${productData.title} - View ${index + 1}">
                        </div>
                    `;
                });
                
                thumbnailContainer.innerHTML = thumbnailHTML;
                console.log('Updated thumbnail images');
                
                // Re-attach event listeners
                const newThumbnails = document.querySelectorAll('.thumbnail');
                newThumbnails.forEach(thumbnail => {
                    thumbnail.addEventListener('click', function() {
                        // Update active class
                        newThumbnails.forEach(t => t.classList.remove('active'));
                        this.classList.add('active');

                        // Update main image
                        const thumbnailImg = this.querySelector('img');
                        if (thumbnailImg && mainImage) {
                            mainImage.src = thumbnailImg.src.replace('w=200', 'w=800');
                            mainImage.alt = thumbnailImg.alt;
                        }
                    });
                });
            } else {
                console.warn('Thumbnail container not found or no images available');
            }
            
            // Update tab content if it exists
            const detailsContent = document.getElementById('details-content');
            const careContent = document.getElementById('care-content');
            const shippingContent = document.getElementById('shipping-content');
            
            if (detailsContent) {
                detailsContent.innerHTML = productData.detailsContent;
                console.log('Updated details content');
            } else {
                console.warn('Details content container not found');
            }
            
            if (careContent) {
                careContent.innerHTML = productData.careContent;
                console.log('Updated care content');
            } else {
                console.warn('Care content container not found');
            }
            
            if (shippingContent) {
                shippingContent.innerHTML = productData.shippingContent;
                console.log('Updated shipping content');
            } else {
                console.warn('Shipping content container not found');
            }
        } else {
            console.error('Product not found:', productId);
            // Use default product data or show error
            safeUpdateElement('product-title', 'Product Not Found');
            safeUpdateElement('product-price', 'N/A');
            safeUpdateElement('product-description', 'The requested product could not be found. Please try another product.');
        }
    }
});
