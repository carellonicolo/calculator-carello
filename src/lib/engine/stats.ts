/**
 * Modalità statistica: parsing di una serie di numeri + indici statistici.
 */

import { CalcError } from './evaluator';

export interface StatsResult {
  count: number;
  sum: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  range: number;
  popVariance: number;
  sampleVariance: number | null; // null con un solo dato
  popStd: number;
  sampleStd: number | null;
}

/**
 * Estrae i numeri da testo libero. Separatori: spazi, a capo, punto e virgola.
 * La virgola dentro un token è trattata da separatore decimale italiano
 * ("12,5" → 12.5); il punto è sempre accettato.
 */
export function parseNumbers(text: string): number[] {
  const tokens = text
    .split(/[\s;]+/)
    .map((t) => t.trim())
    .filter((t) => t !== '');
  const out: number[] = [];
  for (const tok of tokens) {
    const norm = tok.replace(',', '.');
    if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(norm)) {
      throw new CalcError(`"${tok}" non è un numero valido`);
    }
    out.push(parseFloat(norm));
  }
  return out;
}

export function computeStats(xs: number[]): StatsResult {
  if (xs.length === 0) throw new CalcError('Inserisci almeno un numero');
  const n = xs.length;
  const sorted = [...xs].sort((a, b) => a - b);
  const sum = xs.reduce((s, x) => s + x, 0);
  const mean = sum / n;
  const median =
    n % 2 === 1 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const min = sorted[0];
  const max = sorted[n - 1];
  const sqDev = xs.reduce((s, x) => s + (x - mean) * (x - mean), 0);
  const popVariance = sqDev / n;
  const sampleVariance = n > 1 ? sqDev / (n - 1) : null;
  return {
    count: n,
    sum,
    mean,
    median,
    min,
    max,
    range: max - min,
    popVariance,
    sampleVariance,
    popStd: Math.sqrt(popVariance),
    sampleStd: sampleVariance === null ? null : Math.sqrt(sampleVariance),
  };
}
