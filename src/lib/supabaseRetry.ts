/**
 * ============================================================================
 * supabaseRetry.ts - Utility per operazioni Supabase robuste
 * ============================================================================
 * 
 * Fornisce funzioni di utilità per eseguire operazioni Supabase con:
 * - Retry automatico con backoff esponenziale
 * - Timeout configurabile per evitare richieste bloccate
 * - Gestione intelligente degli errori di rete
 * 
 * QUANDO USARE:
 * - Operazioni critiche che non devono fallire silenziosamente
 * - Chiamate in ambienti con connettività instabile
 * - Login e operazioni di autenticazione
 * 
 * @example
 * ```typescript
 * // Retry automatico per query importante
 * const result = await withRetry(
 *   () => supabase.from('users').select('*'),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * ```
 * 
 * @author Prof. Nicolò Carello
 * ============================================================================
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Opzioni configurabili per il comportamento di retry
 */
interface RetryOptions {
  /** Numero massimo di tentativi (default: 3) */
  maxRetries?: number;
  /** Delay iniziale tra tentativi in ms (default: 1000) */
  initialDelay?: number;
  /** Delay massimo tra tentativi in ms (default: 10000) */
  maxDelay?: number;
  /** Moltiplicatore per backoff esponenziale (default: 2) */
  backoffMultiplier?: number;
  /** Timeout per singola richiesta in ms (default: 30000) */
  timeoutMs?: number;
}

/**
 * Valori di default per le opzioni di retry
 * Bilanciati per la maggior parte dei casi d'uso
 */
const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  timeoutMs: 30000,
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Esegue una funzione con logica di retry e backoff esponenziale
 * 
 * FUNZIONAMENTO:
 * 1. Esegue la funzione con timeout
 * 2. Se fallisce per errore di rete, aspetta e riprova
 * 3. Il delay aumenta esponenzialmente fino a maxDelay
 * 4. Per errori non-rete, fallisce immediatamente
 * 
 * @template T - Tipo del valore di ritorno
 * @param fn - Funzione async da eseguire
 * @param options - Opzioni di configurazione
 * @returns Promise con il risultato della funzione
 * @throws Ultimo errore se tutti i tentativi falliscono
 * 
 * @example
 * ```typescript
 * const data = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxRetries: 5, initialDelay: 500 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // Merge opzioni custom con default
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  let lastError: Error | null = null;
  let delay = opts.initialDelay;

  // Loop di tentativi
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Crea promise di timeout per evitare richieste bloccate
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), opts.timeoutMs)
      );

      // Race tra funzione originale e timeout
      const result = await Promise.race([fn(), timeoutPromise]);
      
      // Log successo dopo retry (utile per debug)
      if (attempt > 0) {
        console.log(`✓ Operazione riuscita dopo ${attempt} tentativi`);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Se non è l'ultimo tentativo, valuta se riprovare
      if (attempt < opts.maxRetries) {
        // Identifica errori di rete che meritano retry
        const isNetworkError = 
          error instanceof TypeError && error.message.includes('fetch') ||
          (error as Error)?.message?.includes('NetworkError') ||
          (error as Error)?.message?.includes('timeout') ||
          (error as Error)?.message?.includes('ERR_NAME_NOT_RESOLVED');

        if (isNetworkError) {
          console.warn(
            `⚠ Errore di rete al tentativo ${attempt + 1}/${opts.maxRetries + 1}, ` +
            `riprovo tra ${delay}ms...`
          );
          
          // Attende con delay crescente
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Calcola prossimo delay con backoff esponenziale
          delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
        } else {
          // Errore non di rete: non riprovare, fallisci subito
          throw error;
        }
      }
    }
  }

  // Tutti i tentativi esauriti
  console.error(`✗ Operazione fallita dopo ${opts.maxRetries} tentativi`);
  throw lastError || new Error('Operazione fallita');
}

/**
 * Wrapper specifico per query Supabase con retry automatico
 * 
 * Semplifica l'uso di withRetry per il pattern comune di Supabase
 * dove le query restituiscono { data, error }
 * 
 * @template T - Tipo dei dati restituiti
 * @param queryFn - Funzione che esegue la query Supabase
 * @param options - Opzioni di retry
 * @returns Promise con { data, error } pattern di Supabase
 * 
 * @example
 * ```typescript
 * const { data, error } = await supabaseQuery(
 *   () => supabase.from('users').select('*'),
 *   { maxRetries: 2 }
 * );
 * ```
 */
export async function supabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>,
  options?: RetryOptions
): Promise<{ data: T | null; error: unknown }> {
  return withRetry(queryFn, options);
}
