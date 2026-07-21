import { useMemo, useState } from 'react';
import type { GraphSceneStore } from '../../../hooks/useGraphScene';
import { fmtIt, type CurveRender } from '../../../lib/graphDerived';

interface Props {
  store: GraphSceneStore;
  renders: CurveRender[];
}

/** Tabella x → f(x) per una funzione esplicita, con inizio/passo/righe a scelta. */
export function ValueTable({ store, renders }: Props) {
  const { scene } = store;
  const explicit = scene.funcs.filter((f) => f.kind === 'explicit' && f.src.trim() !== '');
  const [funcId, setFuncId] = useState<string>('');
  const [start, setStart] = useState<string>('-5');
  const [step, setStep] = useState<string>('1');
  const [rows, setRows] = useState<string>('15');

  const selected = explicit.find((f) => f.id === funcId) ?? explicit[0];
  const render = renders.find((r) => r.f.id === selected?.id);

  const table = useMemo(() => {
    if (!selected || !render?.fn) return null;
    const s = Number(start.replace(',', '.'));
    const st = Number(step.replace(',', '.'));
    const n = Math.max(1, Math.min(200, Math.round(Number(rows))));
    if (!Number.isFinite(s) || !Number.isFinite(st) || st === 0) return null;
    const fn = render.fn;
    const out: { x: number; y: number | null }[] = [];
    for (let i = 0; i < n; i++) {
      const x = s + st * i;
      let y: number | null = null;
      try {
        const v = fn(x);
        y = Number.isFinite(v) ? v : null;
      } catch {
        y = null;
      }
      out.push({ x, y });
    }
    return out;
  }, [selected, render, start, step, rows]);

  if (explicit.length === 0) {
    return <div className="history-empty">Aggiungi una funzione y = f(x) per vedere la tabella dei valori.</div>;
  }

  return (
    <div className="vtable">
      <div className="vtable-controls">
        <div className="field">
          <label htmlFor="vt-fn">Funzione</label>
          <select id="vt-fn" value={selected?.id ?? ''} onChange={(e) => setFuncId(e.target.value)}>
            {explicit.map((f) => (
              <option key={f.id} value={f.id}>
                y = {f.src}
              </option>
            ))}
          </select>
        </div>
        <div className="field field-xs">
          <label htmlFor="vt-start">x iniziale</label>
          <input id="vt-start" type="text" inputMode="decimal" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="field field-xs">
          <label htmlFor="vt-step">Passo</label>
          <input id="vt-step" type="text" inputMode="decimal" value={step} onChange={(e) => setStep(e.target.value)} />
        </div>
        <div className="field field-xs">
          <label htmlFor="vt-rows">Righe</label>
          <input id="vt-rows" type="number" min={1} max={200} value={rows} onChange={(e) => setRows(e.target.value)} />
        </div>
      </div>

      {render?.error ? (
        <div className="fn-error">{render.error}</div>
      ) : !table ? (
        <div className="history-empty">Controlla inizio e passo: valori non validi.</div>
      ) : (
        <div className="vtable-scroll">
          <table>
            <thead>
              <tr>
                <th>x</th>
                <th>f(x)</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row, i) => (
                <tr key={i}>
                  <td>{fmtIt(row.x, 6)}</td>
                  <td>{row.y === null ? '—' : fmtIt(row.y, 8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
