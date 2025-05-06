// Enhanced no-cache HTTP server with Razorpay API support and Nodemailer for emails
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');
const nodemailer = require('nodemailer');

const PORT = 5000;

// Create a nodemailer transporter using Gmail credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'auricbysubha.web@gmail.com',
    pass: 'vjkf sdow gkro szjx'
  }
});

// Razorpay API keys
const RAZORPAY_KEY_ID = "rzp_test_qZWULE2MoPHZJv";
const RAZORPAY_SECRET = "dwhI00HuTIRk5T61AyUq1Bhh";

// MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf'
};

// Helper function to parse JSON body from requests
const getRequestBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsedBody = body ? JSON.parse(body) : {};
        resolve(parsedBody);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', (error) => {
      reject(error);
    });
  });
};

// Create the HTTP server
const server = http.createServer(async (req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Add no-cache headers to prevent browser caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Add CORS headers for API routes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle API routes for Razorpay
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Handle preflight CORS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Handle the Razorpay order creation API
  if (req.method === 'POST' && pathname === '/api/create-razorpay-order') {
    try {
      const body = await getRequestBody(req);
      console.log('Creating Razorpay order with data:', body);
      
      // Make an actual request to Razorpay API
      const razorpayData = {
        amount: body.amount,
        currency: body.currency || 'INR',
        receipt: body.receipt || 'receipt_' + Date.now(),
        notes: {
          orderSource: 'Auric Jewelry Website',
          customerName: body.name || 'Customer',
          customerEmail: body.email || '',
          customerPhone: body.phone || ''
        }
      };
      
      // Create the auth header for Basic Auth with API key and secret
      const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_SECRET}`).toString('base64');
      
      // Define options for the API request
      const options = {
        hostname: 'api.razorpay.com',
        port: 443,
        path: '/v1/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        }
      };
      
      // Make the request to Razorpay API
      const razorpayResponse = await new Promise((resolve, reject) => {
        const apiReq = https.request(options, (apiRes) => {
          let data = '';
          
          apiRes.on('data', (chunk) => {
            data += chunk;
          });
          
          apiRes.on('end', () => {
            try {
              const parsedData = JSON.parse(data);
              resolve({
                statusCode: apiRes.statusCode,
                data: parsedData
              });
            } catch (error) {
              reject(error);
            }
          });
        });
        
        apiReq.on('error', (error) => {
          reject(error);
        });
        
        apiReq.write(JSON.stringify(razorpayData));
        apiReq.end();
      });
      
      console.log('Razorpay API response:', razorpayResponse);
      
      if (razorpayResponse.statusCode === 200 || razorpayResponse.statusCode === 201) {
        // Return the Razorpay order details along with our key ID
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          id: razorpayResponse.data.id,
          amount: razorpayResponse.data.amount,
          currency: razorpayResponse.data.currency,
          key: RAZORPAY_KEY_ID
        }));
      } else {
        // Handle error responses from Razorpay
        console.error('Razorpay API error:', razorpayResponse.data);
        res.writeHead(razorpayResponse.statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Failed to create Razorpay order',
          details: razorpayResponse.data
        }));
      }
      return;
    } catch (error) {
      console.error('Error processing order creation:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create order' }));
      return;
    }
  }
  
  // Handle email sending with Nodemailer
  if (req.method === 'POST' && pathname === '/api/send-email') {
    try {
      const body = await getRequestBody(req);
      console.log('Received email request:', body);
      
      // Extract email details from the request
      const { emailType, templateParams } = body;
      
      let mailOptions = {};
      
      if (emailType === 'customerConfirmation') {
        // Customer confirmation email
        mailOptions = {
          from: '"Auric Jewelry" <auricbysubha.web@gmail.com>',
          to: templateParams.to_email,
          subject: `Order Confirmation - ${templateParams.order_reference}`,
          html: generateCustomerEmailHTML(templateParams)
        };
      } else if (emailType === 'ownerNotification') {
        // Owner notification email
        mailOptions = {
          from: '"Auric Jewelry Website" <auricbysubha.web@gmail.com>',
          to: 'auricbysubha.web@gmail.com', // Send to shop owner
          subject: `New Order Received - ${templateParams.order_reference}`,
          html: generateOwnerEmailHTML(templateParams)
        };
      } else {
        throw new Error('Invalid email type specified');
      }
      
      // Send email using Nodemailer
      const info = await transporter.sendMail(mailOptions);
      
      console.log('Email sent successfully:', info.messageId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        messageId: info.messageId 
      }));
      
    } catch (error) {
      console.error('Error sending email:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Failed to send email',
        details: error.message
      }));
    }
    return;
  }
  
  // Handle regular file requests
  let filePath = pathname === '/' ? './index.html' : '.' + pathname;
  
  // Remove query string if present (should already be handled by url.parse)
  filePath = filePath.split('?')[0];
  
  const extname = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      // If the file doesn't exist, return a 404 error
      if (err.code === 'ENOENT') {
        console.error(`File not found: ${filePath}`);
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        // For other errors, return a 500 error
        console.error(`Server error: ${err.code}`);
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // If the file exists, return it with the appropriate content type
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Generate HTML for customer order confirmation email
function generateCustomerEmailHTML(params) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
      <div style="background-color: #f5b642; padding: 20px; text-align: center; color: white;">
        <h2>Thank You for Your Order!</h2>
      </div>
      <div style="padding: 20px;">
        <p>Dear ${params.from_name},</p>
        
        <p>Thank you for placing your order with us. We're delighted to confirm that your order has been received and is being processed.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p><strong>Order Reference:</strong> <span style="color: #f5b642; font-weight: bold;">${params.order_reference}</span></p>
          <p><strong>Order Date:</strong> ${params.order_date}</p>
          <p><strong>Payment Method:</strong> ${params.payment_method}</p>
          <p><strong>Delivery Address:</strong><br>${params.address}</p>
        </div>
        
        <h3 style="border-bottom: 2px solid #f5b642; padding-bottom: 10px;">Order Summary</h3>
        
        ${params.order_summary}
        
        <p><strong>Total:</strong> ${params.order_total}</p>
        
        <p>If you have any questions about your order, please contact us with your order reference.</p>
        
        <p>Thank you for shopping with us!</p>
        
        <p>Best regards,<br>The Auric Jewelry Team</p>
      </div>
      <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>This is an automated email, please do not reply directly to this message.</p>
      </div>
    </div>
  `;
}

// Generate HTML for owner order notification email
function generateOwnerEmailHTML(params) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
      <div style="background-color: #4287f5; padding: 20px; text-align: center; color: white;">
        <h2>New Order Received</h2>
      </div>
      <div style="padding: 20px;">
        <p>You have received a new order from ${params.from_name}.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #4287f5;">Customer Information</h3>
          <p><strong>Name:</strong> ${params.from_name}</p>
          <p><strong>Email:</strong> ${params.to_email}</p>
          <p><strong>Phone:</strong> ${params.phone}</p>
          <p><strong>Delivery Address:</strong><br>${params.address}</p>
          <p><strong>Order Notes:</strong> ${params.notes || 'None'}</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p><strong>Order Reference:</strong> <span style="color: #4287f5; font-weight: bold;">${params.order_reference}</span></p>
          <p><strong>Order Date:</strong> ${params.order_date}</p>
          <p><strong>Payment Method:</strong> ${params.payment_method}</p>
        </div>
        
        <h3 style="border-bottom: 2px solid #4287f5; padding-bottom: 10px;">Order Summary</h3>
        
        ${params.order_summary}
        
        <p><strong>Total:</strong> ${params.order_total}</p>
        
        <p>Please process this order at your earliest convenience.</p>
      </div>
      <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>This is an automated email notification for your shop's orders.</p>
      </div>
    </div>
  `;
}

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n--- No-cache server with Razorpay support starting ---');
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
  console.log(`Local files will not be cached by the browser`);
  console.log(`API endpoints:`);
  console.log(`  - Razorpay: /api/create-razorpay-order`);
  console.log(`  - Email: /api/send-email`);
  console.log(`Press Ctrl+C to stop the server\n`);
});
