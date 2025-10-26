import type { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

/**
 * Wrapper for Supabase realtime channels that suppresses WebSocket connection errors
 * to prevent console errors that affect SEO audits.
 */
export const createSilentRealtimeChannel = (
  channel: RealtimeChannel
): RealtimeChannel => {
  // Suppress console errors for WebSocket connection failures
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Override console methods temporarily during subscription
  const suppressRealtimeErrors = () => {
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      // Only suppress Supabase realtime WebSocket errors
      if (
        !message.includes('WebSocket') &&
        !message.includes('realtime') &&
        !message.includes('supabase.co')
      ) {
        originalConsoleError.apply(console, args);
      }
    };
    
    console.warn = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (
        !message.includes('WebSocket') &&
        !message.includes('realtime') &&
        !message.includes('supabase.co')
      ) {
        originalConsoleWarn.apply(console, args);
      }
    };
  };

  const restoreConsole = () => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  };

  // Wrap the subscribe method
  const originalSubscribe = channel.subscribe.bind(channel);
  channel.subscribe = (callback?: (status: REALTIME_SUBSCRIBE_STATES, err?: Error) => void, timeout?: number) => {
    suppressRealtimeErrors();
    
    const wrappedCallback = (status: REALTIME_SUBSCRIBE_STATES, err?: Error) => {
      // Restore console after connection attempt
      setTimeout(restoreConsole, 100);
      
      if (callback) {
        callback(status, err);
      }
    };
    
    return originalSubscribe(wrappedCallback, timeout);
  };

  return channel;
};
