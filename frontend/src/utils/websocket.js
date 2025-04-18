/**
 * WebSocket client for connecting to backend
 * Automatically handles path and protocol differences between dev and prod environments
 */

// Check if we're in production by looking at the current URL path
const isProd = window.location.pathname.startsWith('/draft/');

/**
 * Creates a WebSocket connection that works in both development and production
 * @returns {WebSocket} Connected WebSocket instance
 */
export const createWebSocketConnection = () => {
  let wsUrl;
  
  if (isProd) {
    // In production:
    // 1. Use wss:// protocol (secure WebSocket)
    // 2. Use the current domain (window.location.host)
    // 3. Make sure to route to the WebSocket endpoint directly on the host IP
    // We're connecting to the main nginx proxy which forwards to the WebSocket server
    wsUrl = `wss://${window.location.host}/draft/ws`;
  } else {
    // In development, connect directly to the local WebSocket server
    wsUrl = 'ws://localhost:3002';
  }
  
  return new WebSocket(wsUrl);
};
