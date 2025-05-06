// Add a test button for Razorpay
window.addEventListener('DOMContentLoaded', function() {
    console.log("Checking Razorpay SDK integration...");
    
    // Create test button
    const testButtonContainer = document.createElement('div');
    testButtonContainer.style.position = 'fixed';
    testButtonContainer.style.top = '10px';
    testButtonContainer.style.right = '10px';
    testButtonContainer.style.zIndex = '9999';
    testButtonContainer.style.padding = '5px';
    testButtonContainer.style.background = 'rgba(255,255,255,0.8)';
    testButtonContainer.style.borderRadius = '5px';
    
    const testButton = document.createElement('button');
    testButton.className = 'btn btn-sm btn-warning';
    testButton.textContent = 'Test Razorpay';
    testButton.onclick = function() {
        try {
            if (typeof Razorpay === 'undefined') {
                console.error("Razorpay SDK not loaded");
                alert("Razorpay SDK not loaded. Make sure you're including checkout.razorpay.com/v1/checkout.js script.");
                return;
            }
            
            console.log("Razorpay SDK is available, creating test instance");
            
            const testOptions = {
                key: 'rzp_test_qZWULE2MoPHZJv',
                amount: 10000, // 100 INR in paise
                currency: 'INR',
                name: 'Auric Jewelry',
                description: 'Test Payment',
                handler: function(response) {
                    console.log("Test payment successful:", response);
                    alert("Test payment successful: " + JSON.stringify(response));
                }
            };
            
            console.log("Creating test Razorpay instance with options:", testOptions);
            const rzp = new Razorpay(testOptions);
            console.log("Test Razorpay instance created successfully");
            
            console.log("Opening test Razorpay payment modal");
            rzp.on('payment.failed', function (response){
                console.error('Payment failed:', response.error);
                alert('Payment failed: ' + response.error.description);
            });
            
            rzp.open();
            console.log("Test Razorpay open() method called");
        } catch (error) {
            console.error("Error in test Razorpay:", error);
            alert("Test Razorpay error: " + error.message);
        }
    };
    
    testButtonContainer.appendChild(testButton);
    document.body.appendChild(testButtonContainer);
});