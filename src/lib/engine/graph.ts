/**
 * Campionamento di f(x) per la modalità grafici.
 * Riusa il compilatore dell'evaluator → i permessi del docente valgono anche qui.
 */

import {
  compile,
  CalcError,
  CalcPermissionError,
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

export function sampleFunction(
  src: string,
  opts: { angleMode: AngleMode; permissions: EnginePermissions; xMin: number; xMax: number; samples?: number }
): GraphSample {
  const { xMin, xMax } = opts;
  if (!(xMax > xMin)) throw new CalcError('Intervallo x non valido');
  const n = Math.max(64, Math.min(2000, opts.samples ?? 480));

  const f = compile(src, {
    angleMode: opts.angleMode,
    permissions: opts.permissions,
    variables: ['x'],
  });

  const points: ({ x: number; y: number } | null)[] = [];
  const finite: number[] = [];
  const step = (xMax - xMin) / (n - 1);
  for (let i = 0; i < n; i++) {
    const x = xMin + step * i;
    try {
      const y = f({ x });
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

  // Range y robusto: percentili 2–98 per non farsi schiacciare dagli asintoti.
  const sorted = [...finite].sort((a, b) => a - b);
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
  return { points, yMin, yMax };
}
