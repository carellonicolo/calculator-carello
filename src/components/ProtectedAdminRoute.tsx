/**
 * ============================================================================
 * ProtectedAdminRoute.tsx
 * ============================================================================
 * 
 * Higher-Order Component (HOC) per proteggere le route che richiedono
 * autenticazione e ruolo admin.
 * 
 * SICUREZZA:
 * - Questo componente fornisce protezione lato client
 * - La vera sicurezza è garantita dalle RLS policies del database
 * - Le API rifiuteranno comunque richieste non autorizzate
 * 
 * COMPORTAMENTO:
 * 1. Durante il loading: mostra spinner
 * 2. Se non admin: mostra messaggio di accesso negato
 * 3. Se admin: renderizza i children
 * 
 * @author Prof. Nicolò Carello
 * ============================================================================
 */

import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ProtectedAdminRouteProps {
  /** Contenuto da renderizzare se l'utente è admin */
  children: ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Wrapper component che protegge le route admin
 * 
 * @param children - Componenti figli da renderizzare se autorizzato
 * 
 * @example
 * ```tsx
 * <Route
 *   path="/admin"
 *   element={
 *     <ProtectedAdminRoute>
 *       <AdminDashboard />
 *     </ProtectedAdminRoute>
 *   }
 * />
 * ```
 */
export const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  // Hook per verificare ruolo utente
  const { isAdmin, loading } = useUserRole();
  const navigate = useNavigate();

  // -------------------------------------------------------------------------
  // LOADING STATE
  // -------------------------------------------------------------------------
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(var(--admin-bg))]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifica dei permessi...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // ACCESS DENIED STATE
  // -------------------------------------------------------------------------
  
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(var(--admin-bg))] p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            {/* Icona di accesso negato */}
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Accesso Negato</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Non hai i permessi necessari per accedere all'area amministrativa.
            </p>
            
            {/* Azioni disponibili per l'utente */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate('/')}
              >
                Torna alla Calcolatrice
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate('/login')}
              >
                Cambia Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // AUTHORIZED: Render children
  // -------------------------------------------------------------------------
  
  return <>{children}</>;
};
