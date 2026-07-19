import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { sampleFunction } from '../../lib/engine/graph';
import { CalcError, type AngleMode } from '../../lib/engine/evaluator';
import { enginePermissions, type CalcConfig } from '../../lib/config';

interface Props {
  config: CalcConfig;
}

const W = 640;
const H = 400;

/** Passo "bello" per la griglia (1, 2 o 5 × 10^k). */
function niceStep(range: number): number {
  const rough = range / 8;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  if (norm < 1.5) return mag;
  if (norm < 3.5) return 2 * mag;
  if (norm < 7.5) return 5 * mag;
  return 10 * mag;
}

function fmtTick(v: number): string {
  const r = Math.round(v * 1e9) / 1e9;
  if (Math.abs(r) >= 1e6 || (r !== 0 && Math.abs(r) < 1e-4)) return r.toExponential(0);
  return String(r).replace('.', ',');
}

/** Grafico di y = f(x): stesso motore (e stessi permessi) della calcolatrice. */
export function GraphPanel({ config }: Props) {
  const [src, setSrc] = useState('');
  const [angleMode, setAngleMode] = useState<AngleMode>('rad');
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [debounced, setDebounced] = useState(src);

  const permissions = useMemo(() => enginePermissions(config), [config]);

  // Espressione iniziale: la prima consentita dalla configurazione.
  useEffect(() => {
    if (src !== '') return;
    const candidates = ['sin(x)', 'x^2', 'x+1'];
    for (const c of candidates) {
      try {
        sampleFunction(c, { angleMode, permissions, xMin: -10, xMax: 10, samples: 8 });
        setSrc(c);
        setDebounced(c);
        return;
      } catch {
        // prova la successiva
      }
    }
    setSrc('x');
    setDebounced('x');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(src), 280);
    return () => window.clearTimeout(t);
  }, [src]);

  const sample = useMemo(() => {
    if (!debounced.trim()) return { error: 'Scrivi una funzione di x' };
    try {
      return { data: sampleFunction(debounced, { angleMode, permissions, xMin, xMax }) };
    } catch (e) {
      return { error: e instanceof CalcError ? e.message : 'Errore' };
    }
  }, [debounced, angleMode, permissions, xMin, xMax]);

  const zoom = (factor: number) => {
    const mid = (xMin + xMax) / 2;
    const half = ((xMax - xMin) / 2) * factor;
    setXMin(Math.round((mid - half) * 1e6) / 1e6);
    setXMax(Math.round((mid + half) * 1e6) / 1e6);
  };

  const view = useMemo(() => {
    if (!('data' in sample) || !sample.data) return null;
    const { points, yMin, yMax } = sample.data;
    const px = (x: number) => ((x - xMin) / (xMax - xMin)) * W;
    const py = (y: number) => H - ((y - yMin) / (yMax - yMin)) * H;

    const segments: string[] = [];
    let d = '';
    for (const p of points) {
      if (!p || p.y < yMin - (yMax - yMin) || p.y > yMax + (yMax - yMin)) {
        if (d) segments.push(d);
        d = '';
        continue;
      }
      const cmd = d ? 'L' : 'M';
      d += `${cmd}${px(p.x).toFixed(1)} ${py(p.y).toFixed(1)}`;
    }
    if (d) segments.push(d);

    const xs: number[] = [];
    const sx = niceStep(xMax - xMin);
    for (let v = Math.ceil(xMin / sx) * sx; v <= xMax; v += sx) xs.push(v);
    const ys: number[] = [];
    const sy = niceStep(yMax - yMin);
    for (let v = Math.ceil(yMin / sy) * sy; v <= yMax; v += sy) ys.push(v);

    return { segments, px, py, xs, ys, yMin, yMax };
  }, [sample, xMin, xMax]);

  return (
    <div>
      <div className="graph-form">
        <div className="field" style={{ flexBasis: 240 }}>
          <label htmlFor="graph-src">y =</label>
          <input
            id="graph-src"
            type="text"
            value={src}
            onChange={(e) => setSrc(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            placeholder="es. sin(x) + x/2"
          />
        </div>
        <div className="field field-sm">
          <label htmlFor="graph-xmin">x min</label>
          <input
            id="graph-xmin"
            type="number"
            value={xMin}
            onChange={(e) => setXMin(Number(e.target.value))}
          />
        </div>
        <div className="field field-sm">
          <label htmlFor="graph-xmax">x max</label>
          <input
            id="graph-xmax"
            type="number"
            value={xMax}
            onChange={(e) => setXMax(Number(e.target.value))}
          />
        </div>
        <div className="seg" role="radiogroup" aria-label="Unità angoli">
          <button
            type="button"
            className={`seg-btn${angleMode === 'rad' ? ' active' : ''}`}
            onClick={() => setAngleMode('rad')}
          >
            RAD
          </button>
          <button
            type="button"
            className={`seg-btn${angleMode === 'deg' ? ' active' : ''}`}
            onClick={() => setAngleMode('deg')}
          >
            DEG
          </button>
        </div>
        <button type="button" className="btn btn-ghost btn-sm btn-inline" onClick={() => zoom(0.5)}>
          <ZoomIn size={15} />
        </button>
        <button type="button" className="btn btn-ghost btn-sm btn-inline" onClick={() => zoom(2)}>
          <ZoomOut size={15} />
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-inline"
          onClick={() => {
            setXMin(-10);
            setXMax(10);
          }}
        >
          <RotateCcw size={15} />
        </button>
      </div>

      <div className="graph-svg-wrap">
        {'error' in sample ? (
          <div className="graph-error">{sample.error}</div>
        ) : view ? (
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Grafico di ${debounced}`}>
            {view.xs.map((v) => (
              <line
                key={`x${v}`}
                x1={view.px(v)}
                y1={0}
                x2={view.px(v)}
                y2={H}
                stroke="var(--border)"
                strokeWidth="1"
              />
            ))}
            {view.ys.map((v) => (
              <line
                key={`y${v}`}
                x1={0}
                y1={view.py(v)}
                x2={W}
                y2={view.py(v)}
                stroke="var(--border)"
                strokeWidth="1"
              />
            ))}
            {xMin <= 0 && xMax >= 0 && (
              <line x1={view.px(0)} y1={0} x2={view.px(0)} y2={H} stroke="var(--muted)" strokeWidth="1.5" />
            )}
            {view.yMin <= 0 && view.yMax >= 0 && (
              <line x1={0} y1={view.py(0)} x2={W} y2={view.py(0)} stroke="var(--muted)" strokeWidth="1.5" />
            )}
            {view.xs.map((v) => (
              <text
                key={`tx${v}`}
                x={view.px(v) + 3}
                y={H - 6}
                fontSize="11"
                fill="var(--muted)"
                fontFamily="JetBrains Mono, monospace"
              >
                {fmtTick(v)}
              </text>
            ))}
            {view.ys.map((v) => (
              <text
                key={`ty${v}`}
                x={6}
                y={view.py(v) - 4}
                fontSize="11"
                fill="var(--muted)"
                fontFamily="JetBrains Mono, monospace"
              >
                {fmtTick(v)}
              </text>
            ))}
            {view.segments.map((d, i) => (
              <motion.path
                key={`${debounced}|${xMin}|${xMax}|${angleMode}|${i}`}
                d={d}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0.4 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
              />
            ))}
          </svg>
        ) : null}
      </div>
      <p className="graph-hint">
        Funzioni disponibili secondo la configurazione del docente. Esempi: <code>x^2−3x</code>,{' '}
        <code>sin(x)</code>, <code>ln(x)</code>, <code>abs(x)</code>.
      </p>
    </div>
  );
}
