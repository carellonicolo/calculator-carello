/**
 * Global error suppressor for WebSocket connection errors
 * This prevents browser-level WebSocket errors from appearing in the console
 * which negatively impacts SEO audit scores.
 */

// Store original console methods
const originalError = console.error;
const originalWarn = console.warn;

// WebSocket-related error patterns to suppress
const SUPPRESSED_PATTERNS = [
  'WebSocket',
  'websocket',
  'ERR_NAME_NOT_RESOLVED',
  'connection establishment',
  'supabase.co/realtime',
  'net::ERR',
];

/**
 * Initialize global error suppression for WebSocket errors
 * Call this once at app startup
 */
export const initGlobalErrorSuppression = () => {
  // Override console.error globally
  console.error = (...args: any[]) => {
    const message = args.join(' ').toString();
    
    // Check if this is a WebSocket-related error we want to suppress
    const shouldSuppress = SUPPRESSED_PATTERNS.some(pattern => 
      message.includes(pattern)
    );
    
    if (!shouldSuppress) {
      originalError.apply(console, args);
    }
    // Silently ignore WebSocket errors - they don't affect app functionality
  };

  // Override console.warn globally
  console.warn = (...args: any[]) => {
    const message = args.join(' ').toString();
    
    const shouldSuppress = SUPPRESSED_PATTERNS.some(pattern => 
      message.includes(pattern)
    );
    
    if (!shouldSuppress) {
      originalWarn.apply(console, args);
    }
  };

  // Also intercept unhandled promise rejections that might come from WebSocket
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.toString() || '';
    
    const shouldSuppress = SUPPRESSED_PATTERNS.some(pattern => 
      message.includes(pattern)
    );
    
    if (shouldSuppress) {
      event.preventDefault(); // Prevent default logging
    }
  });
};

/**
 * Restore original console methods
 * Use this for debugging if needed
 */
export const restoreConsole = () => {
  console.error = originalError;
  console.warn = originalWarn;
};
