/**
 * Stato e logica della calcolatrice Standard/Scientifica.
 *
 * L'espressione è una lista di token digitati (src per il motore, disp per il
 * display): il backspace toglie l'ultimo token, i tasti vietati non esistono
 * proprio. L'ultimo risultato ("ans") e la memoria ("mem") viaggiano come
 * variabili del motore, così restano esatti anche in notazione esponenziale.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalcError,
  evaluate,
  formatResult,
  type AngleMode,
} from '../lib/engine/evaluator';
import { enginePermissions, type CalcConfig } from '../lib/config';

export interface UiToken {
  src: string;
  disp: string;
  /** true per il segno inserito dal tasto ± (per poterlo ri-togliere). */
  signToggle?: boolean;
}

export interface HistoryEntry {
  expr: string;
  result: string;
  at: number;
}

const HISTORY_LIMIT = 50;

function historyKey(userEmail: string): string {
  return `calc_history_v1:${userEmail}`;
}

function loadHistory(userEmail: string): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(historyKey(userEmail));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

export interface Calculator {
  tokens: UiToken[];
  exprText: string;
  /** Risultato confermato con '=' (grande nel display). */
  committed: string | null;
  /** Anteprima live (grigia) mentre si digita. */
  preview: string | null;
  error: string | null;
  shakeNonce: number;
  angleMode: AngleMode;
  setAngleMode: (m: AngleMode) => void;
  memory: number | null;
  history: HistoryEntry[];
  pressDigit: (d: string) => void;
  pressToken: (src: string, disp?: string) => void;
  toggleSign: () => void;
  backspace: () => void;
  clearAll: () => void;
  equals: () => void;
  memClear: () => void;
  memRecall: () => void;
  memAdd: (sign: 1 | -1) => void;
  recallHistory: (entry: HistoryEntry) => void;
  clearHistory: () => void;
}

