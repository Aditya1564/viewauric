// Email functionality has been completely removed
document.addEventListener('DOMContentLoaded', function() {
  console.log('Email functionality has been completely removed');
  
  // Setup event listeners
  const sendButton = document.getElementById('send-email-btn');
  if (sendButton) {
    sendButton.addEventListener('click', function() {
      alert('Email functionality has been completely removed from the application.');
      
      // Update UI if elements exist
      const customerStatus = document.getElementById('customer-status');
      const ownerStatus = document.getElementById('owner-status');
      
      if (customerStatus) {
        customerStatus.textContent = 'Email functionality removed';
        customerStatus.className = 'info';
      }
      
      if (ownerStatus) {
        ownerStatus.textContent = 'Email functionality removed';
        ownerStatus.className = 'info';
      }
    });
  }
});