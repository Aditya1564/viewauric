// Test client for sending emails via the proxy server
document.addEventListener('DOMContentLoaded', function() {
  console.log('Email client initialized');
  
  // EmailJS configuration
  const config = {
    serviceId: 'service_prdjwt4',     // Your EmailJS service ID
    customerTemplateId: 'template_guvarr1', // Template for customer notifications
    ownerTemplateId: 'template_zzlllxm',   // Template for owner notifications
    userId: 'eWkroiiJhLnSK1_Pn',     // Your EmailJS user ID
    ownerEmail: 'auricbysubha.web@gmail.com' // Shop owner email
  };
  
  // Setup event listeners
  const sendButton = document.getElementById('send-email-btn');
  if (sendButton) {
    sendButton.addEventListener('click', sendTestEmails);
  }
  
  // Function to send test emails
  function sendTestEmails() {
    // Show loading state
    const btn = document.getElementById('send-email-btn');
    if (btn) {
      btn.textContent = 'Sending...';
      btn.disabled = true;
    }
    
    // Sample order data for testing
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
    
    // Create formatted items HTML
    const itemsText = orderData.items.map(item => 
      `${item.name} x ${item.quantity} - ₹${item.price}`
    ).join('<br>');
    
    // Prepare customer email data
    const customerEmail = {
      to_name: orderData.customerName,
      to_email: orderData.customerEmail,
      order_id: orderData.orderId,
      order_date: new Date().toLocaleDateString('en-IN'),
      payment_id: orderData.paymentId,
      items: itemsText,
      subtotal: `₹${orderData.subtotal}`,
      shipping: `₹${orderData.shipping}`,
      total: `₹${orderData.total}`,
      shipping_address: `${orderData.address}, ${orderData.city}, ${orderData.state}, ${orderData.postalCode}, ${orderData.country}`
    };
    
    // Prepare owner email data
    const ownerEmail = {
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      customer_phone: orderData.phone,
      to_email: config.ownerEmail,
      order_id: orderData.orderId,
      order_date: new Date().toLocaleDateString('en-IN'),
      payment_id: orderData.paymentId,
      items: itemsText,
      total: `₹${orderData.total}`,
      shipping_address: `${orderData.address}, ${orderData.city}, ${orderData.state}, ${orderData.postalCode}, ${orderData.country}`
    };
    
    // Send customer email via our server proxy
    console.log('Sending customer email with data:', customerEmail);
    fetch('http://localhost:5001/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: config.serviceId,
        template_id: config.customerTemplateId,
        user_id: config.userId,
        template_params: customerEmail
      })
    })
    .then(response => {
      console.log('Customer email response status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('✅ Customer email sent successfully:', data);
      
      // Update UI
      document.getElementById('customer-status').textContent = 'Sent successfully!';
      document.getElementById('customer-status').className = 'success';
    })
    .catch(error => {
      console.error('❌ Error sending customer email:', error);
      
      // Update UI
      document.getElementById('customer-status').textContent = 'Failed to send';
      document.getElementById('customer-status').className = 'error';
    });
    
    // Send owner email via our server proxy
    console.log('Sending owner email with data:', ownerEmail);
    fetch('http://localhost:5001/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: config.serviceId,
        template_id: config.ownerTemplateId,
        user_id: config.userId,
        template_params: ownerEmail
      })
    })
    .then(response => {
      console.log('Owner email response status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('✅ Owner email sent successfully:', data);
      
      // Update UI
      document.getElementById('owner-status').textContent = 'Sent successfully!';
      document.getElementById('owner-status').className = 'success';
    })
    .catch(error => {
      console.error('❌ Error sending owner email:', error);
      
      // Update UI
      document.getElementById('owner-status').textContent = 'Failed to send';
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
});