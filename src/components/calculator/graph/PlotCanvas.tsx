import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid, RotateCcw, Scan, ZoomIn, ZoomOut } from 'lucide-react';
import type { GraphSceneStore } from '../../../hooks/useGraphScene';
import type { ViewWindow } from '../../../lib/graphScene';
import {
  computeGrid,
  fmtIt,
  tangentLabel,
  type CurveRender,
  type NotablePt,
  type Pt,
} from '../../../lib/graphDerived';

interface Props {
  store: GraphSceneStore;
  renders: CurveRender[];
  notables: NotablePt[];
}

interface Size {
  w: number;
  h: number;
}

type Drag =
  | { type: 'pan'; view0: ViewWindow; sx: number; sy: number }
  | { type: 'pinch'; view0: ViewWindow; d0: number; mx: number; my: number }
  | { type: 'handle'; handle: string };

interface Trace {
  sx: number;
  sy: number;
  text: string;
  color: string;
}

function safeEval(fn: (x: number) => number, x: number): number {
  try {
    const y = fn(x);
    return Number.isFinite(y) ? y : NaN;
  } catch {
    return NaN;
  }
}

const MONO = 'JetBrains Mono, monospace';

/** Piano cartesiano interattivo: pan, zoom (rotella/pinch), trace, maniglie. */
export function PlotCanvas({ store, renders, notables }: Props) {
  const { scene, setScene, setView, patchFunc } = store;
  const { view } = scene;
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<Size>({ w: 800, h: 520 });
  const [trace, setTrace] = useState<Trace | null>(null);
  const drag = useRef<Drag | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  // Dimensioni reali del contenitore → SVG a coordinate pixel.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r && r.width > 40 && r.height > 40) {
        setSize({ w: Math.round(r.width), h: Math.round(r.height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  const px = useCallback(
    (x: number) => ((x - view.xMin) / (view.xMax - view.xMin)) * w,
    [view, w]
  );
  const py = useCallback(
    (y: number) => h - ((y - view.yMin) / (view.yMax - view.yMin)) * h,
    [view, h]
  );
  const worldX = useCallback(
    (sx: number) => view.xMin + (sx / w) * (view.xMax - view.xMin),
    [view, w]
  );
  const worldY = useCallback(
    (sy: number) => view.yMin + ((h - sy) / h) * (view.yMax - view.yMin),
    [view, h]
  );

  // ------------------------------------------------------------- Griglia/assi
  const grid = useMemo(
    () =>
      computeGrid(view, w, h, {
        piTicks: scene.piTicks,
        angleMode: scene.angleMode,
        minorGrid: scene.minorGrid,
      }),
    [view, w, h, scene.piTicks, scene.minorGrid, scene.angleMode]
  );

  // --------------------------------------------------------------- Tracciati
  const paths = useMemo(() => {
    const yPad = view.yMax - view.yMin;
    const yLo = view.yMin - yPad;
    const yHi = view.yMax + yPad;

    const toSegments = (pts: Pt[], clipY: boolean): string[] => {
      const segs: string[] = [];
      let d = '';
      for (const p of pts) {
        const bad =
          !p ||
          (clipY && (p.y < yLo || p.y > yHi)) ||
          Math.abs(px(p.x)) > 50000 ||
          Math.abs(py(p.y)) > 50000;
        if (bad) {
          if (d) segs.push(d);
          d = '';
          continue;
        }
        const pt = p as { x: number; y: number };
        d += `${d ? 'L' : 'M'}${px(pt.x).toFixed(1)} ${py(pt.y).toFixed(1)}`;
      }
      if (d) segs.push(d);
      return segs;
    };

    return renders.map((r) => {
      const main = toSegments(r.pts, r.f.kind === 'explicit');
      const deriv = r.dpts ? toSegments(r.dpts, true) : [];
      let areaPath = '';
      if (r.integral) {
        const pts = r.integral.area.filter((p): p is { x: number; y: number } => p !== null);
        if (pts.length > 1) {
          const clampY = (y: number) => Math.max(yLo, Math.min(yHi, y));
          areaPath =
            `M${px(pts[0].x).toFixed(1)} ${py(0).toFixed(1)}` +
            pts.map((p) => `L${px(p.x).toFixed(1)} ${py(clampY(p.y)).toFixed(1)}`).join('') +
            `L${px(pts[pts.length - 1].x).toFixed(1)} ${py(0).toFixed(1)}Z`;
        }
      }
      return { r, main, deriv, areaPath };
    });
  }, [renders, view, px, py]);

  // ------------------------------------------------------------ Interazione
  const applyZoom = useCallback(
    (cx: number, cy: number, factor: number) => {
      const clamp = (r: number) => Math.max(1e-7, Math.min(1e7, r));
      const nxr = clamp((view.xMax - view.xMin) * factor);
      const nyr = clamp((view.yMax - view.yMin) * factor);
      const fx = (cx - view.xMin) / (view.xMax - view.xMin);
      const fy = (cy - view.yMin) / (view.yMax - view.yMin);
      setView({
        xMin: cx - fx * nxr,
        xMax: cx + (1 - fx) * nxr,
        yMin: cy - fy * nyr,
        yMax: cy + (1 - fy) * nyr,
      });
    },
    [view, setView]
  );

  // Rotella: zoom centrato sul cursore (listener non-passivo per preventDefault).
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = worldX(e.clientX - rect.left);
      const cy = worldY(e.clientY - rect.top);
      applyZoom(cx, cy, Math.exp(e.deltaY * 0.0012));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [worldX, worldY, applyZoom]);

  const localPoint = (e: React.PointerEvent): { x: number; y: number } => {
    const rect = (svgRef.current as SVGSVGElement).getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const p = localPoint(e);
    pointers.current.set(e.pointerId, p);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const handle = (e.target as Element).getAttribute?.('data-handle');
    if (handle && pointers.current.size === 1) {
      drag.current = { type: 'handle', handle };
      return;
    }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      drag.current = {
        type: 'pinch',
        view0: { ...view },
        d0: Math.hypot(a.x - b.x, a.y - b.y),
        mx: (a.x + b.x) / 2,
        my: (a.y + b.y) / 2,
      };
    } else {
      drag.current = { type: 'pan', view0: { ...view }, sx: p.x, sy: p.y };
    }
    setTrace(null);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = localPoint(e);
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, p);
    const d = drag.current;

    if (d?.type === 'handle') {
      const [kind, id] = d.handle.split(':');
      const x = worldX(p.x);
      if (kind === 'tan') patchFunc(id, { tangentX: x });
      if (kind === 'ia') patchFunc(id, { intA: Math.round(x * 1000) / 1000 });
      if (kind === 'ib') patchFunc(id, { intB: Math.round(x * 1000) / 1000 });
      return;
    }
    if (d?.type === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist > 8) {
        const factor = d.d0 / dist;
        const v0 = d.view0;
        const cx = v0.xMin + (d.mx / w) * (v0.xMax - v0.xMin);
        const cy = v0.yMin + ((h - d.my) / h) * (v0.yMax - v0.yMin);
        const nxr = (v0.xMax - v0.xMin) * factor;
        const nyr = (v0.yMax - v0.yMin) * factor;
        const fx = (cx - v0.xMin) / (v0.xMax - v0.xMin);
        const fy = (cy - v0.yMin) / (v0.yMax - v0.yMin);
        setView({
          xMin: cx - fx * nxr,
          xMax: cx + (1 - fx) * nxr,
          yMin: cy - fy * nyr,
          yMax: cy + (1 - fy) * nyr,
        });
      }
      return;
    }
    if (d?.type === 'pan') {
      const dx = ((p.x - d.sx) / w) * (d.view0.xMax - d.view0.xMin);
      const dy = ((p.y - d.sy) / h) * (d.view0.yMax - d.view0.yMin);
      setView({
        xMin: d.view0.xMin - dx,
        xMax: d.view0.xMax - dx,
        yMin: d.view0.yMin + dy,
        yMax: d.view0.yMax + dy,
      });
      return;
    }

    // Trace: punto più vicino sotto il cursore (con snap ai punti notevoli).
    let best: Trace | null = null;
    let bestDist = 26;
    for (const n of notables) {
      const dd = Math.hypot(px(n.x) - p.x, py(n.y) - p.y);
      if (dd < 15 && dd < bestDist) {
        bestDist = dd;
        best = {
          sx: px(n.x),
          sy: py(n.y),
          color: n.color,
          text: `${n.label} (${fmtIt(n.x, 4)}; ${fmtIt(n.y, 4)})`,
        };
      }
    }
    if (!best) {
      const xw = worldX(p.x);
      for (const r of renders) {
        if (!r.f.visible || r.error) continue;
        if (r.fn) {
          const yw = safeEval(r.fn, xw);
          if (Number.isNaN(yw)) continue;
          const dd = Math.abs(py(yw) - p.y);
          if (dd < bestDist) {
            bestDist = dd;
            best = {
              sx: p.x,
              sy: py(yw),
              color: r.f.color,
              text: `(${fmtIt(xw, 4)}; ${fmtIt(yw, 4)})`,
            };
          }
        } else if (r.pts.length > 0) {
          for (let i = 0; i < r.pts.length; i += 2) {
            const q = r.pts[i];
            if (!q) continue;
            const dd = Math.hypot(px(q.x) - p.x, py(q.y) - p.y);
            if (dd < bestDist) {
              bestDist = dd;
              best = {
                sx: px(q.x),
                sy: py(q.y),
                color: r.f.color,
                text: `(${fmtIt(q.x, 4)}; ${fmtIt(q.y, 4)})`,
              };
            }
          }
        }
      }
    }
    setTrace(best);
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      drag.current = null;
    } else if (pointers.current.size === 1) {
      const [p] = [...pointers.current.values()];
      drag.current = { type: 'pan', view0: { ...view }, sx: p.x, sy: p.y };
    }
  };

  // --------------------------------------------------------- Azioni toolbar
  const fitView = () => {
    const ys: number[] = [];
    const xsFree: number[] = [];
    let hasExplicit = false;
    for (const r of renders) {
      if (!r.f.visible || r.error) continue;
      if (r.f.kind === 'explicit') hasExplicit = true;
      for (const p of r.pts) {
        if (!p) continue;
        ys.push(p.y);
        if (r.f.kind !== 'explicit') xsFree.push(p.x);
      }
    }
    if (ys.length === 0) return;
    const sorted = [...ys].sort((a, b) => a - b);
    let lo = sorted[Math.floor(0.02 * (sorted.length - 1))];
    let hi = sorted[Math.ceil(0.98 * (sorted.length - 1))];
    if (lo === hi) {
      lo -= 1;
      hi += 1;
    } else {
      const pad = (hi - lo) * 0.12;
      lo -= pad;
      hi += pad;
    }
    let { xMin, xMax } = view;
    if (!hasExplicit && xsFree.length > 0) {
      let xlo = Math.min(...xsFree);
      let xhi = Math.max(...xsFree);
      const pad = xlo === xhi ? 1 : (xhi - xlo) * 0.12;
      xlo -= pad;
      xhi += pad;
      xMin = xlo;
      xMax = xhi;
    }
    setView({ xMin, xMax, yMin: lo, yMax: hi });
  };

  const resetView = () => {
    const yr = (20 * h) / w / 2;
    setView({ xMin: -10, xMax: 10, yMin: -yr, yMax: yr });
  };

  const equalAspect = () => {
    const xr = view.xMax - view.xMin;
    const yr = (xr * h) / w;
    const cy = (view.yMin + view.yMax) / 2;
    setView({ ...view, yMin: cy - yr / 2, yMax: cy + yr / 2 });
  };

  const zoomCenter = (factor: number) =>
    applyZoom((view.xMin + view.xMax) / 2, (view.yMin + view.yMax) / 2, factor);

  const axisXpx = Math.max(2, Math.min(w - 2, px(0)));
  const axisYpx = Math.max(2, Math.min(h - 2, py(0)));
  const showXAxis = view.yMin <= 0 && view.yMax >= 0;
  const showYAxis = view.xMin <= 0 && view.xMax >= 0;
  const hasContent = renders.some((r) => r.f.visible && r.pts.length > 0);

  const dashFor = (style: string, width: number): string | undefined =>
    style === 'dashed' ? `${width * 3.2} ${width * 2.6}` : style === 'dotted' ? `0.1 ${width * 2.4}` : undefined;

  return (
    <div className="plot-wrap" ref={wrapRef}>
      <svg
        ref={svgRef}
        className="plot-svg"
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Piano cartesiano"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={(e) => {
          endPointer(e);
          setTrace(null);
        }}
      >
        {/* Griglia */}
        {scene.grid && (
          <g>
            {grid.xMinor.map((v) => (
              <line key={`xm${v}`} x1={px(v)} y1={0} x2={px(v)} y2={h} className="plot-grid-minor" />
            ))}
            {grid.yMinor.map((v) => (
              <line key={`ym${v}`} x1={0} y1={py(v)} x2={w} y2={py(v)} className="plot-grid-minor" />
            ))}
            {grid.xTicks.map((t) => (
              <line key={`xg${t.v}`} x1={px(t.v)} y1={0} x2={px(t.v)} y2={h} className="plot-grid-major" />
            ))}
            {grid.yTicks.map((t) => (
              <line key={`yg${t.v}`} x1={0} y1={py(t.v)} x2={w} y2={py(t.v)} className="plot-grid-major" />
            ))}
          </g>
        )}

        {/* Assi */}
        {showYAxis && <line x1={axisXpx} y1={0} x2={axisXpx} y2={h} className="plot-axis" />}
        {showXAxis && <line x1={0} y1={axisYpx} x2={w} y2={axisYpx} className="plot-axis" />}

        {/* Etichette dei tick */}
        {grid.xTicks.map((t) =>
          Math.abs(t.v) < 1e-12 ? null : (
            <text
              key={`xl${t.v}`}
              x={px(t.v) + 3}
              y={Math.max(14, Math.min(h - 5, axisYpx + 15))}
              fontSize="11"
              fontFamily={MONO}
              className="plot-tick"
            >
              {t.label}
            </text>
          )
        )}
        {grid.yTicks.map((t) =>
          Math.abs(t.v) < 1e-12 ? null : (
            <text
              key={`yl${t.v}`}
              x={Math.max(4, Math.min(w - 34, axisXpx + 5))}
              y={py(t.v) - 4}
              fontSize="11"
              fontFamily={MONO}
              className="plot-tick"
            >
              {t.label}
            </text>
          )
        )}
        {showXAxis && showYAxis && (
          <text x={axisXpx + 5} y={axisYpx + 15} fontSize="11" fontFamily={MONO} className="plot-tick">
            0
          </text>
        )}

        {/* Aree (integrali) sotto le curve */}
        {paths.map(
          ({ r, areaPath }) =>
            areaPath && (
              <path key={`area${r.f.id}`} d={areaPath} fill={r.f.color} opacity={0.16} stroke="none" />
            )
        )}

        {/* Curve */}
        {paths.map(({ r, main }) =>
          main.map((d, i) => (
            <path
              key={`c${r.f.id}-${i}`}
              d={d}
              fill="none"
              stroke={r.f.color}
              strokeWidth={r.f.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={dashFor(r.f.style, r.f.width)}
            />
          ))
        )}

        {/* Derivate (tratteggio leggero, stesso colore) */}
        {paths.map(({ r, deriv }) =>
          deriv.map((d, i) => (
            <path
              key={`d${r.f.id}-${i}`}
              d={d}
              fill="none"
              stroke={r.f.color}
              strokeWidth={Math.max(1.2, r.f.width - 1)}
              strokeDasharray="6 5"
              opacity={0.55}
            />
          ))
        )}

        {/* Tangenti */}
        {renders.map((r) => {
          if (!r.tangent) return null;
          const t = r.tangent;
          const y1 = t.m * view.xMin + t.q;
          const y2 = t.m * view.xMax + t.q;
          return (
            <g key={`t${r.f.id}`}>
              <line
                x1={px(view.xMin)}
                y1={py(y1)}
                x2={px(view.xMax)}
                y2={py(y2)}
                stroke={r.f.color}
                strokeWidth={1.4}
                strokeDasharray="9 6"
                opacity={0.8}
              />
              <circle
                cx={px(t.x0)}
                cy={py(t.y0)}
                r={7}
                fill={r.f.color}
                stroke="#fff"
                strokeWidth={2}
                data-handle={`tan:${r.f.id}`}
                className="plot-handle"
              />
            </g>
          );
        })}

        {/* Maniglie degli integrali */}
        {renders.map((r) => {
          if (!r.integral || !r.f.integral) return null;
          return (
            <g key={`ih${r.f.id}`}>
              {(['ia', 'ib'] as const).map((kind) => {
                const x = kind === 'ia' ? r.f.intA : r.f.intB;
                return (
                  <g key={kind}>
                    <line
                      x1={px(x)}
                      y1={0}
                      x2={px(x)}
                      y2={h}
                      stroke={r.f.color}
                      strokeWidth={1}
                      strokeDasharray="3 5"
                      opacity={0.5}
                    />
                    <circle
                      cx={px(x)}
                      cy={axisYpx}
                      r={6.5}
                      fill="#fff"
                      stroke={r.f.color}
                      strokeWidth={2.4}
                      data-handle={`${kind}:${r.f.id}`}
                      className="plot-handle"
                    />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Punti notevoli */}
        {notables.map((n, i) => (
          <circle
            key={`n${i}`}
            cx={px(n.x)}
            cy={py(n.y)}
            r={4.5}
            className="plot-notable"
            stroke={n.color}
          />
        ))}

        {/* Trace */}
        {trace && (
          <circle cx={trace.sx} cy={trace.sy} r={5} fill={trace.color} stroke="#fff" strokeWidth={2} />
        )}
      </svg>

      {/* Tooltip trace + chip informativi */}
      {trace && (
        <div
          className="plot-tip"
          style={{
            left: Math.min(w - 150, Math.max(4, trace.sx + 12)),
            top: Math.max(4, trace.sy - 34),
            borderColor: trace.color,
          }}
        >
          {trace.text}
        </div>
      )}
      {renders.map((r) =>
        r.tangent ? (
          <div
            key={`tc${r.f.id}`}
            className="plot-chip"
            style={{
              left: Math.min(w - 170, Math.max(4, px(r.tangent.x0) + 12)),
              top: Math.min(h - 30, Math.max(4, py(r.tangent.y0) + 14)),
              borderColor: r.f.color,
            }}
          >
            {tangentLabel(r.tangent)}
          </div>
        ) : null
      )}
      {renders.map((r) =>
        r.integral ? (
          <div
            key={`ic${r.f.id}`}
            className="plot-chip"
            style={{
              left: Math.min(w - 170, Math.max(4, (px(r.f.intA) + px(r.f.intB)) / 2 - 40)),
              top: Math.min(h - 30, axisYpx + 12),
              borderColor: r.f.color,
            }}
          >
            ∫ ≈ {fmtIt(r.integral.value, 6)}
          </div>
        ) : null
      )}

      {/* Toolbar del piano */}
      <div className="plot-tools">
        <button type="button" className="plot-tool" title="Avvicina" onClick={() => zoomCenter(0.6)}>
          <ZoomIn size={15} />
        </button>
        <button type="button" className="plot-tool" title="Allarga" onClick={() => zoomCenter(1 / 0.6)}>
          <ZoomOut size={15} />
        </button>
        <button type="button" className="plot-tool" title="Adatta la vista alle curve" onClick={fitView}>
          <Scan size={15} />
        </button>
        <button type="button" className="plot-tool" title="Torna alla vista iniziale" onClick={resetView}>
          <RotateCcw size={15} />
        </button>
        <button type="button" className="plot-tool plot-tool-txt" title="Stessa scala su x e y" onClick={equalAspect}>
          1:1
        </button>
        <button
          type="button"
          className={`plot-tool plot-tool-txt${scene.piTicks && scene.angleMode === 'rad' ? ' active' : ''}`}
          title="Tick dell'asse x in multipli di π (solo RAD)"
          disabled={scene.angleMode !== 'rad'}
          onClick={() => setScene((s) => ({ ...s, piTicks: !s.piTicks }))}
        >
          π
        </button>
        <button
          type="button"
          className={`plot-tool${scene.grid ? ' active' : ''}`}
          title="Griglia"
          onClick={() => setScene((s) => ({ ...s, grid: !s.grid }))}
        >
          <LayoutGrid size={15} />
        </button>
      </div>

      {!hasContent && (
        <div className="plot-empty">
          Scrivi una funzione nel pannello a sinistra per tracciarla.
          <br />
          <span>Trascina per spostarti, rotella o pizzico per lo zoom.</span>
        </div>
      )}
    </div>
  );
}
