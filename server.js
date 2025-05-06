// Enhanced no-cache HTTP server with Razorpay API support and EmailJS proxy
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');

const PORT = 5000;

// Razorpay API keys
const RAZORPAY_KEY_ID = "rzp_test_qZWULE2MoPHZJv";
const RAZORPAY_SECRET = "dwhI00HuTIRk5T61AyUq1Bhh";

// EmailJS Configuration
const EMAILJS_PUBLIC_KEY = "eWkroiiJhLnSK1_Pn";
const EMAILJS_API_URL = "api.emailjs.com";

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
      
      // In a production environment, this would call the Razorpay API
      // For this demo, we'll create a mock order ID that works with test mode
      const orderId = 'order_' + Date.now();
      
      // Return success response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: orderId,
        amount: body.amount,
        currency: body.currency || 'INR',
        key: RAZORPAY_KEY_ID
      }));
      return;
    } catch (error) {
      console.error('Error processing order creation:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create order' }));
      return;
    }
  }
  
  // EmailJS proxy endpoint
  if (req.method === 'POST' && pathname === '/api/send-email') {
    try {
      // Get the body from the client request
      const body = await getRequestBody(req);
      
      console.log('Proxying EmailJS request:', {
        serviceId: body.service_id,
        templateId: body.template_id,
        userId: body.user_id,
      });
      
      // Create options for the HTTPS request to EmailJS
      const options = {
        hostname: EMAILJS_API_URL,
        port: 443,
        path: '/api/v1.0/email/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      // Create a new promise for the HTTPS request
      const emailPromise = new Promise((resolve, reject) => {
        const emailReq = https.request(options, (emailRes) => {
          let data = '';
          
          emailRes.on('data', (chunk) => {
            data += chunk;
          });
          
          emailRes.on('end', () => {
            resolve({
              status: emailRes.statusCode,
              data: data
            });
          });
        });
        
        emailReq.on('error', (error) => {
          console.error('Error sending email via proxy:', error);
          reject(error);
        });
        
        // Write JSON data to request body
        emailReq.write(JSON.stringify(body));
        emailReq.end();
      });
      
      // Wait for the EmailJS response
      const emailResponse = await emailPromise;
      
      // Return the EmailJS response to the client
      res.writeHead(emailResponse.status, { 'Content-Type': 'application/json' });
      res.end(emailResponse.data);
      return;
    } catch (error) {
      console.error('Error in email proxy:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to send email' }));
      return;
    }
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

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n--- No-cache server with Razorpay and EmailJS support starting ---');
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
  console.log(`Local files will not be cached by the browser`);
  console.log(`API endpoints:`);
  console.log(`  - Razorpay: /api/create-razorpay-order`);
  console.log(`  - EmailJS proxy: /api/send-email`);
  console.log(`Press Ctrl+C to stop the server\n`);
});
