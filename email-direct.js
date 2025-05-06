/**
 * Email functionality has been completely removed
 * This is a placeholder file for compatibility
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('Email functionality has been completely removed');
  
  // Setup event listeners for any remaining email buttons
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
  
  /**
   * Placeholder for sendCustomerEmail - does nothing
   */
  window.sendCustomerEmail = function(params) {
    console.log('Email functionality has been removed. Not sending email with params:', params);
    return Promise.resolve({ status: 'ok', message: 'Email functionality has been removed' });
  };
  
  /**
   * Placeholder for sendOwnerEmail - does nothing
   */
  window.sendOwnerEmail = function(params) {
    console.log('Email functionality has been removed. Not sending email with params:', params);
    return Promise.resolve({ status: 'ok', message: 'Email functionality has been removed' });
  };
});