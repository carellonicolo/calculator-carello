/**
 * ============================================================================
 * useUserRole.ts
 * ============================================================================
 * 
 * Hook React per determinare il ruolo dell'utente autenticato.
 * Verifica se l'utente è admin attraverso la funzione database is_admin().
 * 
 * SICUREZZA:
 * - La funzione is_admin() è definita come SECURITY DEFINER nel database
 * - Le RLS policies usano questa funzione per proteggere le tabelle
 * - Questo hook fornisce info lato client per UX, non per sicurezza
 * 
 * UTILIZZO:
 * ```tsx
 * const { isAdmin, loading, role } = useUserRole();
 * if (loading) return <Spinner />;
 * if (isAdmin) return <AdminDashboard />;
 * ```
 * 
 * @author Prof. Nicolò Carello
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { withRetry } from '@/lib/supabaseRetry';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Ruolo possibile dell'utente */
type UserRole = 'admin' | 'user' | null;

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook per verificare il ruolo dell'utente corrente
 * 
 * @returns Oggetto con role, isAdmin flag e loading state
 * 
 * @example
 * ```tsx
 * const { isAdmin, loading } = useUserRole();
 * 
 * if (loading) return <LoadingSpinner />;
 * if (!isAdmin) return <AccessDenied />;
 * return <AdminPanel />;
 * ```
 */
export const useUserRole = () => {
  // -------------------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------------------
  
  /** Ruolo corrente dell'utente */
  const [role, setRole] = useState<UserRole>(null);
  
  /** Flag per UI: indica se stiamo verificando */
  const [loading, setLoading] = useState(true);
  
  /** Flag convenienza: true se l'utente è admin */
  const [isAdmin, setIsAdmin] = useState(false);

  // -------------------------------------------------------------------------
  // EFFECT: Verifica ruolo al mount e su cambi auth
  // -------------------------------------------------------------------------
  
  useEffect(() => {
    /**
     * Verifica il ruolo dell'utente corrente
     * 1. Controlla se esiste una sessione attiva
     * 2. Se sì, chiama la funzione is_admin() del database
     * 3. Aggiorna lo stato in base al risultato
     */
    const checkUserRole = async () => {
      try {
        console.log('🔍 Verifica ruolo utente...');
        
        // Step 1: Verifica sessione con retry
        const sessionResult = await withRetry(
          async () => supabaseClient.auth.getSession(),
          { maxRetries: 2, initialDelay: 500 }
        );
        
        // Nessuna sessione attiva = utente non autenticato
        if (!sessionResult?.data?.session?.user) {
          console.log('ℹ Nessuna sessione attiva');
          setRole(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        console.log('✓ Sessione trovata, verifico status admin...');

        // Step 2: Verifica ruolo admin con retry
        // La funzione is_admin() è SECURITY DEFINER nel database
        const adminResult = await withRetry(
          async () => supabaseClient.rpc('is_admin'),
          { maxRetries: 3, initialDelay: 1000 }
        );

        // Gestione risultato
        if (adminResult.error) {
          console.error('❌ Errore verifica admin:', adminResult.error);
          // In caso di errore, assume non-admin per sicurezza
          setRole('user');
          setIsAdmin(false);
        } else {
          const userIsAdmin = adminResult.data === true;
          console.log(userIsAdmin ? '✓ Utente è admin' : 'ℹ Utente non è admin');
          setRole(userIsAdmin ? 'admin' : 'user');
          setIsAdmin(userIsAdmin);
        }
      } catch (err) {
        console.error('❌ Eccezione durante verifica ruolo:', err);
        // Fallback sicuro: assume non-admin
        setRole('user');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    // Esegui verifica iniziale
    checkUserRole();

    // Sottoscrivi a cambiamenti auth state
    // Riesegue la verifica quando l'utente fa login/logout
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(() => {
      checkUserRole();
    });

    // Cleanup: rimuovi sottoscrizione
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // -------------------------------------------------------------------------
  // RETURN
  // -------------------------------------------------------------------------
  
  return { 
    /** Ruolo corrente: 'admin', 'user', o null se non autenticato */
    role, 
    /** true se l'utente ha ruolo admin */
    isAdmin, 
    /** true durante la verifica iniziale */
    loading 
  };
};
