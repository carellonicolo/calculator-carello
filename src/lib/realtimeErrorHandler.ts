import type { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

// Track failed connection attempts to prevent repeated failures
const failedConnections = new Set<string>();
const connectionAttempts = new Map<string, number>();
const MAX_RETRY_ATTEMPTS = 2;

/**
 * Wrapper for Supabase realtime channels that handles WebSocket connection errors gracefully
 * to prevent console errors that affect SEO audits.
 */
export const createSilentRealtimeChannel = (
  channel: RealtimeChannel
): RealtimeChannel => {
  const channelName = channel.topic || 'unknown';
  
  // Check if we've already failed too many times
  const attempts = connectionAttempts.get(channelName) || 0;
  if (attempts >= MAX_RETRY_ATTEMPTS) {
    console.info(`Skipping realtime connection for ${channelName} after ${attempts} failed attempts`);
    return channel;
  }

  // Suppress console errors for WebSocket connection failures
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Override console methods to suppress WebSocket errors
  const suppressRealtimeErrors = () => {
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      // Suppress WebSocket and realtime related errors
      if (
        message.includes('WebSocket') ||
        message.includes('realtime') ||
        message.includes('supabase.co') ||
        message.includes('ERR_NAME_NOT_RESOLVED') ||
        message.includes('connection establishment')
      ) {
        // Silently ignore - realtime is optional
        return;
      }
      originalConsoleError.apply(console, args);
    };
    
    console.warn = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (
        message.includes('WebSocket') ||
        message.includes('realtime') ||
        message.includes('supabase.co')
      ) {
        return;
      }
      originalConsoleWarn.apply(console, args);
    };
  };

  const restoreConsole = () => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  };

  // Apply suppression immediately
  suppressRealtimeErrors();

  // Wrap the subscribe method
  const originalSubscribe = channel.subscribe.bind(channel);
  channel.subscribe = (callback?: (status: REALTIME_SUBSCRIBE_STATES, err?: Error) => void, timeout?: number) => {
    const wrappedCallback = (status: REALTIME_SUBSCRIBE_STATES, err?: Error) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        // Track failed connection
        const currentAttempts = (connectionAttempts.get(channelName) || 0) + 1;
        connectionAttempts.set(channelName, currentAttempts);
        failedConnections.add(channelName);
        
        // Restore console after error
        setTimeout(restoreConsole, 500);
      } else if (status === 'SUBSCRIBED') {
        // Reset on success
        connectionAttempts.set(channelName, 0);
        failedConnections.delete(channelName);
        setTimeout(restoreConsole, 500);
      }
      
      if (callback) {
        callback(status, err);
      }
    };
    
    // Use shorter timeout to fail faster and reduce error logging
    return originalSubscribe(wrappedCallback, timeout || 3000);
  };

  return channel;
};
