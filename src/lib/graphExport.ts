/**
 * Export del grafico in PNG/JPEG: ridisegno completo su canvas 2D
 * (nessuna serializzazione dell'SVG: colori concreti, niente CSS variable),
 * con intestazione nome·classe·data e legenda delle funzioni.
 */

import type { EnginePermissions } from './engine/evaluator';
import { funcLabel, type GraphScene } from './graphScene';
import {
  buildNotables,
  buildRenders,
  computeGrid,
  resolvePins,
  type GraphFeatures,
  type Pt,
} from './graphDerived';

export type ExportBackground = 'light' | 'dark' | 'transparent';

export interface ExportOptions {
  format: 'png' | 'jpeg';
  scale: 1 | 2 | 3;
  background: ExportBackground;
  /** Fascia con "Nome · classe · data" (null = niente intestazione). */
  header: { name: string; classe: string | null } | null;
  legend: boolean;
}

interface Theme {
  bg: string | null;
  gridMinor: string;
  gridMajor: string;
  axis: string;
  tick: string;
  text: string;
  band: string | null;
  pointFill: string;
}

const THEMES: Record<ExportBackground, Theme> = {
  light: {
    bg: '#fdfbf7',
    gridMinor: '#f1ece1',
    gridMajor: '#e4ddce',
    axis: '#8d8272',
    tick: '#8d8272',
    text: '#443d33',
    band: '#f6f1e7',
    pointFill: '#ffffff',
  },
  dark: {
    bg: '#211d18',
    gridMinor: '#2b2620',
    gridMajor: '#3a342b',
    axis: '#8a7f6d',
    tick: '#a89d8c',
    text: '#ece4d6',
    band: '#2a251e',
    pointFill: '#211d18',
  },
  transparent: {
    bg: null,
    gridMinor: '#ececec',
    gridMajor: '#d8d8d8',
    axis: '#8b8b8b',
    tick: '#8b8b8b',
    text: '#3c3c3c',
    band: null,
    pointFill: '#ffffff',
  },
};

const MONO = '"JetBrains Mono", ui-monospace, monospace';
const SANS = 'Inter, system-ui, sans-serif';

