/**
 * Cronologia unica per utente, condivisa tra le modalità:
 *  - 'calc'  → calcoli Standard/Scientifica (= )
 *  - 'prog'  → operazioni del Programmatore (= e NOT)
 *  - 'graph' → funzioni salvate nei Grafici (Invio o segnalibro)
 *
 * Un clic su una voce riporta alla SUA modalità e la ricarica.
 * Quando il docente disattiva la cronologia: pannello nascosto e storage
 * svuotato (gestito qui). Persistenza in localStorage, max 50 voci.
 */

import { useCallback, useEffect, useState } from 'react';

export type HistoryMode = 'calc' | 'prog' | 'graph';

export interface HistoryEntry {
  mode: HistoryMode;
  /** Testo dell'operazione come mostrato (es. "2+2", "0xF0 AND 0x0F", "y = sin(x)"). */
  expr: string;
  /** Risultato mostrato (per i grafici: l'intervallo x). */
  result: string;
  at: number;
  /** Valore numerico decimale, per il richiamo (calc: float, prog: intero). */
  value?: string;
  /** Dati di richiamo per i grafici. */
  graph?: { src: string; xMin: number; xMax: number };
}

const LIMIT = 50;
const V2_PREFIX = 'calc_history_v2:';
const V1_PREFIX = 'calc_history_v1:';

function load(userEmail: string): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(V2_PREFIX + userEmail);
    if (raw) {
      const parsed = JSON.parse(raw) as HistoryEntry[];
      return Array.isArray(parsed) ? parsed.slice(0, LIMIT) : [];
    }
    // Migrazione dalla v1 (solo voci calc, senza campo mode).
    const v1 = localStorage.getItem(V1_PREFIX + userEmail);
    if (v1) {
      const old = JSON.parse(v1) as { expr: string; result: string; at: number }[];
      const migrated: HistoryEntry[] = (Array.isArray(old) ? old : []).map((e) => ({
        mode: 'calc',
        expr: e.expr,
        result: e.result,
        at: e.at,
        value: e.result,
      }));
      localStorage.setItem(V2_PREFIX + userEmail, JSON.stringify(migrated));
      localStorage.removeItem(V1_PREFIX + userEmail);
      return migrated;
    }
  } catch {
    // storage corrotto o bloccato
  }
  return [];
}

export interface HistoryStore {
  entries: HistoryEntry[];
  enabled: boolean;
  add: (entry: Omit<HistoryEntry, 'at'>) => void;
  clear: () => void;
}

export function useHistoryStore(userEmail: string, enabled: boolean): HistoryStore {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => load(userEmail));

  const persist = useCallback(
    (next: HistoryEntry[]) => {
      setEntries(next);
      try {
        localStorage.setItem(V2_PREFIX + userEmail, JSON.stringify(next));
      } catch {
        // storage pieno: pazienza
      }
    },
    [userEmail]
  );

  // Docente spegne la cronologia → si svuota anche lo storage.
  useEffect(() => {
    if (!enabled) {
      setEntries([]);
      try {
        localStorage.removeItem(V2_PREFIX + userEmail);
        localStorage.removeItem(V1_PREFIX + userEmail);
      } catch {
        // ignora
      }
    }
  }, [enabled, userEmail]);

  const add = useCallback(
    (entry: Omit<HistoryEntry, 'at'>) => {
      if (!enabled) return;
      setEntries((prev) => {
        // Anti-doppione: identica alla voce più recente → non registrare.
        const last = prev[0];
        if (last && last.mode === entry.mode && last.expr === entry.expr && last.result === entry.result) {
          return prev;
        }
        const next = [{ ...entry, at: Date.now() }, ...prev].slice(0, LIMIT);
        try {
          localStorage.setItem(V2_PREFIX + userEmail, JSON.stringify(next));
        } catch {
          // ignora
        }
        return next;
      });
    },
    [enabled, userEmail]
  );

  const clear = useCallback(() => persist([]), [persist]);

  return { entries: enabled ? entries : [], enabled, add, clear };
}