export function useCalculator(config: CalcConfig, userEmail: string): Calculator {
  const [tokens, setTokens] = useState<UiToken[]>([]);
  const [committed, setCommitted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shakeNonce, setShakeNonce] = useState(0);
  const [angleMode, setAngleMode] = useState<AngleMode>('deg');
  const [memory, setMemory] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory(userEmail));
  const justEvaluated = useRef(false);
  const ansValue = useRef<number | null>(null);

  const permissions = useMemo(() => enginePermissions(config), [config]);

  const evalOpts = useMemo(
    () => ({ angleMode, permissions, variables: ['ans', 'mem'] as string[] }),
    [angleMode, permissions]
  );

  const varValues = useCallback((): Record<string, number> => {
    const vars: Record<string, number> = {};
    if (ansValue.current !== null) vars.ans = ansValue.current;
    if (memory !== null) vars.mem = memory;
    return vars;
  }, [memory]);

  // Cronologia: persistenza + azzeramento quando il docente la disattiva.
  useEffect(() => {
    if (!config.history.enabled) {
      setHistory([]);
      try {
        localStorage.removeItem(historyKey(userEmail));
      } catch {
        // ignora
      }
    }
  }, [config.history.enabled, userEmail]);

  const persistHistory = useCallback(
    (entries: HistoryEntry[]) => {
      setHistory(entries);
      try {
        localStorage.setItem(historyKey(userEmail), JSON.stringify(entries));
      } catch {
        // storage pieno o bloccato: pazienza
      }
    },
    [userEmail]
  );

  const exprText = useMemo(() => tokens.map((t) => t.disp).join(''), [tokens]);

  const preview = useMemo(() => {
    if (tokens.length === 0 || justEvaluated.current) return null;
    try {
      const value = evaluate(tokens.map((t) => t.src).join(''), evalOpts, varValues());
      return formatResult(value);
    } catch {
      return null;
    }
  }, [tokens, evalOpts, varValues]);

  const startFreshIfNeeded = useCallback((forOperator: boolean) => {
    if (!justEvaluated.current) return;
    justEvaluated.current = false;
    setCommitted(null);
    if (!forOperator) setTokens([]);
    // Dopo '=': un operatore continua dal risultato (token "ans" già presente).
  }, []);

  const pressDigit = useCallback(
    (d: string) => {
      setError(null);
      startFreshIfNeeded(false);
      setTokens((ts) => {
        if (d === '.') {
          // Un solo punto per numero: guarda il run di cifre in coda.
          for (let i = ts.length - 1; i >= 0; i--) {
            const s = ts[i].src;
            if (s === '.') return ts;
            if (!/^\d$/.test(s)) break;
          }
          const last = ts[ts.length - 1];
          const needsZero = !last || !/^\d$/.test(last.src);
          const zero: UiToken[] = needsZero ? [{ src: '0', disp: '0' }] : [];
          return [...ts, ...zero, { src: '.', disp: ',' }];
        }
        return [...ts, { src: d, disp: d }];
      });
    },
    [startFreshIfNeeded]
  );

  const pressToken = useCallback(
    (src: string, disp?: string) => {
      setError(null);
      const isOperator = ['+', '-', '*', '/', '^', '!', '%', ')'].includes(src);
      startFreshIfNeeded(isOperator);
      setTokens((ts) => [...ts, { src, disp: disp ?? src }]);
    },
    [startFreshIfNeeded]
  );

  const toggleSign = useCallback(() => {
    setError(null);
    startFreshIfNeeded(true);
    setTokens((ts) => {
      // Trova l'inizio del numero corrente (run di cifre/punto o "ans"/"mem").
      let i = ts.length - 1;
      if (i < 0) return ts;
      if (ts[i].src === 'ans' || ts[i].src === 'mem') {
        i -= 1;
      } else {
        if (!/^[\d.]$/.test(ts[i].src)) return ts;
        while (i >= 0 && /^[\d.]$/.test(ts[i].src)) i--;
      }
      const insertAt = i + 1;
      const before = ts[i];
      if (before?.signToggle) {
        // C'era già il meno del ±: toglilo (e l'eventuale parentesi aperta).
        return [...ts.slice(0, i), ...ts.slice(i + 1)];
      }
      const minus: UiToken = { src: '-', disp: '−', signToggle: true };
      return [...ts.slice(0, insertAt), minus, ...ts.slice(insertAt)];
    });
  }, [startFreshIfNeeded]);

  const backspace = useCallback(() => {
    setError(null);
    if (justEvaluated.current) {
      justEvaluated.current = false;
      setCommitted(null);
      setTokens([]);
      return;
    }
    setTokens((ts) => ts.slice(0, -1));
  }, []);

  const clearAll = useCallback(() => {
    setError(null);
    setCommitted(null);
    justEvaluated.current = false;
    setTokens([]);
  }, []);

  const equals = useCallback(() => {
    if (tokens.length === 0 || justEvaluated.current) return;
    try {
      const value = evaluate(tokens.map((t) => t.src).join(''), evalOpts, varValues());
      const formatted = formatResult(value);
      ansValue.current = value;
      setCommitted(formatted);
      setError(null);
      justEvaluated.current = true;
      if (config.history.enabled) {
        persistHistory([{ expr: exprText, result: formatted, at: Date.now() }, ...history].slice(0, HISTORY_LIMIT));
      }
      setTokens([{ src: 'ans', disp: formatted }]);
    } catch (e) {
      setError(e instanceof CalcError ? e.message : 'Errore di calcolo');
      setShakeNonce((n) => n + 1);
    }
  }, [tokens, evalOpts, varValues, config.history.enabled, exprText, history, persistHistory]);

  const currentValue = useCallback((): number | null => {
    if (justEvaluated.current && ansValue.current !== null) return ansValue.current;
    if (tokens.length === 0) return null;
    try {
      return evaluate(tokens.map((t) => t.src).join(''), evalOpts, varValues());
    } catch {
      return null;
    }
  }, [tokens, evalOpts, varValues]);

  const memClear = useCallback(() => setMemory(null), []);

  const memAdd = useCallback(
    (sign: 1 | -1) => {
      const v = currentValue();
      if (v === null) return;
      setMemory((m) => (m ?? 0) + sign * v);
    },
    [currentValue]
  );

  const memRecall = useCallback(() => {
    if (memory === null) return;
    setError(null);
    startFreshIfNeeded(false);
    setTokens((ts) => [...ts, { src: 'mem', disp: formatResult(memory) }]);
  }, [memory, startFreshIfNeeded]);

  const recallHistory = useCallback(
    (entry: HistoryEntry) => {
      setError(null);
      justEvaluated.current = false;
      setCommitted(null);
      const value = parseFloat(entry.result);
      if (Number.isFinite(value)) {
        ansValue.current = value;
        setTokens([{ src: 'ans', disp: entry.result }]);
      }
    },
    []
  );

  const clearHistory = useCallback(() => {
    persistHistory([]);
  }, [persistHistory]);

  return {
    tokens,
    exprText,
    committed,
    preview,
    error,
    shakeNonce,
    angleMode,
    setAngleMode,
    memory,
    history: config.history.enabled ? history : [],
    pressDigit,
    pressToken,
    toggleSign,
    backspace,
    clearAll,
    equals,
    memClear,
    memRecall,
    memAdd,
    recallHistory,
    clearHistory,
  };
}
