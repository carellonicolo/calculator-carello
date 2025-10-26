import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'user' | null;

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setRole(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Chiamare la funzione is_admin() del database
        const { data, error } = await supabase.rpc('is_admin');

        if (error) {
          console.error('Error checking admin status:', error);
          setRole('user');
          setIsAdmin(false);
        } else {
          const userIsAdmin = data === true;
          setRole(userIsAdmin ? 'admin' : 'user');
          setIsAdmin(userIsAdmin);
        }
      } catch (err) {
        console.error('Exception checking role:', err);
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
