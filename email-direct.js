/**
 * Direct EmailJS Integration
 * Uses the EmailJS browser library to send emails directly from the client
 * without any backend proxy server.
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('Direct EmailJS client initialized');
  
  // EmailJS configuration
  const EMAIL_CONFIG = {
    serviceId: 'service_prdjwt4',        // Your EmailJS service ID
    customerTemplateId: 'template_guvarr1', // Template for customer notifications
    ownerTemplateId: 'template_zzlllxm',    // Template for owner notifications
    publicKey: 'eWkroiiJhLnSK1_Pn',        // Your EmailJS public key
    ownerEmail: 'auricbysubha.web@gmail.com' // Shop owner email
  };
  
  // Initialize EmailJS
  emailjs.init(EMAIL_CONFIG.publicKey);
  
  // Setup event listeners
  const sendButton = document.getElementById('send-email-btn');
  if (sendButton) {
    sendButton.addEventListener('click', sendTestEmails);
  }
  
  /**
   * Send test emails to customer and owner
   */
  function sendTestEmails() {
    console.log('Starting email sending test...');
    
    // Show loading state
    const btn = document.getElementById('send-email-btn');
    if (btn) {
      btn.textContent = 'Sending...';
      btn.disabled = true;
    }
    
    // Create sample order data
    const orderData = {
      orderId: 'TEST-' + Date.now().toString().substring(7),
      customerName: 'Test Customer',
      customerEmail: 'savannaik090@gmail.com', // Replace with actual test email
      phone: '9876543210',
      address: '123 Test Street, Test Area',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
      items: [{
        name: 'Test Product',
        price: 999,
        quantity: 1
      }],
      subtotal: 999,
      shipping: 99,
      total: 1098,
      paymentId: 'pay_TEST' + Date.now().toString().substring(7)
    };
    
    // Create formatted items text
    const itemsText = orderData.items.map(item => 
      `${item.name} x ${item.quantity} - ₹${item.price}`
    ).join('<br>');
    
    // Prepare customer email template parameters with multiple approaches to ensure delivery
    const customerEmailParams = {
      to_name: orderData.customerName,
      to_email: orderData.customerEmail,
      reply_to: orderData.customerEmail, // This is crucial - it ensures the email is actually sent to the customer
      from_name: "Auric Jewelry",
      from_email: orderData.customerEmail, // Force the recipient to be the customer's email
      recipient: orderData.customerEmail,  // Another approach to set the recipient
      order_id: orderData.orderId,
      order_date: new Date().toLocaleDateString('en-IN'),
      payment_id: orderData.paymentId,
      items: itemsText,
      subtotal: `₹${orderData.subtotal}`,
      shipping: `₹${orderData.shipping}`,
      total: `₹${orderData.total}`,
      shipping_address: `${orderData.address}, ${orderData.city}, ${orderData.state}, ${orderData.postalCode}, ${orderData.country}`
    };
    
    // Prepare owner email template parameters
    const ownerEmailParams = {
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      customer_phone: orderData.phone,
      to_email: EMAIL_CONFIG.ownerEmail,
      order_id: orderData.orderId,
      order_date: new Date().toLocaleDateString('en-IN'),
      payment_id: orderData.paymentId,
      items: itemsText,
      total: `₹${orderData.total}`,
      shipping_address: `${orderData.address}, ${orderData.city}, ${orderData.state}, ${orderData.postalCode}, ${orderData.country}`
    };
    
    // Log parameters for debugging
    console.log('Customer email parameters:', customerEmailParams);
    console.log('Owner email parameters:', ownerEmailParams);
    
    // Send customer email
    sendCustomerEmail(customerEmailParams)
      .then(() => {
        console.log('Customer email sent successfully');
        document.getElementById('customer-status').textContent = 'Sent successfully!';
        document.getElementById('customer-status').className = 'success';
      })
      .catch(error => {
        console.error('Error sending customer email:', error);
        document.getElementById('customer-status').textContent = 'Failed to send: ' + error.message;
        document.getElementById('customer-status').className = 'error';
      });
    
    // Send owner email
    sendOwnerEmail(ownerEmailParams)
      .then(() => {
        console.log('Owner email sent successfully');
        document.getElementById('owner-status').textContent = 'Sent successfully!';
        document.getElementById('owner-status').className = 'success';
      })
      .catch(error => {
        console.error('Error sending owner email:', error);
        document.getElementById('owner-status').textContent = 'Failed to send: ' + error.message;
        document.getElementById('owner-status').className = 'error';
      })
      .finally(() => {
        // Reset button state
        if (btn) {
          btn.textContent = 'Send Test Emails';
          btn.disabled = false;
        }
      });
  }
  
  /**
   * Send customer order confirmation email using EmailJS
   * @param {Object} params Email template parameters
   * @returns {Promise} Promise resolving when email is sent
   */
  function sendCustomerEmail(params) {
    return emailjs.send(
      EMAIL_CONFIG.serviceId,
      EMAIL_CONFIG.customerTemplateId,
      params
    );
  }
  
  /**
   * Send owner order notification email using EmailJS
   * @param {Object} params Email template parameters
   * @returns {Promise} Promise resolving when email is sent
   */
  function sendOwnerEmail(params) {
    return emailjs.send(
      EMAIL_CONFIG.serviceId,
      EMAIL_CONFIG.ownerTemplateId,
      params
    );
  }
});