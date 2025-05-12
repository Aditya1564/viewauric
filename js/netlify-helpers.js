/**
 * Netlify Functions Helper
 * 
 * This file provides utility functions for working with Netlify Functions
 * in both local development and production environments.
 */

// Determine if we're running in production (Netlify) or development (localhost)
const isProduction = !window.location.hostname.includes('localhost') && 
                     !window.location.hostname.includes('127.0.0.1');

/**
 * Get the base URL for API requests to Netlify Functions
 * @returns {string} The base URL to use for API requests
 */
function getApiBaseUrl() {
  // In production, Netlify Functions are accessed at /.netlify/functions/
  // In development, we use the redirects from netlify.toml to map /api/ to /.netlify/functions/
  return isProduction ? '/.netlify/functions' : '/api';
}

/**
 * Make an API request to a Netlify Function
 * 
 * @param {string} endpoint - The function name/endpoint (without leading slash)
 * @param {Object} options - Fetch API options (method, headers, body, etc.)
 * @returns {Promise<Object>} - Promise resolving to the JSON response
 */
async function callNetlifyFunction(endpoint, options = {}) {
  // Ensure we have default headers
  if (!options.headers) {
    options.headers = {};
  }
  
  // Add Content-Type header for JSON if not specified and we have a body
  if (options.body && !options.headers['Content-Type']) {
    options.headers['Content-Type'] = 'application/json';
  }
  
  // Create the URL
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/${endpoint}`;
  
  try {
    console.log(`Calling Netlify Function: ${url}`);
    const response = await fetch(url, options);
    
    // Parse the JSON response
    const data = await response.json();
    
    // If response is not ok, throw an error
    if (!response.ok) {
      throw new Error(data.message || `API error: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error calling Netlify Function ${endpoint}:`, error);
    throw error;
  }
}

// Export the helper functions
window.netlifyHelpers = {
  getApiBaseUrl,
  callNetlifyFunction,
  isProduction
};