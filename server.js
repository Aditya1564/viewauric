// Enhanced no-cache HTTP server with Razorpay API support
// Email functionality completely removed
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');

const PORT = 5000;

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
  
  // Email functionality completely removed
  if (req.method === 'POST' && pathname === '/api/send-email') {
    console.log('Email functionality has been removed');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Email functionality has been removed' }));
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

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n--- No-cache server with Razorpay support starting ---');
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
  console.log(`Local files will not be cached by the browser`);
  console.log(`API endpoints:`);
  console.log(`  - Razorpay: /api/create-razorpay-order`);
  console.log(`Press Ctrl+C to stop the server\n`);
});
