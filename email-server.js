// Simple server that forwards email requests to EmailJS
const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 5001;
const EMAILJS_API_URL = 'api.emailjs.com';

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
  
  // Handle the email sending endpoint
  if (req.method === 'POST' && pathname === '/api/send-email') {
    try {
      // Get the body from the client request
      const body = await getRequestBody(req);
      
      console.log('Received email request:', {
        serviceId: body.service_id,
        templateId: body.template_id,
        recipient: body.template_params?.to_email || 'no recipient specified'
      });
      
      // Create the proper EmailJS request payload
      const emailJSPayload = {
        service_id: body.service_id,
        template_id: body.template_id,
        user_id: body.user_id,
        template_params: body.template_params
      };
      
      // Create options for the HTTPS request to EmailJS
      const options = {
        hostname: EMAILJS_API_URL,
        port: 443,
        path: '/api/v1.0/email/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://yourdomain.com' // Replace with your actual domain
        }
      };
      
      console.log('Making request to EmailJS API...');
      
      // Create a new promise for the HTTPS request
      const emailPromise = new Promise((resolve, reject) => {
        const emailReq = https.request(options, (emailRes) => {
          console.log('Response status code:', emailRes.statusCode);
          
          let data = '';
          
          emailRes.on('data', (chunk) => {
            data += chunk;
          });
          
          emailRes.on('end', () => {
            console.log('EmailJS response:', data);
            resolve({
              status: emailRes.statusCode,
              data: data
            });
          });
        });
        
        emailReq.on('error', (error) => {
          console.error('Error sending email:', error);
          reject(error);
        });
        
        // Write JSON data to request body
        const jsonPayload = JSON.stringify(emailJSPayload);
        emailReq.write(jsonPayload);
        emailReq.end();
      });
      
      // Wait for the EmailJS response
      const emailResponse = await emailPromise;
      
      // Return the EmailJS response to the client
      res.writeHead(emailResponse.status, { 'Content-Type': 'application/json' });
      res.end(emailResponse.data || JSON.stringify({ message: 'Email sent successfully' }));
      
    } catch (error) {
      console.error('Error in email proxy:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Failed to send email',
        message: error.message
      }));
    }
    return;
  }
  
  // Return 404 for any other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Email proxy server running at http://0.0.0.0:${PORT}/`);
  console.log(`Endpoint: /api/send-email`);
});