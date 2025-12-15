/**
 * @fileoverview Custom Supabase client wrapper with Realtime disabled
 * 
 * This module provides a Supabase client instance with the Realtime WebSocket
 * feature disabled to prevent console errors in environments where WebSocket
 * connections may fail (e.g., during Lighthouse audits or in restricted networks).
 * 
 * The application uses polling-based data synchronization instead of Realtime,
 * making this configuration safe and appropriate.
 * 
 * @module supabaseClient
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Environment variables for Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Custom Supabase client with Realtime disabled
 * 
 * This client is configured identically to the auto-generated client,
 * but with the Realtime WebSocket feature explicitly disabled to prevent
 * connection attempts that may fail and cause console errors.
 * 
 * Use this client throughout the application:
 * @example
 * import { supabaseClient } from "@/lib/supabaseClient";
 * 
 * const { data } = await supabaseClient.from('table').select('*');
 */
export const supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 0, // Disable realtime events
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web/2.75.0',
    },
  },
});

// Immediately remove all realtime channels to prevent any connection attempts
supabaseClient.removeAllChannels();
