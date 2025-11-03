/**
 * Realtime health check to prevent WebSocket connection attempts
 * when Supabase Realtime is unavailable
 */

let realtimeAvailable: boolean | null = null;
let checkPromise: Promise<boolean> | null = null;

/**
 * Check if Supabase Realtime is available
 * This prevents browser-level WebSocket errors that impact SEO
 */
export const isRealtimeAvailable = async (): Promise<boolean> => {
  // Return cached result if available
  if (realtimeAvailable !== null) {
    return realtimeAvailable;
  }

  // Return existing promise if check is in progress
  if (checkPromise) {
    return checkPromise;
  }

  // Start new check
  checkPromise = (async () => {
    try {
      // Try to fetch from Supabase REST API (no WebSocket)
      // This is a lightweight check that doesn't trigger WebSocket errors
      const projectRef = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0];
      
      if (!projectRef) {
        realtimeAvailable = false;
        return false;
      }

      // Use a simple fetch with short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      try {
        const response = await fetch(import.meta.env.VITE_SUPABASE_URL + '/rest/v1/', {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
          }
        });
        
        clearTimeout(timeoutId);
        realtimeAvailable = response.ok || response.status === 404; // 404 is ok, means server is reachable
        return realtimeAvailable;
      } catch (err) {
        clearTimeout(timeoutId);
        realtimeAvailable = false;
        return false;
      }
    } catch (err) {
      realtimeAvailable = false;
      return false;
    } finally {
      checkPromise = null;
    }
  })();

  return checkPromise;
}

/**
 * Reset the health check (useful for testing)
 */
export const resetHealthCheck = () => {
  realtimeAvailable = null;
  checkPromise = null;
};
