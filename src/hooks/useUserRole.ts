import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { withRetry } from '@/lib/supabaseRetry';

type UserRole = 'admin' | 'user' | null;

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        console.log('🔍 Checking user role...');
        
        const sessionResult = await withRetry(
          async () => supabase.auth.getSession(),
          { maxRetries: 2, initialDelay: 500 }
        );
        
        if (!sessionResult?.data?.session?.user) {
          console.log('ℹ No active session');
          setRole(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        console.log('✓ Session found, checking admin status...');

        // Chiamare la funzione is_admin() del database con retry
        const adminResult = await withRetry(
          async () => supabase.rpc('is_admin'),
          { maxRetries: 3, initialDelay: 1000 }
        );

        if (adminResult.error) {
          console.error('❌ Error checking admin status:', adminResult.error);
          setRole('user');
          setIsAdmin(false);
        } else {
          const userIsAdmin = adminResult.data === true;
          console.log(userIsAdmin ? '✓ User is admin' : 'ℹ User is not admin');
          setRole(userIsAdmin ? 'admin' : 'user');
          setIsAdmin(userIsAdmin);
        }
      } catch (err) {
        console.error('❌ Exception checking role:', err);
        setRole('user');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();

    // Ricontrollare il ruolo quando cambia l'auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserRole();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { role, isAdmin, loading };
};
