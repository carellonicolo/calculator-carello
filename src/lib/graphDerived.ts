/**
 * Derivazione della scena → dati pronti da disegnare: campioni delle curve,
 * derivate, tangenti, integrali, punti notevoli ed errori per funzione.
 * Tutto puro: i componenti lo chiamano dentro useMemo.
 */

import {
  CalcError,
  CalcPermissionError,
  formatResult,
  type AngleMode,
  type EnginePermissions,
} from './engine/evaluator';
import {
  compileExplicit,
  sampleFunction,
  sampleParametric,
  samplePolar,
} from './engine/graph';
import {
  derivativeAt,
  findExtrema,
  findIntersections,
  findZeros,
  integrate,
  tangentAt,
  type Tangent,
} from './engine/analyze';
import type { GraphFunction, GraphScene, ViewWindow } from './graphScene';

export type Pt = { x: number; y: number } | null;

export interface GraphFeatures {
  paramPolar: boolean;
  analysis: boolean;
  calculus: boolean;
}

export interface CurveRender {
  f: GraphFunction;
  /** f(x) compilata — solo esplicite valide (serve a trace/tabella). */
  fn: ((x: number) => number) | null;
  pts: Pt[];
  /** Campioni della derivata (overlay f′). */
  dpts: Pt[] | null;
  tangent: Tangent | null;
  integral: { value: number; area: Pt[] } | null;
  /** Messaggio di errore da mostrare nella riga della funzione. */
  error: string | null;
}

export interface NotablePt {
  x: number;
  y: number;
  kind: 'zero' | 'max' | 'min' | 'intersection';
  color: string;
  /** Etichetta breve ("zero", "max", "∩"). */
  label: string;
}

const SAMPLES = 900;

function errMsg(e: unknown): string {
  if (e instanceof CalcPermissionError) return e.message;
  if (e instanceof CalcError) return e.message;
  return 'Errore';
}

/** Campiona una singola funzione della scena nella finestra di vista. */
function renderFunc(
  f: GraphFunction,
  view: ViewWindow,
  angleMode: AngleMode,
  permissions: EnginePermissions,
  vars: Record<string, number>,
  features: GraphFeatures
): CurveRender {
  const out: CurveRender = { f, fn: null, pts: [], dpts: null, tangent: null, integral: null, error: null };
  const empty = f.src.trim() === '' || (f.kind === 'parametric' && f.srcY.trim() === '');
  if (!f.visible || empty) return out;

  if (f.kind !== 'explicit' && !features.paramPolar) {
    out.error = 'Curve parametriche e polari disattivate dal docente';
    return out;
  }

  try {
    if (f.kind === 'explicit') {
      const s = sampleFunction(f.src, {
        angleMode,
        permissions,
        xMin: view.xMin,
        xMax: view.xMax,
        samples: SAMPLES,
        vars,
      });
      out.pts = s.points;
      out.fn = compileExplicit(f.src, { angleMode, permissions, vars });

      if (features.calculus && f.derivative) {
        const fn = out.fn;
        const dpts: Pt[] = [];
        const step = (view.xMax - view.xMin) / (SAMPLES - 1);
        for (let i = 0; i < SAMPLES; i += 2) {
          const x = view.xMin + step * i;
          const d = derivativeAt(fn, x);
          dpts.push(Number.isFinite(d) ? { x, y: d } : null);
        }
        out.dpts = dpts;
      }
      if (features.calculus && f.tangent) {
        try {
          out.tangent = tangentAt(out.fn, f.tangentX);
        } catch {
          out.tangent = null;
        }
      }
      if (features.calculus && f.integral && f.intA !== f.intB) {
        try {
          const value = integrate(out.fn, f.intA, f.intB);
          const lo = Math.min(f.intA, f.intB);
          const hi = Math.max(f.intA, f.intB);
          const area: Pt[] = [];
          const n = 220;
          for (let i = 0; i <= n; i++) {
            const x = lo + ((hi - lo) * i) / n;
            try {
              const y = out.fn(x);
              area.push(Number.isFinite(y) ? { x, y } : null);
            } catch {
              area.push(null);
            }
          }
          out.integral = { value, area };
        } catch (e) {
          out.integral = null;
          out.error = errMsg(e);
        }
      }
    } else if (f.kind === 'parametric') {
      out.pts = sampleParametric(f.src, f.srcY, {
        angleMode,
        permissions,
        tMin: f.tMin,
        tMax: f.tMax,
        vars,
      }).points;
    } else {
      out.pts = samplePolar(f.src, {
        angleMode,
        permissions,
        tMin: f.tMin,
        tMax: f.tMax,
        vars,
      }).points;
    }
  } catch (e) {
    out.error = errMsg(e);
    out.pts = [];
    out.fn = null;
  }
  return out;
}

export function buildRenders(
  scene: GraphScene,
  permissions: EnginePermissions,
  vars: Record<string, number>,
  features: GraphFeatures
): CurveRender[] {
  return scene.funcs.map((f) =>
    renderFunc(f, scene.view, scene.angleMode, permissions, vars, features)
  );
}

