/**
 * Scena della modalità Grafici: funzioni sovrapposte con stile proprio,
 * slider dei parametri, finestra di vista e opzioni del piano.
 * È il modello che si salva (autosave locale + voci di cronologia).
 */

import type { AngleMode } from './engine/evaluator';

export type CurveKind = 'explicit' | 'parametric' | 'polar' | 'sequence';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export type PinKind = 'zero' | 'max' | 'min' | 'intersection';

/**
 * Punto notevole "appuntato": l'etichetta con le coordinate resta visibile
 * (anche nell'export). Si riaggancia al punto corrente più vicino dello
 * stesso tipo, così segue la funzione quando cambia poco; se sparisce, decade.
 */
export interface ScenePin {
  kind: PinKind;
  /** id della funzione a cui appartiene il punto. */
  fid: string;
  x: number;
}

export interface GraphFunction {
  id: string;
  kind: CurveKind;
  /** f(x) per le esplicite, x(t) per le parametriche, r(θ) per le polari. */
  src: string;
  /** y(t) — solo parametriche. */
  srcY: string;
  color: string;
  width: number;
  style: StrokeStyle;
  visible: boolean;
  /** Dominio del parametro t/θ (parametriche e polari). */
  tMin: number;
  tMax: number;
  /** Overlay derivata f′ (solo esplicite). */
  derivative: boolean;
  /** Retta tangente in tangentX (solo esplicite). */
  tangent: boolean;
  tangentX: number;
  /** Area/integrale su [intA, intB] (solo esplicite). */
  integral: boolean;
  intA: number;
  intB: number;
}

export interface SliderDef {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  playing: boolean;
}

export interface ViewWindow {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface GraphScene {
  funcs: GraphFunction[];
  sliders: SliderDef[];
  view: ViewWindow;
  angleMode: AngleMode;
  grid: boolean;
  minorGrid: boolean;
  piTicks: boolean;
  /** Punti notevoli calcolati su tutte le esplicite visibili. */
  tools: { zeros: boolean; extrema: boolean; intersections: boolean };
  /** Etichette fissate con un clic sui punti notevoli. */
  pins: ScenePin[];
}

/** Tavolozza delle curve (hex concreti: servono identici anche nell'export). */
export const PALETTE = [
  '#e8590c', // arancio
  '#1c7ed6', // blu
  '#2f9e44', // verde
  '#9c36b5', // viola
  '#e03131', // rosso
  '#0ca678', // verde acqua
  '#f08c00', // ambra
  '#6741d9', // indaco
] as const;

export const MAX_FUNCS = 8;

let idCounter = 0;

export function newFunctionId(): string {
  idCounter += 1;
  return `f${Date.now().toString(36)}-${idCounter}`;
}

export function makeFunction(partial: Partial<GraphFunction> & { color: string }): GraphFunction {
  return {
    id: newFunctionId(),
    kind: 'explicit',
    src: '',
    srcY: '',
    width: 2.5,
    style: 'solid',
    visible: true,
    tMin: 0,
    tMax: Math.round(2 * Math.PI * 100) / 100,
    derivative: false,
    tangent: false,
    tangentX: 1,
    integral: false,
    intA: 0,
    intB: 2,
    ...partial,
  };
}

export const DEFAULT_VIEW: ViewWindow = { xMin: -10, xMax: 10, yMin: -6.25, yMax: 6.25 };

export function defaultScene(firstSrc = 'sin(x)'): GraphScene {
  return {
    funcs: [makeFunction({ color: PALETTE[0], src: firstSrc })],
    sliders: [],
    view: { ...DEFAULT_VIEW },
    angleMode: 'rad',
    grid: true,
    minorGrid: true,
    piTicks: false,
    tools: { zeros: false, extrema: false, intersections: false },
    pins: [],
  };
}

/** Primo colore della tavolozza non ancora usato (poi ricicla). */
export function nextColor(funcs: GraphFunction[]): string {
  const used = new Set(funcs.map((f) => f.color));
  for (const c of PALETTE) if (!used.has(c)) return c;
  return PALETTE[funcs.length % PALETTE.length];
}

// ------------------------------------------------------------- Sanitizzazione

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function str(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback;
}

function sanitizeFunc(raw: unknown, index: number): GraphFunction | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const kind: CurveKind =
    r.kind === 'parametric' || r.kind === 'polar' || r.kind === 'sequence'
      ? (r.kind as CurveKind)
      : 'explicit';
  const style: StrokeStyle =
    r.style === 'dashed' || r.style === 'dotted' ? (r.style as StrokeStyle) : 'solid';
  const base = makeFunction({
    kind,
    style,
    src: str(r.src, '').slice(0, 400),
    srcY: str(r.srcY, '').slice(0, 400),
    color: /^#[0-9a-fA-F]{6}$/.test(str(r.color, '')) ? (r.color as string) : PALETTE[index % PALETTE.length],
    width: [1.5, 2.5, 4].includes(num(r.width, 2.5)) ? num(r.width, 2.5) : 2.5,
    visible: bool(r.visible, true),
    tMin: num(r.tMin, 0),
    tMax: num(r.tMax, 6.28),
    derivative: bool(r.derivative, false),
    tangent: bool(r.tangent, false),
    tangentX: num(r.tangentX, 1),
    integral: bool(r.integral, false),
    intA: num(r.intA, 0),
    intB: num(r.intB, 2),
  });
  if (typeof r.id === 'string' && r.id.length > 0 && r.id.length <= 40) base.id = r.id;
  return base;
}

