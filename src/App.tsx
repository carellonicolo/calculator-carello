/**
 * ============================================================================
 * App.tsx - Entry Point dell'Applicazione
 * ============================================================================
 * 
 * Componente root che configura i provider globali e il routing.
 * 
 * ARCHITETTURA:
 * - ErrorBoundary: cattura errori React e mostra fallback UI
 * - QueryClientProvider: gestisce cache e fetch dati con TanStack Query
 * - TooltipProvider: abilita tooltip accessibili in tutta l'app
 * - Toaster: sistema di notifiche toast
 * - BrowserRouter: routing client-side
 * 
 * OTTIMIZZAZIONI:
 * - Lazy loading per pagine non critiche (Index, NotFound)
 * - Eager loading per pagine auth (Login, Admin) per UX migliore
 * - QueryClient configurato con staleTime ottimizzato
 * 
 * @author Prof. Nicolò Carello
 * ============================================================================
 */

import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// ============================================================================
// IMPORTS: Pagine
// ============================================================================

/**
 * Eager load: pagine critiche per l'autenticazione
 * Caricate subito per evitare ritardi durante il login
 */
import Login from "./pages/Login";
import Admin from "./pages/Admin";

/**
 * Lazy load: pagine non critiche
 * Caricate on-demand per ridurre bundle iniziale
 */
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TestErrorBoundary = lazy(() => import("./pages/TestErrorBoundary"));

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Loader mostrato durante il caricamento delle pagine lazy
 * Design coerente con il resto dell'applicazione
 */
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-muted-foreground">Caricamento...</p>
    </div>
  </div>
);

// ============================================================================
// QUERY CLIENT CONFIGURATION
// ============================================================================

/**
 * Configurazione ottimizzata per TanStack Query
 * 
 * staleTime: 5 minuti - i dati sono considerati freschi per 5 min
 * gcTime: 10 minuti - cache mantenuta per 10 min dopo ultimo uso
 * retry: 3 - riprova 3 volte in caso di errore
 * refetchOnWindowFocus: false - evita refetch inutili
 * refetchOnReconnect: true - aggiorna dati dopo riconnessione
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minuti
      gcTime: 10 * 60 * 1000,   // 10 minuti (ex cacheTime)
      retry: 3,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

/**
 * Componente App principale
 * 
 * Struttura nidificata dei provider:
 * 1. ErrorBoundary - cattura errori critici
 * 2. QueryClientProvider - data fetching
 * 3. TooltipProvider - tooltip accessibili
 * 4. Toasters - notifiche
 * 5. BrowserRouter - routing
 */
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Sistema di notifiche toast (due varianti per flessibilità) */}
        <Toaster />
        <Sonner />
        
        <BrowserRouter>
          {/* Suspense per lazy loading con fallback loader */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Route pubblica: Home con calcolatrice */}
              <Route path="/" element={<Index />} />
              
              {/* Route pubblica: Login amministratore */}
              <Route path="/login" element={<Login />} />
              
              {/* Route protetta: Dashboard admin (richiede auth + ruolo admin) */}
              <Route
                path="/admin"
                element={
                  <ProtectedAdminRoute>
                    <Admin />
                  </ProtectedAdminRoute>
                }
              />
              
              {/* Route di test per ErrorBoundary - solo in development */}
              {import.meta.env.DEV && (
                <Route path="/test-error" element={<TestErrorBoundary />} />
              )}
              
              {/* Catch-all per pagine non trovate (deve essere ultima) */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
