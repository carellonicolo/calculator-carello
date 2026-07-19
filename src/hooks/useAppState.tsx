/**
 * Stato globale dell'app: identità SSO + configurazione live.
 *
 * Bootstrap con una sola chiamata (/api/student/state), poi polling leggero
 * di /api/student/config ogni POLL_MS: le modifiche del docente arrivano
 * "live" alle calcolatrici aperte. Il docente non fa polling (config piena).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { apiStudentConfig, apiStudentState, type AppUser } from '../lib/api';
import { redirectToLogin } from '../lib/auth';
import { DEFAULT_CONFIG, sanitizeConfig, type CalcConfig } from '../lib/config';

const POLL_MS = 10_000;

export type GateState =
  | 'loading'
  | 'ready'
  | 'unauthenticated' // redirect al login in corso
  | 'pending' // account senza classe approvata
  | 'not_active' // account sospeso
  | 'error';

interface AppState {
  gate: GateState;
  user: AppUser | null;
  config: CalcConfig;
  /** Messaggio del gate (es. testo "in attesa di approvazione"). */
  gateMessage: string | null;
  /** Cambia quando il docente aggiorna la config (per toast/animazioni). */
  configVersion: number;
  retry: () => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [gate, setGate] = useState<GateState>('loading');
  const [user, setUser] = useState<AppUser | null>(null);
  const [config, setConfig] = useState<CalcConfig>(DEFAULT_CONFIG);
  const [gateMessage, setGateMessage] = useState<string | null>(null);
  const [configVersion, setConfigVersion] = useState(0);

  const sidRef = useRef<string | null>(null);
  const stampRef = useRef<string>('');
  const mounted = useRef(true);

  const bootstrap = useCallback(async () => {
    setGate('loading');
    const res = await apiStudentState();
    if (!mounted.current) return;

    if (res.ok && res.data) {
      setUser(res.data.user);
      setConfig(sanitizeConfig(res.data.config));
      sidRef.current = res.data.session;
      stampRef.current = res.data.stamp;
      setGate('ready');
      return;
    }
    if (res.status === 401) {
      setGate('unauthenticated');
      redirectToLogin();
      return;
    }
    if (res.status === 403) {
      setGate(res.code === 'not_active' ? 'not_active' : 'pending');
      setGateMessage(res.error ?? null);
      return;
    }
    setGate('error');
    setGateMessage(res.error ?? 'Errore di rete');
  }, []);

  useEffect(() => {
    mounted.current = true;
    void bootstrap();
    return () => {
      mounted.current = false;
    };
  }, [bootstrap]);

  // Polling della configurazione (solo studenti con sessione aperta).
  useEffect(() => {
    if (gate !== 'ready' || !sidRef.current) return;

    const tick = async () => {
      const sid = sidRef.current;
      if (!sid || document.hidden) return;
      const res = await apiStudentConfig(sid);
      if (!mounted.current) return;
      if (res.ok && res.data) {
        if (res.data.stamp !== stampRef.current) {
          stampRef.current = res.data.stamp;
          setConfig(sanitizeConfig(res.data.config));
          setConfigVersion((v) => v + 1);
        }
        return;
      }
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (res.code === 'session_lost') {
        // Sessione ripulita lato server: riapri lo stato.
        void bootstrap();
      }
      // Errori di rete transitori: si riprova al prossimo giro.
    };

    const id = window.setInterval(() => void tick(), POLL_MS);
    return () => window.clearInterval(id);
  }, [gate, bootstrap]);

  const retry = useCallback(() => void bootstrap(), [bootstrap]);

  const value = useMemo<AppState>(
    () => ({ gate, user, config, gateMessage, configVersion, retry }),
    [gate, user, config, gateMessage, configVersion, retry]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState deve essere usato dentro <AppStateProvider>.');
  return ctx;
}
