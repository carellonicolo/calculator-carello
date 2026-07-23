/**
 * Grafici della modalità Statistica: istogramma e box-plot per una serie,
 * diagramma a dispersione con retta di regressione per le coppie (x, y).
 * SVG puro, colori dal tema: nessuna dipendenza esterna.
 */

import { useMemo } from 'react';
import type { RegressionResult } from '../../lib/engine/stats';

const fmt = (v: number) => {
  const r = Math.round(v * 1000) / 1000;
  return String(r).replace('.', ',');
};

/** Numero di classi con la regola di Sturges, limitato a [4, 16]. */
function binCount(n: number): number {
  return Math.max(4, Math.min(16, Math.ceil(Math.log2(n) + 1)));
}

export function Histogram({ data }: { data: number[] }) {
  const bins = useMemo(() => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const k = binCount(data.length);
    const width = (max - min) / k || 1;
    const counts = new Array(k).fill(0);
    for (const x of data) {
      let idx = Math.floor((x - min) / width);
      if (idx >= k) idx = k - 1;
      if (idx < 0) idx = 0;
      counts[idx]++;
    }
    return { min, width, k, counts, maxCount: Math.max(...counts) };
  }, [data]);

  const W = 320;
  const H = 150;
  const padB = 22;
  const padL = 22;
  const bw = (W - padL) / bins.k;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Istogramma delle frequenze">
      <line x1={padL} y1={H - padB} x2={W} y2={H - padB} stroke="var(--border)" />
      <line x1={padL} y1={4} x2={padL} y2={H - padB} stroke="var(--border)" />
      <text x={4} y={12} fontSize={9} fill="var(--muted)">{bins.maxCount}</text>
      {bins.counts.map((c, i) => {
        const h = bins.maxCount === 0 ? 0 : ((H - padB - 6) * c) / bins.maxCount;
        return (
          <g key={i}>
            <rect
              x={padL + i * bw + 1}
              y={H - padB - h}
              width={bw - 2}
              height={h}
              fill="var(--primary)"
              opacity={0.85}
            />
            {c > 0 && (
              <text x={padL + i * bw + bw / 2} y={H - padB - h - 3} fontSize={9} fill="var(--muted)" textAnchor="middle">
                {c}
              </text>
            )}
          </g>
        );
      })}
      <text x={padL} y={H - 6} fontSize={9} fill="var(--muted)">{fmt(bins.min)}</text>
      <text x={W} y={H - 6} fontSize={9} fill="var(--muted)" textAnchor="end">
        {fmt(bins.min + bins.width * bins.k)}
      </text>
    </svg>
  );
}

export function BoxPlot({
  min,
  q1,
  median,
  q3,
  max,
}: {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}) {
  const W = 320;
  const H = 70;
  const padX = 30;
  const span = max - min || 1;
  const sx = (v: number) => padX + ((W - 2 * padX) * (v - min)) / span;
  const cy = 30;
  const bh = 22;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Box-plot">
      {/* baffi */}
      <line x1={sx(min)} y1={cy} x2={sx(q1)} y2={cy} stroke="var(--muted)" />
      <line x1={sx(q3)} y1={cy} x2={sx(max)} y2={cy} stroke="var(--muted)" />
      <line x1={sx(min)} y1={cy - 8} x2={sx(min)} y2={cy + 8} stroke="var(--muted)" />
      <line x1={sx(max)} y1={cy - 8} x2={sx(max)} y2={cy + 8} stroke="var(--muted)" />
      {/* scatola */}
      <rect
        x={sx(q1)}
        y={cy - bh / 2}
        width={Math.max(1, sx(q3) - sx(q1))}
        height={bh}
        fill="var(--primary)"
        opacity={0.2}
        stroke="var(--primary)"
      />
      <line x1={sx(median)} y1={cy - bh / 2} x2={sx(median)} y2={cy + bh / 2} stroke="var(--primary)" strokeWidth={2} />
      {[
        { v: min, lbl: 'min' },
        { v: q1, lbl: 'Q1' },
        { v: median, lbl: 'Me' },
        { v: q3, lbl: 'Q3' },
        { v: max, lbl: 'max' },
      ].map((t) => (
        <text key={t.lbl} x={sx(t.v)} y={H - 6} fontSize={9} fill="var(--muted)" textAnchor="middle">
          {t.lbl}
        </text>
      ))}
    </svg>
  );
}

export function Scatter({ xs, ys, reg }: { xs: number[]; ys: number[]; reg: RegressionResult }) {
  const W = 320;
  const H = 220;
  const pad = 26;
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;
  const px = (v: number) => pad + ((W - 2 * pad) * (v - xMin)) / xSpan;
  const py = (v: number) => H - pad - ((H - 2 * pad) * (v - yMin)) / ySpan;

  const line = {
    x1: px(xMin),
    y1: py(reg.slope * xMin + reg.intercept),
    x2: px(xMax),
    y2: py(reg.slope * xMax + reg.intercept),
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Dispersione con retta di regressione">
      <line x1={pad} y1={H - pad} x2={W - 4} y2={H - pad} stroke="var(--border)" />
      <line x1={pad} y1={4} x2={pad} y2={H - pad} stroke="var(--border)" />
      <line {...line} stroke="var(--primary)" strokeWidth={2} />
      {xs.map((x, i) => (
        <circle key={i} cx={px(x)} cy={py(ys[i])} r={3.2} fill="var(--fg)" opacity={0.7} />
      ))}
    </svg>
  );
}
