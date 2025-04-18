/**
 * API client for making requests to backend
 * Automatically handles base path differences between dev and prod environments
 */

// In production, all API requests need to be prefixed with '/draft'
const basePath = '/draft';

// Check if we're in production by looking at the current URL path
const isProd = window.location.pathname.startsWith('/draft/');

/**
 * Creates the correct API URL based on the environment
 * @param {string} endpoint - API endpoint (should start with /api)
 * @returns {string} The complete URL
 */
const createApiUrl = (endpoint) => {
  console.log('createApiUrl - isProd:', isProd, 'endpoint:', endpoint);
  if (isProd) {
    // In production, requests should go to /draft/api/...
    // Не обрабатываем случаи, когда /draft/ уже есть в URL
    if (endpoint.startsWith('/draft/')) {
      console.log('URL уже содержит /draft/, оставляем как есть:', endpoint);
      return endpoint;
    }
    // Добавляем /draft/ префикс для всех остальных URL
    const url = `/draft${endpoint}`;
    console.log('Добавлен префикс /draft/:', url);
    return url;
  }
  // In development, requests go to /api/... directly
  return endpoint;
};

/**
 * Fetch wrapper that adds the correct base path
 * @param {string} endpoint - API endpoint (should start with /api)
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Fetch promise
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = createApiUrl(endpoint);
  console.log('API Request to:', url, options);
  return fetch(url, options);
};

/**
 * GET request
 * @param {string} endpoint - API endpoint (should start with /api)
 * @returns {Promise<any>} - JSON response
 */
export const apiGet = async (endpoint) => {
  const response = await apiRequest(endpoint);
  
  if (!response.ok) {
    console.error('API Error:', response.status, endpoint);
    throw new Error(`API error: ${response.status}`);
  }
  
  console.log('API Success:', endpoint);
  return response.json();
};

/**
 * POST request
 * @param {string} endpoint - API endpoint (should start with /api)
 * @param {Object} data - Data to send
 * @returns {Promise<any>} - JSON response
 */
export const apiPost = async (endpoint, data) => {
  const response = await apiRequest(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
};
