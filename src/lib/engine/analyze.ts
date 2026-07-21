/**
 * Analisi numerica per i grafici: zeri, estremi, intersezioni, derivata,
 * tangente e integrale. Tutto numerico (bisezione, sezione aurea, Simpson):
 * niente calcolo simbolico, precisione più che adeguata all'uso didattico.
 */

import { CalcError } from './evaluator';

export type Fn = (x: number) => number;

export interface NotablePoint {
  x: number;
  y: number;
  kind: 'zero' | 'max' | 'min' | 'intersection';
}

/** Valutazione tollerante: errori di dominio → NaN (non propagano). */
function safe(f: Fn, x: number): number {
  try {
    const y = f(x);
    return Number.isFinite(y) ? y : NaN;
  } catch (e) {
    if (e instanceof CalcError) return NaN;
    throw e;
  }
}

/** Bisezione su un intervallo con cambio di segno già accertato. */
function bisect(f: Fn, a: number, b: number, fa: number): number {
  for (let i = 0; i < 64; i++) {
    const m = (a + b) / 2;
    const fm = safe(f, m);
    if (Number.isNaN(fm)) break;
    if (fm === 0) return m;
    if (fa * fm < 0) {
      b = m;
    } else {
      a = m;
      fa = fm;
    }
  }
  return (a + b) / 2;
}

/** Zeri di f su [xMin, xMax] (max ~80, deduplicati). */
export function findZeros(f: Fn, xMin: number, xMax: number, samples = 480): number[] {
  if (!(xMax > xMin)) return [];
  const out: number[] = [];
  const step = (xMax - xMin) / samples;
  const tol = (xMax - xMin) * 1e-7;
  let prevX = xMin;
  let prevY = safe(f, xMin);
  for (let i = 1; i <= samples && out.length < 80; i++) {
    const x = xMin + step * i;
    const y = safe(f, x);
    if (!Number.isNaN(prevY) && !Number.isNaN(y)) {
      if (prevY === 0) {
        if (out.length === 0 || Math.abs(prevX - out[out.length - 1]) > tol) out.push(prevX);
      } else if (prevY * y < 0) {
        const r = bisect(f, prevX, x, prevY);
        if (out.length === 0 || Math.abs(r - out[out.length - 1]) > tol) out.push(r);
      }
    }
    prevX = x;
    prevY = y;
  }
  if (!Number.isNaN(prevY) && prevY === 0) {
    if (out.length === 0 || Math.abs(prevX - out[out.length - 1]) > tol) out.push(prevX);
  }
  return out;
}

/** Raffina un estremo locale con la sezione aurea su [a, b]. */
function goldenExtremum(f: Fn, a: number, b: number, findMax: boolean): number {
  const phi = (Math.sqrt(5) - 1) / 2;
  let x1 = b - phi * (b - a);
  let x2 = a + phi * (b - a);
  let f1 = safe(f, x1);
  let f2 = safe(f, x2);
  for (let i = 0; i < 48; i++) {
    if (Number.isNaN(f1) || Number.isNaN(f2)) break;
    const keepLeft = findMax ? f1 > f2 : f1 < f2;
    if (keepLeft) {
      b = x2;
      x2 = x1;
      f2 = f1;
      x1 = b - phi * (b - a);
      f1 = safe(f, x1);
    } else {
      a = x1;
      x1 = x2;
      f1 = f2;
      x2 = a + phi * (b - a);
      f2 = safe(f, x2);
    }
  }
  return (a + b) / 2;
}

/** Massimi e minimi locali di f su [xMin, xMax] (max ~40). */
export function findExtrema(f: Fn, xMin: number, xMax: number, samples = 480): NotablePoint[] {
  if (!(xMax > xMin)) return [];
  const out: NotablePoint[] = [];
  const step = (xMax - xMin) / samples;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const x = xMin + step * i;
    xs.push(x);
    ys.push(safe(f, x));
  }
  for (let i = 1; i < samples && out.length < 40; i++) {
    const a = ys[i - 1];
    const b = ys[i];
    const c = ys[i + 1];
    if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c)) continue;
    const isMax = b > a && b > c;
    const isMin = b < a && b < c;
    if (!isMax && !isMin) continue;
    const x = goldenExtremum(f, xs[i - 1], xs[i + 1], isMax);
    const y = safe(f, x);
    if (Number.isNaN(y)) continue;
    out.push({ x, y, kind: isMax ? 'max' : 'min' });
  }
  return out;
}

/** Intersezioni tra f e g su [xMin, xMax]: zeri di f − g. */
export function findIntersections(f: Fn, g: Fn, xMin: number, xMax: number): NotablePoint[] {
  const h: Fn = (x) => f(x) - g(x);
  return findZeros(h, xMin, xMax).map((x) => ({ x, y: safe(f, x), kind: 'intersection' as const }))
    .filter((p) => !Number.isNaN(p.y));
}

/** Derivata numerica (stencil a 5 punti). NaN se non calcolabile. */
export function derivativeAt(f: Fn, x: number): number {
  const h = 1e-4 * Math.max(1, Math.abs(x));
  const m2 = safe(f, x - 2 * h);
  const m1 = safe(f, x - h);
  const p1 = safe(f, x + h);
  const p2 = safe(f, x + 2 * h);
  if ([m2, m1, p1, p2].some(Number.isNaN)) {
    // Fallback: differenza centrale semplice (bordi di dominio).
    if (!Number.isNaN(m1) && !Number.isNaN(p1)) return (p1 - m1) / (2 * h);
    return NaN;
  }
  return (m2 - 8 * m1 + 8 * p1 - p2) / (12 * h);
}

export interface Tangent {
  x0: number;
  y0: number;
  /** Pendenza. */
  m: number;
  /** Intercetta: y = m·x + q. */
  q: number;
}

/** Retta tangente a f in x0. Lancia CalcError se f o f′ non sono definite lì. */
export function tangentAt(f: Fn, x0: number): Tangent {
  const y0 = safe(f, x0);
  const m = derivativeAt(f, x0);
  if (Number.isNaN(y0) || Number.isNaN(m)) {
    throw new CalcError('Tangente non definita in questo punto');
  }
  return { x0, y0, m, q: y0 - m * x0 };
}

/**
 * Integrale definito con Simpson composito (n suddivisioni pari).
 * Lancia CalcError se la funzione non è definita su tutto [a, b].
 */
export function integrate(f: Fn, a: number, b: number, n = 512): number {
  if (a === b) return 0;
  const sign = a < b ? 1 : -1;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  if (n % 2 === 1) n++;
  const h = (hi - lo) / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const y = safe(f, lo + h * i);
    if (Number.isNaN(y)) throw new CalcError('Funzione non definita su tutto l’intervallo');
    const w = i === 0 || i === n ? 1 : i % 2 === 1 ? 4 : 2;
    sum += w * y;
  }
  return (sign * sum * h) / 3;
}
