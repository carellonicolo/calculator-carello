/**
 * Lato client di CalcConfig: la FORMA viene da functions/_lib/calcconfig.ts
 * (fonte unica, importata direttamente), qui si aggiungono i metadati UI
 * (etichette per la console docente) e la mappatura verso i permessi del
 * motore di calcolo.
 */

import {
  DEFAULT_CONFIG,
  countRestrictions,
  sanitizeConfig,
  type CalcConfig,
} from '../../functions/_lib/calcconfig';
import { type EnginePermissions } from './engine/evaluator';

export { DEFAULT_CONFIG, countRestrictions, sanitizeConfig };
export type { CalcConfig };

export type ModeId = 'standard' | 'scientific' | 'programmer' | 'graphing' | 'statistics';

export const MODES: { id: ModeId; label: string; short: string }[] = [
  { id: 'standard', label: 'Standard', short: 'Std' },
  { id: 'scientific', label: 'Scientifica', short: 'Sci' },
  { id: 'programmer', label: 'Programmatore', short: 'Prog' },
  { id: 'graphing', label: 'Grafici', short: 'Graf' },
  { id: 'statistics', label: 'Statistica', short: 'Stat' },
];

/** Modalità visibili allo studente con la config data. */
export function visibleModes(c: CalcConfig): ModeId[] {
  const out: ModeId[] = ['standard'];
  if (c.scientific.enabled) out.push('scientific');
  if (c.programmer.enabled) out.push('programmer');
  if (c.graphing.enabled) out.push('graphing');
  if (c.statistics.enabled) out.push('statistics');
  return out;
}

/**
 * Permessi del motore derivati dalla config (unico punto di enforcement per
 * tastiera, tastiera fisica E grafici).
 */
export function enginePermissions(c: CalcConfig): EnginePermissions {
  const functions = new Set<string>(['abs']);
  if (c.standard.sqrt) functions.add('sqrt');
  if (c.scientific.enabled) {
    if (c.scientific.trig) {
      for (const f of ['sin', 'cos', 'tan', 'asin', 'acos', 'atan']) functions.add(f);
    }
    if (c.scientific.logExp) {
      for (const f of ['ln', 'log', 'exp', 'pow10']) functions.add(f);
    }
    if (c.scientific.powRoot) functions.add('cbrt');
  }
  return {
    functions,
    constants: c.scientific.enabled && c.scientific.constants,
    factorial: c.scientific.enabled && c.scientific.factorial,
    percent: c.standard.percent,
    power: c.scientific.enabled && c.scientific.powRoot,
  };
}

// ------------------------------------------------- Metadati per la console

export interface GroupMeta {
  /** Percorso nel CalcConfig, es. ['scientific','trig']. */
  area: keyof CalcConfig;
  key: string;
  label: string;
  hint: string;
}

export interface AreaMeta {
  area: keyof CalcConfig;
  label: string;
  hint: string;
  /** true se l'area ha il master switch `enabled`. */
  hasMaster: boolean;
  groups: GroupMeta[];
}

export const AREAS: AreaMeta[] = [
  {
    area: 'standard',
    label: 'Standard',
    hint: 'Le quattro operazioni sono sempre disponibili',
    hasMaster: false,
    groups: [
      { area: 'standard', key: 'percent', label: 'Percentuale', hint: 'tasto % (50% → 0,5)' },
      { area: 'standard', key: 'sqrt', label: 'Radice quadrata', hint: 'tasto √' },
      { area: 'standard', key: 'memory', label: 'Memoria', hint: 'MC · MR · M+ · M−' },
    ],
  },
  {
    area: 'scientific',
    label: 'Scientifica',
    hint: 'Funzioni matematiche avanzate',
    hasMaster: true,
    groups: [
      { area: 'scientific', key: 'trig', label: 'Trigonometria', hint: 'sin · cos · tan · inverse · DEG/RAD' },
      { area: 'scientific', key: 'logExp', label: 'Logaritmi ed esponenziali', hint: 'ln · log₁₀ · eˣ · 10ˣ' },
      { area: 'scientific', key: 'powRoot', label: 'Potenze e radici', hint: 'x² · x³ · xʸ · ∛ · 1/x' },
      { area: 'scientific', key: 'factorial', label: 'Fattoriale', hint: 'n!' },
      { area: 'scientific', key: 'constants', label: 'Costanti', hint: 'π · e' },
    ],
  },
  {
    area: 'programmer',
    label: 'Programmatore',
    hint: 'Basi di numerazione e logica binaria',
    hasMaster: true,
    groups: [
      { area: 'programmer', key: 'baseConv', label: 'Conversioni di base', hint: 'BIN · OCT · DEC · HEX' },
      { area: 'programmer', key: 'bitwise', label: 'Operazioni bitwise', hint: 'AND · OR · XOR · NOT · shift' },
    ],
  },
  {
    area: 'graphing',
    label: 'Grafici',
    hint: 'Grafico di y = f(x)',
    hasMaster: true,
    groups: [],
  },
  {
    area: 'statistics',
    label: 'Statistica',
    hint: 'Media, mediana, deviazione standard…',
    hasMaster: true,
    groups: [],
  },
  {
    area: 'history',
    label: 'Cronologia',
    hint: 'Storico dei calcoli sul dispositivo',
    hasMaster: true,
    groups: [],
  },
];

/** Legge un flag della config dato area+key ('enabled' per il master). */
export function getFlag(c: CalcConfig, area: keyof CalcConfig, key: string): boolean {
  return Boolean((c[area] as unknown as Record<string, boolean>)[key]);
}

/** Ritorna una nuova config con il flag modificato. */
export function withFlag(c: CalcConfig, area: keyof CalcConfig, key: string, value: boolean): CalcConfig {
  return sanitizeConfig({
    ...c,
    [area]: { ...(c[area] as unknown as Record<string, boolean>), [key]: value },
  });
}

/** Riassunto testuale delle restrizioni (per il badge studente). */
export function restrictionSummary(c: CalcConfig): string[] {
  const out: string[] = [];
  for (const a of AREAS) {
    if (a.hasMaster && !getFlag(c, a.area, 'enabled')) {
      out.push(`${a.label}: disattivata`);
      continue;
    }
    const off = a.groups.filter((g) => !getFlag(c, g.area, g.key)).map((g) => g.label);
    if (off.length > 0) out.push(`${a.label}: ${off.join(', ').toLowerCase()}`);
  }
  return out;
}