/**
 * Riporta un JSON qualsiasi (storage o cronologia) a una scena valida.
 * Ritorna null solo se non c'è proprio nulla di usabile.
 */
export function sanitizeScene(raw: unknown): GraphScene | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const rawFuncs = Array.isArray(r.funcs) ? r.funcs : [];
  const funcs = rawFuncs
    .slice(0, MAX_FUNCS)
    .map((f, i) => sanitizeFunc(f, i))
    .filter((f): f is GraphFunction => f !== null);
  if (funcs.length === 0) return null;

  const ids = new Set<string>();
  for (const f of funcs) {
    if (ids.has(f.id)) f.id = newFunctionId();
    ids.add(f.id);
  }

  const rawSliders = Array.isArray(r.sliders) ? r.sliders : [];
  const sliders: SliderDef[] = [];
  for (const s of rawSliders.slice(0, 12)) {
    if (!s || typeof s !== 'object') continue;
    const o = s as Record<string, unknown>;
    const name = str(o.name, '');
    if (!/^[a-zA-Z]$/.test(name) || sliders.some((x) => x.name === name)) continue;
    const min = num(o.min, -5);
    const max = num(o.max, 5);
    sliders.push({
      name,
      min: Math.min(min, max),
      max: Math.max(min, max),
      step: Math.abs(num(o.step, 0.1)) || 0.1,
      value: num(o.value, 1),
      playing: false,
    });
  }

  const v = (r.view ?? {}) as Record<string, unknown>;
  let xMin = num(v.xMin, DEFAULT_VIEW.xMin);
  let xMax = num(v.xMax, DEFAULT_VIEW.xMax);
  let yMin = num(v.yMin, DEFAULT_VIEW.yMin);
  let yMax = num(v.yMax, DEFAULT_VIEW.yMax);
  if (!(xMax > xMin)) [xMin, xMax] = [DEFAULT_VIEW.xMin, DEFAULT_VIEW.xMax];
  if (!(yMax > yMin)) [yMin, yMax] = [DEFAULT_VIEW.yMin, DEFAULT_VIEW.yMax];

  const t = (r.tools ?? {}) as Record<string, unknown>;

  const rawPins = Array.isArray(r.pins) ? r.pins : [];
  const pins: ScenePin[] = [];
  for (const p of rawPins.slice(0, 40)) {
    if (!p || typeof p !== 'object') continue;
    const o = p as Record<string, unknown>;
    const kind = o.kind;
    if (kind !== 'zero' && kind !== 'max' && kind !== 'min' && kind !== 'intersection') continue;
    const fid = str(o.fid, '');
    const x = num(o.x, NaN);
    if (!fid || !Number.isFinite(x)) continue;
    pins.push({ kind, fid, x });
  }

  return {
    funcs,
    sliders,
    view: { xMin, xMax, yMin, yMax },
    angleMode: r.angleMode === 'deg' ? 'deg' : 'rad',
    grid: bool(r.grid, true),
    minorGrid: bool(r.minorGrid, true),
    piTicks: bool(r.piTicks, false),
    tools: {
      zeros: bool(t.zeros, false),
      extrema: bool(t.extrema, false),
      intersections: bool(t.intersections, false),
    },
    pins,
  };
}

/** Etichetta della funzione per elenchi/legenda (es. "y = sin(x)"). */
export function funcLabel(f: GraphFunction): string {
  if (f.kind === 'parametric') return `x = ${f.src || '…'} · y = ${f.srcY || '…'}`;
  if (f.kind === 'polar') return `r = ${f.src || '…'}`;
  if (f.kind === 'sequence') return `aₙ = ${f.src || '…'}`;
  return `y = ${f.src || '…'}`;
}

/** Riassunto della scena per la voce di cronologia. */
export function sceneSummary(scene: GraphScene): { expr: string; result: string } {
  const visible = scene.funcs.filter((f) => f.src.trim() !== '');
  const first = visible[0] ? funcLabel(visible[0]) : 'grafico';
  const extra = visible.length > 1 ? ` (+${visible.length - 1})` : '';
  const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');
  return {
    expr: `${first}${extra}`,
    result: `x ∈ [${fmt(scene.view.xMin)}; ${fmt(scene.view.xMax)}]`,
  };
}
