/**
 * Campionamento di curve per la modalità grafici: esplicite y = f(x),
 * parametriche x(t), y(t) e polari r(θ).
 * Riusa il compilatore dell'evaluator → i permessi del docente valgono anche qui.
 */

import {
  compile,
  CalcError,
  CalcPermissionError,
  ALL_FUNCTIONS,
  type AngleMode,
  type EnginePermissions,
} from './evaluator';

export interface GraphSample {
  /** Punti campionati; null = discontinuità/fuori dominio (spezza il tratto). */
  points: ({ x: number; y: number } | null)[];
  /** Intervallo y suggerito (robusto rispetto agli asintoti). */
  yMin: number;
  yMax: number;
}

interface SampleOpts {
  angleMode: AngleMode;
  permissions: EnginePermissions;
  xMin: number;
  xMax: number;
  samples?: number;
  /** Valori extra (slider dei parametri: a, b, k…). */
  vars?: Record<string, number>;
}

function clampSamples(n: number | undefined, fallback: number): number {
  return Math.max(64, Math.min(2400, n ?? fallback));
}

/**
 * Compila f(x) in una funzione numerica x → y.
 * Lancia CalcError alla compilazione (sintassi) o alla valutazione (dominio,
 * permessi): chi campiona decide cosa fare punto per punto.
 */
export function compileExplicit(
  src: string,
  opts: { angleMode: AngleMode; permissions: EnginePermissions; vars?: Record<string, number> }
): (x: number) => number {
  const extra = opts.vars ?? {};
  const f = compile(src, {
    angleMode: opts.angleMode,
    permissions: opts.permissions,
    variables: ['x', ...Object.keys(extra)],
  });
  return (x: number) => f({ ...extra, x });
}

export function sampleFunction(src: string, opts: SampleOpts): GraphSample {
  const { xMin, xMax } = opts;
  if (!(xMax > xMin)) throw new CalcError('Intervallo x non valido');
  const n = clampSamples(opts.samples, 480);

  const f = compileExplicit(src, opts);

  const points: ({ x: number; y: number } | null)[] = [];
  const finite: number[] = [];
  const step = (xMax - xMin) / (n - 1);
  for (let i = 0; i < n; i++) {
    const x = xMin + step * i;
    try {
      const y = f(x);
      if (Number.isFinite(y)) {
        points.push({ x, y });
        finite.push(y);
      } else {
        points.push(null);
      }
    } catch (e) {
      // Un punto fuori dominio spezza il tratto; una funzione vietata blocca tutto.
      if (e instanceof CalcPermissionError) throw e;
      if (e instanceof CalcError) points.push(null);
      else throw e;
    }
  }
  if (finite.length === 0) throw new CalcError('Nessun punto calcolabile in questo intervallo');

  const { yMin, yMax } = robustRange(finite);
  return { points: breakJumps(points, f, yMin, yMax), yMin, yMax };
}

/**
 * Spezza i salti (floor, sign, se(...) e asintoti tipo tan): un gradino non va
 * collegato con un segmento verticale. Candidati = |Δy| ben sopra la mediana;
 * conferma col punto medio: se f(m) non sta vicino alla media, è un salto.
 */
function breakJumps(
  points: ({ x: number; y: number } | null)[],
  f: (x: number) => number,
  yMin: number,
  yMax: number
): ({ x: number; y: number } | null)[] {
  const dys: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1];
    const q = points[i];
    if (p && q) dys.push(Math.abs(q.y - p.y));
  }
  if (dys.length < 8) return points;
  const med = [...dys].sort((a, b) => a - b)[Math.floor(dys.length / 2)];
  const thr = Math.max(3 * med, (yMax - yMin) * 0.02, 1e-12);

  const out: ({ x: number; y: number } | null)[] = [];
  for (let i = 0; i < points.length; i++) {
    out.push(points[i]);
    const p = points[i];
    const q = points[i + 1];
    if (!p || !q) continue;
    const dy = Math.abs(q.y - p.y);
    if (dy <= thr) continue;
    let ym = NaN;
    try {
      const v = f((p.x + q.x) / 2);
      ym = Number.isFinite(v) ? v : NaN;
    } catch {
      // punto medio fuori dominio → salto certo
    }
    if (Number.isNaN(ym) || Math.abs(ym - (p.y + q.y) / 2) > dy * 0.25) out.push(null);
  }
  return out;
}

/**
 * Successione aₙ: campiona SOLO gli interi visibili (punti discreti).
 * Gli n fuori dominio (es. 1/n in 0) si saltano senza errore.
 */
export function sampleSequence(
  src: string,
  opts: {
    angleMode: AngleMode;
    permissions: EnginePermissions;
    xMin: number;
    xMax: number;
    vars?: Record<string, number>;
  }
): { points: { x: number; y: number }[] } {
  const nMin = Math.ceil(opts.xMin);
  const nMax = Math.floor(opts.xMax);
  const extra = opts.vars ?? {};
  const fn = compile(src, {
    angleMode: opts.angleMode,
    permissions: opts.permissions,
    variables: ['n', ...Object.keys(extra)],
  });
  const points: { x: number; y: number }[] = [];
  if (nMax < nMin) return { points };
  const stride = Math.max(1, Math.ceil((nMax - nMin + 1) / 1500));
  for (let n = nMin; n <= nMax; n += stride) {
    try {
      const y = fn({ ...extra, n });
      if (Number.isFinite(y)) points.push({ x: n, y });
    } catch (e) {
      if (e instanceof CalcPermissionError) throw e;
      if (!(e instanceof CalcError)) throw e;
      // n fuori dominio: salta
    }
  }
  return { points };
}