/** Rettangolo con angoli tondi (senza dipendere da ctx.roundRect). */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Classe dello studente dal cookie companion nc_profile (campo c, display-only). */
export function readProfileClasse(): string | null {
  const m = document.cookie.match(/(?:^|;\s*)nc_profile=([^;]+)/);
  if (!m) return null;
  try {
    const obj = JSON.parse(decodeURIComponent(m[1])) as { c?: unknown };
    return typeof obj.c === 'string' && obj.c.trim() ? obj.c.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Disegna la scena su un canvas e lo ritorna (dimensioni: base × scale
 * più le fasce di intestazione/legenda). Sincrono e senza dipendenze dal DOM
 * del plot: si può usare anche per l'anteprima nel dialog.
 */
export function renderSceneToCanvas(
  scene: GraphScene,
  permissions: EnginePermissions,
  vars: Record<string, number>,
  features: GraphFeatures,
  baseW: number,
  baseH: number,
  opts: ExportOptions
): HTMLCanvasElement {
  const k = opts.scale;
  const theme = THEMES[opts.format === 'jpeg' && opts.background === 'transparent' ? 'light' : opts.background];
  const W = Math.round(baseW * k);
  const plotH = Math.round(baseH * k);
  const headerH = opts.header ? Math.round(40 * k) : 0;

  const renders = buildRenders(scene, permissions, vars, features);
  const notables = buildNotables(scene, renders, features);
  const visible = scene.funcs.filter((f) => f.visible && f.src.trim() !== '');

  // Layout della legenda (a righe, a capo quando non ci sta).
  const measurer = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
  measurer.font = `${12 * k}px ${MONO}`;
  const legendItems = opts.legend
    ? visible.map((f) => ({ f, label: funcLabel(f), w: measurer.measureText(funcLabel(f)).width + 34 * k }))
    : [];
  const legendRows: (typeof legendItems)[] = [];
  {
    let row: typeof legendItems = [];
    let x = 0;
    for (const item of legendItems) {
      if (x + item.w > W - 24 * k && row.length > 0) {
        legendRows.push(row);
        row = [];
        x = 0;
      }
      row.push(item);
      x += item.w;
    }
    if (row.length > 0) legendRows.push(row);
  }
  const legendH = legendRows.length > 0 ? Math.round((10 + legendRows.length * 19) * k) : 0;

  const H = headerH + plotH + legendH;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  const isJpeg = opts.format === 'jpeg';
  if (theme.bg || isJpeg) {
    ctx.fillStyle = theme.bg ?? '#ffffff';
    ctx.fillRect(0, 0, W, H);
  }

  const { view } = scene;
  const px = (x: number) => ((x - view.xMin) / (view.xMax - view.xMin)) * W;
  const py = (y: number) => headerH + plotH - ((y - view.yMin) / (view.yMax - view.yMin)) * plotH;

  // ------------------------------------------------------------- Intestazione
  if (opts.header) {
    if (theme.band) {
      ctx.fillStyle = theme.band;
      ctx.fillRect(0, 0, W, headerH);
    }
    ctx.fillStyle = theme.text;
    ctx.font = `600 ${13 * k}px ${SANS}`;
    ctx.textBaseline = 'middle';
    const date = new Date();
    const dateTxt = `${date.toLocaleDateString('it-IT')} ${String(date.getHours()).padStart(2, '0')}:${String(
      date.getMinutes()
    ).padStart(2, '0')}`;
    const left = [opts.header.name, opts.header.classe, dateTxt].filter(Boolean).join('  ·  ');
    ctx.fillText(left, 12 * k, headerH / 2);
    ctx.font = `${11 * k}px ${SANS}`;
    ctx.fillStyle = theme.tick;
    const brand = 'calculator.nicolocarello.it';
    ctx.fillText(brand, W - ctx.measureText(brand).width - 12 * k, headerH / 2);
  }

  // Da qui in poi si disegna solo dentro il rettangolo del piano.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, headerH, W, plotH);
  ctx.clip();

  // ------------------------------------------------------------------ Griglia
  const grid = computeGrid(view, W, plotH, {
    piTicks: scene.piTicks,
    angleMode: scene.angleMode,
    minorGrid: scene.minorGrid,
  });

  const vline = (x: number, color: string, width: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(px(x), headerH);
    ctx.lineTo(px(x), headerH + plotH);
    ctx.stroke();
  };
  const hline = (y: number, color: string, width: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(0, py(y));
    ctx.lineTo(W, py(y));
    ctx.stroke();
  };

  if (scene.grid) {
    for (const v of grid.xMinor) vline(v, theme.gridMinor, k);
    for (const v of grid.yMinor) hline(v, theme.gridMinor, k);
    for (const t of grid.xTicks) vline(t.v, theme.gridMajor, k);
    for (const t of grid.yTicks) hline(t.v, theme.gridMajor, k);
  }

  const showXAxis = view.yMin <= 0 && view.yMax >= 0;
  const showYAxis = view.xMin <= 0 && view.xMax >= 0;
  if (showYAxis) vline(0, theme.axis, 1.5 * k);
  if (showXAxis) hline(0, theme.axis, 1.5 * k);

  const axisXpx = Math.max(2, Math.min(W - 2, px(0)));
  const axisYpx = Math.max(headerH + 2, Math.min(headerH + plotH - 2, py(0)));
  ctx.font = `${11 * k}px ${MONO}`;
  ctx.fillStyle = theme.tick;
  ctx.textBaseline = 'alphabetic';
  for (const t of grid.xTicks) {
    if (Math.abs(t.v) < 1e-12) continue;
    ctx.fillText(t.label, px(t.v) + 3 * k, Math.max(headerH + 14 * k, Math.min(headerH + plotH - 5 * k, axisYpx + 15 * k)));
  }
  for (const t of grid.yTicks) {
    if (Math.abs(t.v) < 1e-12) continue;
    ctx.fillText(t.label, Math.max(4 * k, Math.min(W - 34 * k, axisXpx + 5 * k)), py(t.v) - 4 * k);
  }
  if (showXAxis && showYAxis) ctx.fillText('0', axisXpx + 5 * k, axisYpx + 15 * k);

  // ------------------------------------------------------------------- Curve
  const yPad = view.yMax - view.yMin;
  const yLo = view.yMin - yPad;
  const yHi = view.yMax + yPad;

  const strokePts = (pts: Pt[], color: string, width: number, dash: number[], clipY: boolean) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    let started = false;
    for (const p of pts) {
      const bad = !p || (clipY && (p.y < yLo || p.y > yHi));
      if (bad) {
        started = false;
        continue;
      }
      const q = p as { x: number; y: number };
      if (started) {
        ctx.lineTo(px(q.x), py(q.y));
      } else {
        ctx.moveTo(px(q.x), py(q.y));
        started = true;
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };

  for (const r of renders) {
    if (!r.f.visible || r.pts.length === 0) continue;

    // Successioni: punti discreti.
    if (r.f.kind === 'sequence') {
      ctx.fillStyle = r.f.color;
      for (const p of r.pts) {
        if (!p) continue;
        const sx = px(p.x);
        const sy = py(p.y);
        if (sx < -20 || sx > W + 20 || sy < headerH - 20 || sy > headerH + plotH + 20) continue;
        ctx.beginPath();
        ctx.arc(sx, sy, (r.f.width + 1.2) * k, 0, Math.PI * 2);
        ctx.fill();
      }
      continue;
    }

    if (r.integral) {
      const pts = r.integral.area.filter((p): p is { x: number; y: number } => p !== null);
      if (pts.length > 1) {
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = r.f.color;
        ctx.beginPath();
        ctx.moveTo(px(pts[0].x), py(0));
        for (const p of pts) ctx.lineTo(px(p.x), py(Math.max(yLo, Math.min(yHi, p.y))));
        ctx.lineTo(px(pts[pts.length - 1].x), py(0));
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    const dash =
      r.f.style === 'dashed'
        ? [r.f.width * 3.2 * k, r.f.width * 2.6 * k]
        : r.f.style === 'dotted'
          ? [0.1, r.f.width * 2.4 * k]
          : [];
    strokePts(r.pts, r.f.color, r.f.width * k, dash, r.f.kind === 'explicit');

    if (r.dpts) {
      ctx.globalAlpha = 0.55;
      strokePts(r.dpts, r.f.color, Math.max(1.2, r.f.width - 1) * k, [6 * k, 5 * k], true);
      ctx.globalAlpha = 1;
    }

    if (r.tangent) {
      const t = r.tangent;
      ctx.globalAlpha = 0.8;
      strokePts(
        [
          { x: view.xMin, y: t.m * view.xMin + t.q },
          { x: view.xMax, y: t.m * view.xMax + t.q },
        ],
        r.f.color,
        1.4 * k,
        [9 * k, 6 * k],
        false
      );
      ctx.globalAlpha = 1;
      ctx.fillStyle = r.f.color;
      ctx.beginPath();
      ctx.arc(px(t.x0), py(t.y0), 5 * k, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const n of notables) {
    ctx.fillStyle = theme.pointFill;
    ctx.strokeStyle = n.color;
    ctx.lineWidth = 2.2 * k;
    ctx.beginPath();
    ctx.arc(px(n.x), py(n.y), 4.5 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Pin: le etichette fissate finiscono anche nell'immagine.
  const pins = resolvePins(scene, notables);
  ctx.font = `${11.5 * k}px ${MONO}`;
  ctx.textBaseline = 'middle';
  for (const p of pins) {
    const cx = px(p.x);
    const cy = py(p.y);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1.6 * k;
    ctx.beginPath();
    ctx.arc(cx, cy, 8 * k, 0, Math.PI * 2);
    ctx.stroke();

    const tw = ctx.measureText(p.text).width;
    const pad = 5 * k;
    const bh = 18 * k;
    let bx = cx + 11 * k;
    let by = cy - 26 * k;
    if (bx + tw + pad * 2 > W - 4 * k) bx = cx - tw - pad * 2 - 11 * k;
    if (by < headerH + 4 * k) by = cy + 12 * k;
    ctx.fillStyle = theme.bg ?? '#ffffff';
    ctx.globalAlpha = 0.92;
    roundRect(ctx, bx, by, tw + pad * 2, bh, 5 * k);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = k;
    roundRect(ctx, bx, by, tw + pad * 2, bh, 5 * k);
    ctx.stroke();
    ctx.fillStyle = theme.text;
    ctx.fillText(p.text, bx + pad, by + bh / 2);
  }

  ctx.restore();

  // ------------------------------------------------------------------ Legenda
  if (legendRows.length > 0) {
    let y = headerH + plotH + 10 * k;
    ctx.font = `${12 * k}px ${MONO}`;
    ctx.textBaseline = 'middle';
    for (const row of legendRows) {
      let x = 12 * k;
      for (const item of row) {
        ctx.strokeStyle = item.f.color;
        ctx.lineWidth = 3 * k;
        ctx.setLineDash(
          item.f.style === 'dashed' ? [6 * k, 4 * k] : item.f.style === 'dotted' ? [0.1, 5 * k] : []
        );
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y + 9 * k);
        ctx.lineTo(x + 18 * k, y + 9 * k);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = theme.text;
        ctx.fillText(item.label, x + 24 * k, y + 9 * k);
        x += item.w;
      }
      y += 19 * k;
    }
  }

  return canvas;
}

/** Nome file suggerito: grafico_2026-07-21_1532.png */
export function exportFilename(format: 'png' | 'jpeg'): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  return `grafico_${stamp}.${format === 'png' ? 'png' : 'jpg'}`;
}

/** Scarica il canvas come file immagine. */
export function downloadCanvas(canvas: HTMLCanvasElement, format: 'png' | 'jpeg'): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Esportazione non riuscita'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportFilename(format);
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 4000);
        resolve();
      },
      format === 'png' ? 'image/png' : 'image/jpeg',
      0.92
    );
  });
}
