/**
 * Netlify Function: Health Check
 * 
 * A simple health check endpoint to verify that Netlify Functions are working properly
 * Handles GET requests to /.netlify/functions/health
 */

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*', // Or restrict to your domains
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204, // No content
      headers
    };
  }
  
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed'
      })
    };
  }
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: 'Netlify Functions',
      emailConfig: {
        service: process.env.EMAIL_SERVICE || 'Not set',
        user: process.env.EMAIL_USER ? 'Set' : 'Not set',
        pass: process.env.EMAIL_PASS ? 'Set' : 'Not set'
      },
      razorpayConfig: {
        key_id: process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not set',
        key_secret: process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Not set'
      }
    })
  };
};