/**
 * Utility functions for robust Supabase operations with retry logic
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  timeoutMs?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  timeoutMs: 30000,
};

/**
 * Executes a function with exponential backoff retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), opts.timeoutMs)
      );

      const result = await Promise.race([fn(), timeoutPromise]);
      
      // If successful, return the result
      if (attempt > 0) {
        console.log(`✓ Succeeded after ${attempt} retries`);
      }
      return result;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < opts.maxRetries) {
        const isNetworkError = 
          error instanceof TypeError && error.message.includes('fetch') ||
          (error as any)?.message?.includes('NetworkError') ||
          (error as any)?.message?.includes('timeout');

        if (isNetworkError) {
          console.warn(`⚠ Network error on attempt ${attempt + 1}/${opts.maxRetries + 1}, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
        } else {
          // Non-network error, don't retry
          throw error;
        }
      }
    }
  }

  console.error(`✗ Failed after ${opts.maxRetries} retries`);
  throw lastError || new Error('Operation failed');
}

/**
 * Wrapper for Supabase queries with automatic retry
 */
export async function supabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options?: RetryOptions
): Promise<{ data: T | null; error: any }> {
  return withRetry(queryFn, options);
}