/** Punti notevoli sulle esplicite visibili, secondo i tool attivi. */
export function buildNotables(
  scene: GraphScene,
  renders: CurveRender[],
  features: GraphFeatures
): NotablePt[] {
  if (!features.analysis) return [];
  const { zeros, extrema, intersections } = scene.tools;
  if (!zeros && !extrema && !intersections) return [];
  const { xMin, xMax } = scene.view;
  const out: NotablePt[] = [];
  const usable = renders.filter((r) => r.fn !== null && r.f.visible);

  for (const r of usable) {
    const fn = r.fn as (x: number) => number;
    if (zeros) {
      for (const x of findZeros(fn, xMin, xMax)) {
        out.push({ x, y: 0, kind: 'zero', color: r.f.color, label: 'zero' });
      }
    }
    if (extrema) {
      for (const p of findExtrema(fn, xMin, xMax)) {
        out.push({ ...p, color: r.f.color, label: p.kind === 'max' ? 'max' : 'min' });
      }
    }
  }
  if (intersections) {
    for (let i = 0; i < usable.length; i++) {
      for (let j = i + 1; j < usable.length; j++) {
        const fi = usable[i].fn as (x: number) => number;
        const fj = usable[j].fn as (x: number) => number;
        for (const p of findIntersections(fi, fj, xMin, xMax)) {
          out.push({ ...p, color: usable[i].f.color, label: '∩' });
        }
      }
    }
  }
  return out.slice(0, 160);
}

// ------------------------------------------------------------- Griglia/tick

export interface GridTick {
  v: number;
  label: string;
}

export interface GridTicks {
  xTicks: GridTick[];
  yTicks: GridTick[];
  xMinor: number[];
  yMinor: number[];
}

/** Passo "bello" (1, 2 o 5 × 10^k) per una spaziatura target in px. */
export function niceStep(range: number, pixels: number, targetPx: number): number {
  const rough = (range / Math.max(1, pixels)) * targetPx;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  if (norm <= 1) return mag;
  if (norm <= 2) return 2 * mag;
  if (norm <= 5) return 5 * mag;
  return 10 * mag;
}

export function fmtTick(v: number): string {
  const r = Math.round(v * 1e9) / 1e9;
  if (r === 0) return '0';
  if (Math.abs(r) >= 1e6 || Math.abs(r) < 1e-4) return r.toExponential(0).replace('e+', 'e');
  return String(r).replace('.', ',');
}

/** Etichetta per tick a multipli di π/4 (q = numero di quarti di π). */
export function fmtPiTick(q: number): string {
  if (q === 0) return '0';
  const sign = q < 0 ? '−' : '';
  const a = Math.abs(q);
  const g = a % 4 === 0 ? 4 : a % 2 === 0 ? 2 : 1;
  const n = a / g;
  const d = 4 / g;
  const num = n === 1 ? 'π' : `${n}π`;
  return d === 1 ? `${sign}${num}` : `${sign}${num}/${d}`;
}

/** Tick e griglia per la finestra data (condiviso da plot a schermo ed export). */
export function computeGrid(
  view: ViewWindow,
  w: number,
  h: number,
  opts: { piTicks: boolean; angleMode: AngleMode; minorGrid: boolean }
): GridTicks {
  const xr = view.xMax - view.xMin;
  const yr = view.yMax - view.yMin;
  const usePi = opts.piTicks && opts.angleMode === 'rad';

  const xTicks: GridTick[] = [];
  let xStep: number;
  if (usePi) {
    const quarter = Math.PI / 4;
    let m = 1;
    while ((m * quarter * w) / xr < 56 && m < 512) m *= 2;
    xStep = m * quarter;
    const q0 = Math.ceil(view.xMin / xStep);
    for (let q = q0; q * xStep <= view.xMax; q++) {
      xTicks.push({ v: q * xStep, label: fmtPiTick(q * m) });
    }
  } else {
    xStep = niceStep(xr, w, 84);
    for (let v = Math.ceil(view.xMin / xStep) * xStep; v <= view.xMax; v += xStep) {
      xTicks.push({ v, label: fmtTick(v) });
    }
  }

  const yStep = niceStep(yr, h, 64);
  const yTicks: GridTick[] = [];
  for (let v = Math.ceil(view.yMin / yStep) * yStep; v <= view.yMax; v += yStep) {
    yTicks.push({ v, label: fmtTick(v) });
  }

  const xMinor: number[] = [];
  const yMinor: number[] = [];
  if (opts.minorGrid && !usePi && (xStep / 5 / xr) * w >= 9) {
    for (let v = Math.ceil(view.xMin / (xStep / 5)) * (xStep / 5); v <= view.xMax; v += xStep / 5) {
      xMinor.push(v);
    }
  }
  if (opts.minorGrid && (yStep / 5 / yr) * h >= 9) {
    for (let v = Math.ceil(view.yMin / (yStep / 5)) * (yStep / 5); v <= view.yMax; v += yStep / 5) {
      yMinor.push(v);
    }
  }
  return { xTicks, yTicks, xMinor, yMinor };
}

/** Formato numerico italiano compatto per etichette e chip. */
export function fmtIt(n: number, precision = 6): string {
  if (!Number.isFinite(n)) return '—';
  return formatResult(parseFloat(n.toPrecision(precision))).replace('.', ',');
}

/** Equazione della tangente in forma leggibile: y = 2x − 1. */
export function tangentLabel(t: Tangent): string {
  const m = fmtIt(t.m, 4);
  const q = fmtIt(Math.abs(t.q), 4);
  const sign = t.q >= 0 ? '+' : '−';
  if (t.m === 0) return `y = ${fmtIt(t.q, 4)}`;
  return `y = ${m}x ${sign} ${q}`;
}
