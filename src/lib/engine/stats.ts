/**
 * Modalità statistica: parsing di una serie di numeri + indici statistici.
 */

import { CalcError } from './evaluator';

export interface StatsResult {
  count: number;
  sum: number;
  sumSq: number; // Σx²
  mean: number;
  median: number;
  mode: number[]; // moda (vuota se tutti i valori hanno frequenza 1)
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  popVariance: number;
  sampleVariance: number | null; // null con un solo dato
  popStd: number;
  sampleStd: number | null;
  cv: number | null; // coefficiente di variazione (σ/media), null se media = 0
}

/** Retta di regressione ai minimi quadrati y = m·x + q con coeff. r. */
export interface RegressionResult {
  count: number;
  slope: number; // m
  intercept: number; // q
  r: number; // coefficiente di correlazione di Pearson
  r2: number;
}

/** Quantile con interpolazione lineare (metodo "type 7", come Excel/R). */
function quantile(sorted: number[], p: number): number {
  const n = sorted.length;
  if (n === 1) return sorted[0];
  const pos = (n - 1) * p;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (pos - lo) * (sorted[hi] - sorted[lo]);
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
  const sumSq = xs.reduce((s, x) => s + x * x, 0);
  const sqDev = xs.reduce((s, x) => s + (x - mean) * (x - mean), 0);
  const popVariance = sqDev / n;
  const sampleVariance = n > 1 ? sqDev / (n - 1) : null;
  const popStd = Math.sqrt(popVariance);

  // Moda: valori con frequenza massima > 1 (nessuna moda se tutte a 1).
  const freq = new Map<number, number>();
  for (const x of xs) freq.set(x, (freq.get(x) ?? 0) + 1);
  const maxFreq = Math.max(...freq.values());
  const mode =
    maxFreq <= 1 ? [] : [...freq.entries()].filter(([, f]) => f === maxFreq).map(([v]) => v).sort((a, b) => a - b);

  return {
    count: n,
    sum,
    sumSq,
    mean,
    median,
    mode,
    min,
    max,
    range: max - min,
    q1: quantile(sorted, 0.25),
    q3: quantile(sorted, 0.75),
    iqr: quantile(sorted, 0.75) - quantile(sorted, 0.25),
    popVariance,
    sampleVariance,
    popStd,
    sampleStd: sampleVariance === null ? null : Math.sqrt(sampleVariance),
    cv: mean === 0 ? null : popStd / Math.abs(mean),
  };
}

/**
 * Coppie (x, y) da testo libero: una coppia per riga (o separate da ";"),
 * x e y separati da spazi/tab/virgola-tabulare. La virgola decimale italiana è
 * gestita solo se NON usata anche come separatore di colonna: qui i due valori
 * vanno separati da spazio/tab, così "1,5 2,5" = (1.5, 2.5).
 */
export function parsePairs(text: string): { xs: number[]; ys: number[] } {
  const rows = text
    .split(/[\n;]+/)
    .map((r) => r.trim())
    .filter((r) => r !== '');
  const xs: number[] = [];
  const ys: number[] = [];
  for (const row of rows) {
    const parts = row.split(/[\s\t]+/).filter((p) => p !== '');
    if (parts.length !== 2) {
      throw new CalcError(`"${row}" non è una coppia (servono due valori: x y)`);
    }
    const [xr, yr] = parts.map((p) => p.replace(',', '.'));
    if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(xr) || !/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(yr)) {
      throw new CalcError(`"${row}" contiene un valore non numerico`);
    }
    xs.push(parseFloat(xr));
    ys.push(parseFloat(yr));
  }
  return { xs, ys };
}

export function linearRegression(xs: number[], ys: number[]): RegressionResult {
  const n = xs.length;
  if (n < 2) throw new CalcError('Servono almeno due coppie (x, y)');
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  if (sxx === 0) throw new CalcError('Tutte le x sono uguali: retta non definita');
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const r = syy === 0 ? (sxy === 0 ? 0 : 1) : sxy / Math.sqrt(sxx * syy);
  return { count: n, slope, intercept, r, r2: r * r };
}
