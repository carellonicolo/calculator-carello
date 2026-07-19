import { useMemo, useState } from 'react';
import { computeStats, parseNumbers, type StatsResult } from '../../lib/engine/stats';
import { CalcError, formatResult } from '../../lib/engine/evaluator';

interface Outcome {
  stats?: StatsResult;
  error?: string;
}

/** Modalità Statistica: incolla la serie, gli indici si aggiornano da soli. */
export function StatsPanel() {
  const [text, setText] = useState('');

  const result = useMemo<Outcome | null>(() => {
    if (!text.trim()) return null;
    try {
      return { stats: computeStats(parseNumbers(text)) };
    } catch (e) {
      return { error: e instanceof CalcError ? e.message : 'Errore' };
    }
  }, [text]);

  const fmt = (v: number) => formatResult(v).replace('.', ',');

  const s = result?.stats;
  const tiles = s
    ? [
        { label: 'N dati', value: String(s.count) },
        { label: 'Somma', value: fmt(s.sum) },
        { label: 'Media', value: fmt(s.mean) },
        { label: 'Mediana', value: fmt(s.median) },
        { label: 'Minimo', value: fmt(s.min) },
        { label: 'Massimo', value: fmt(s.max) },
        { label: 'Range', value: fmt(s.range) },
        { label: 'Varianza pop.', value: fmt(s.popVariance) },
        { label: 'σ popolazione', value: fmt(s.popStd) },
        { label: 'Varianza camp.', value: s.sampleVariance === null ? '—' : fmt(s.sampleVariance) },
        { label: 's campionaria', value: s.sampleStd === null ? '—' : fmt(s.sampleStd) },
      ]
    : [];

  return (
    <div className="stats-layout">
      <div className="stats-input">
        <label htmlFor="stats-data">Serie di dati</label>
        <textarea
          id="stats-data"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Numeri separati da spazi, a capo o ;\nEs: 6,5  7  4,5  8  7,5'}
          spellCheck={false}
        />
        {result && 'error' in result && (
          <p style={{ color: 'var(--error)', fontSize: 13, marginTop: 8 }}>{result.error}</p>
        )}
      </div>
      <div className="stats-grid">
        {tiles.length === 0 ? (
          <p className="muted" style={{ gridColumn: '1 / -1' }}>
            Gli indici compaiono qui appena inserisci i dati.
          </p>
        ) : (
          tiles.map((t) => (
            <div key={t.label} className="stat-tile">
              <div className="stat-tile-label">{t.label}</div>
              <div className="stat-tile-value">{t.value}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
