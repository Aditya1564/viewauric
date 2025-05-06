// This file is kept for compatibility purposes only
// All email functionality has been completely removed

const http = require('http');
const url = require('url');

const PORT = 5001;

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
  // Add CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight CORS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Parse the URL to extract the path
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Handle the email sending endpoint with a notification that functionality is removed
  if (req.method === 'POST' && pathname === '/api/send-email') {
    try {
      // Get the body from the client request
      const body = await getRequestBody(req);
      
      console.log('Received email request, but email functionality has been removed');
      
      // Return a success response to not break the application flow
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Email functionality has been removed from the application',
        status: 'success'
      }));
      
    } catch (error) {
      console.error('Error processing request:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Failed to process request',
        message: error.message
      }));
    }
    return;
  }
  
  // Return 404 for any other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// This server is kept for compatibility but it's no longer needed
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Email functionality has been completely removed`);
  console.log(`Placeholder server running at http://0.0.0.0:${PORT}/`);
});