/** Curva parametrica x(t), y(t) campionata su [tMin, tMax]. */
export function sampleParametric(
  xSrc: string,
  ySrc: string,
  opts: {
    angleMode: AngleMode;
    permissions: EnginePermissions;
    tMin: number;
    tMax: number;
    samples?: number;
    vars?: Record<string, number>;
  }
): { points: ({ x: number; y: number } | null)[] } {
  const { tMin, tMax } = opts;
  if (!(tMax > tMin)) throw new CalcError('Intervallo t non valido');
  const n = clampSamples(opts.samples, 600);
  const extra = opts.vars ?? {};
  const common = {
    angleMode: opts.angleMode,
    permissions: opts.permissions,
    variables: ['t', ...Object.keys(extra)],
  };
  const fx = compile(xSrc, common);
  const fy = compile(ySrc, common);

  const points: ({ x: number; y: number } | null)[] = [];
  let finite = 0;
  const step = (tMax - tMin) / (n - 1);
  for (let i = 0; i < n; i++) {
    const t = tMin + step * i;
    try {
      const x = fx({ ...extra, t });
      const y = fy({ ...extra, t });
      if (Number.isFinite(x) && Number.isFinite(y)) {
        points.push({ x, y });
        finite++;
      } else {
        points.push(null);
      }
    } catch (e) {
      if (e instanceof CalcPermissionError) throw e;
      if (e instanceof CalcError) points.push(null);
      else throw e;
    }
  }
  if (finite === 0) throw new CalcError('Nessun punto calcolabile in questo intervallo');
  return { points };
}

/** Curva polare r(θ) campionata su [tMin, tMax] (θ nell'unità angolare attiva). */
export function samplePolar(
  rSrc: string,
  opts: {
    angleMode: AngleMode;
    permissions: EnginePermissions;
    tMin: number;
    tMax: number;
    samples?: number;
    vars?: Record<string, number>;
  }
): { points: ({ x: number; y: number } | null)[] } {
  const { tMin, tMax } = opts;
  if (!(tMax > tMin)) throw new CalcError('Intervallo θ non valido');
  const n = clampSamples(opts.samples, 720);
  const extra = opts.vars ?? {};
  const fr = compile(rSrc, {
    angleMode: opts.angleMode,
    permissions: opts.permissions,
    // θ e t sono sinonimi: si può scrivere r = 1 + cos(θ) oppure 1 + cos(t).
    variables: ['t', 'theta', ...Object.keys(extra)],
  });
  const toRad = opts.angleMode === 'deg' ? Math.PI / 180 : 1;

  const points: ({ x: number; y: number } | null)[] = [];
  let finite = 0;
  const step = (tMax - tMin) / (n - 1);
  for (let i = 0; i < n; i++) {
    const t = tMin + step * i;
    try {
      const r = fr({ ...extra, t, theta: t });
      if (Number.isFinite(r)) {
        const a = t * toRad;
        points.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
        finite++;
      } else {
        points.push(null);
      }
    } catch (e) {
      if (e instanceof CalcPermissionError) throw e;
      if (e instanceof CalcError) points.push(null);
      else throw e;
    }
  }
  if (finite === 0) throw new CalcError('Nessun punto calcolabile in questo intervallo');
  return { points };
}

/** Range robusto (percentili 2–98 + margine) per non farsi schiacciare dagli asintoti. */
export function robustRange(values: number[]): { yMin: number; yMax: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const lo = sorted[Math.floor(0.02 * (sorted.length - 1))];
  const hi = sorted[Math.ceil(0.98 * (sorted.length - 1))];
  let yMin = lo;
  let yMax = hi;
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  } else {
    const pad = (yMax - yMin) * 0.12;
    yMin -= pad;
    yMax += pad;
  }
  return { yMin, yMax };
}

// ------------------------------------------------- Rilevamento dei parametri

const RESERVED = new Set<string>([...ALL_FUNCTIONS, 'pi', 'e', 'x', 'y', 't', 'n', 'theta', 'ans', 'mem']);

/**
 * Scansione lessicale tollerante: i nomi di UNA lettera che non sono
 * variabili/funzioni/costanti note sono candidati parametro (slider).
 * "a x^2 + b" → ['a', 'b']. I nomi lunghi restano errori di sintassi normali.
 */
export function detectParams(src: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const re = /[a-zA-Zθπ][a-zA-Z0-9]*/g;
  for (const m of src.matchAll(re)) {
    const name = m[0] === 'θ' ? 'theta' : m[0] === 'π' ? 'pi' : m[0];
    if (name.length !== 1 || RESERVED.has(name) || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out.sort();
}
