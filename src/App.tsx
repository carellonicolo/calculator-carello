import { lazy, Suspense, type ComponentType } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/ui/AppShell';
import { ToastProvider } from './components/ui/Toast';
import { AppStateProvider, useAppState } from './hooks/useAppState';
import { CalculatorPage } from './components/screens/CalculatorPage';
import {
  ErrorScreen,
  LoadingScreen,
  NotActiveScreen,
  PendingScreen,
} from './components/screens/GateScreens';

/**
 * `lazy()` resiliente al version skew: se un chunk non si carica (tipico dopo
 * un deploy), ricarica la pagina una sola volta invece di mostrare un errore.
 */
function lazyWithReload(factory: () => Promise<{ default: ComponentType }>) {
  return lazy(() =>
    factory().catch((err: unknown) => {
      const key = 'chunkReloadAt';
      const last = Number(sessionStorage.getItem(key) || '0');
      if (Date.now() - last > 10000) {
        sessionStorage.setItem(key, String(Date.now()));
        window.location.reload();
        return new Promise<{ default: ComponentType }>(() => {});
      }
      throw err;
    })
  );
}

const AdminPage = lazyWithReload(() =>
  import('./components/screens/AdminPage').then((m) => ({ default: m.AdminPage }))
);

/** Gate dell'app: tutta la calcolatrice è riservata agli utenti SSO. */
function Gated() {
  const { gate, gateMessage, retry } = useAppState();
  if (gate === 'loading' || gate === 'unauthenticated') return <LoadingScreen />;
  if (gate === 'pending') return <PendingScreen message={gateMessage} />;
  if (gate === 'not_active') return <NotActiveScreen message={gateMessage} />;
  if (gate === 'error') return <ErrorScreen message={gateMessage} onRetry={retry} />;
  return <CalculatorPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppShell>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route
                path="/"
                element={
                  <AppStateProvider>
                    <Gated />
                  </AppStateProvider>
                }
              />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppShell>
      </ToastProvider>
    </BrowserRouter>
  );
}
