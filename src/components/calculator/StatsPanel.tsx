import { useMemo, useState } from 'react';
import {
  computeStats,
  linearRegression,
  parseNumbers,
  parsePairs,
  type RegressionResult,
  type StatsResult,
} from '../../lib/engine/stats';
import { CalcError, formatResult } from '../../lib/engine/evaluator';
import { BoxPlot, Histogram, Scatter } from './StatsCharts';

type StatMode = 'series' | 'pairs';

interface SeriesOutcome {
  stats?: StatsResult;
  data?: number[];
  error?: string;
}

interface PairsOutcome {
  reg?: RegressionResult;
  xs?: number[];
  ys?: number[];
  error?: string;
}

/** Modalità Statistica: serie univariata (indici + grafici) o coppie (x, y). */
export function StatsPanel() {
  const [mode, setMode] = useState<StatMode>('series');
  const [text, setText] = useState('');
  const [pairsText, setPairsText] = useState('');

  const fmt = (v: number) => formatResult(v).replace('.', ',');

  const seriesResult = useMemo<SeriesOutcome | null>(() => {
    if (!text.trim()) return null;
    try {
      const data = parseNumbers(text);
      return { stats: computeStats(data), data };
    } catch (e) {
      return { error: e instanceof CalcError ? e.message : 'Errore' };
    }
  }, [text]);

  const pairsResult = useMemo<PairsOutcome | null>(() => {
    if (!pairsText.trim()) return null;
    try {
      const { xs, ys } = parsePairs(pairsText);
      return { reg: linearRegression(xs, ys), xs, ys };
    } catch (e) {
      return { error: e instanceof CalcError ? e.message : 'Errore' };
    }
  }, [pairsText]);

  const s = seriesResult?.stats;
  const tiles = s
    ? [
        { label: 'N dati', value: String(s.count) },
        { label: 'Somma', value: fmt(s.sum) },
        { label: 'Σx²', value: fmt(s.sumSq) },
        { label: 'Media', value: fmt(s.mean) },
        { label: 'Mediana', value: fmt(s.median) },
        { label: 'Moda', value: s.mode.length === 0 ? '—' : s.mode.map(fmt).join('  ') },
        { label: 'Minimo', value: fmt(s.min) },
        { label: 'Massimo', value: fmt(s.max) },
        { label: 'Range', value: fmt(s.range) },
        { label: 'Q1 (25%)', value: fmt(s.q1) },
        { label: 'Q3 (75%)', value: fmt(s.q3) },
        { label: 'IQR', value: fmt(s.iqr) },
        { label: 'Varianza pop.', value: fmt(s.popVariance) },
        { label: 'σ popolazione', value: fmt(s.popStd) },
        { label: 'Varianza camp.', value: s.sampleVariance === null ? '—' : fmt(s.sampleVariance) },
        { label: 's campionaria', value: s.sampleStd === null ? '—' : fmt(s.sampleStd) },
        { label: 'Coeff. variazione', value: s.cv === null ? '—' : fmt(s.cv) },
      ]
    : [];

  const reg = pairsResult?.reg;
  const regSign = reg && reg.intercept >= 0 ? '+' : '−';
  const regTiles = reg
    ? [
        { label: 'N coppie', value: String(reg.count) },
        { label: 'Pendenza m', value: fmt(reg.slope) },
        { label: 'Intercetta q', value: fmt(reg.intercept) },
        { label: 'Correlazione r', value: fmt(reg.r) },
        { label: 'R²', value: fmt(reg.r2) },
      ]
    : [];

  return (
    <div>
      <div className="pad-toolbar" style={{ marginBottom: 12 }}>
        <div className="seg" role="radiogroup" aria-label="Tipo di analisi statistica">
          <button
            type="button"
            className={`seg-btn${mode === 'series' ? ' active' : ''}`}
            onClick={() => setMode('series')}
          >
            Serie
          </button>
          <button
            type="button"
            className={`seg-btn${mode === 'pairs' ? ' active' : ''}`}
            onClick={() => setMode('pairs')}
          >
            Coppie (x, y)
          </button>
        </div>
      </div>

      {mode === 'series' ? (
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
            {seriesResult && 'error' in seriesResult && (
              <p style={{ color: 'var(--error)', fontSize: 13, marginTop: 8 }}>{seriesResult.error}</p>
            )}
            {s && seriesResult?.data && seriesResult.data.length > 0 && (
              <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                <div>
                  <div className="stat-tile-label" style={{ marginBottom: 4 }}>Istogramma</div>
                  <Histogram data={seriesResult.data} />
                </div>
                <div>
                  <div className="stat-tile-label" style={{ marginBottom: 4 }}>Box-plot</div>
                  <BoxPlot min={s.min} q1={s.q1} median={s.median} q3={s.q3} max={s.max} />
                </div>
              </div>
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
      ) : (
        <div className="stats-layout">
          <div className="stats-input">
            <label htmlFor="stats-pairs">Coppie (x, y)</label>
            <textarea
              id="stats-pairs"
              value={pairsText}
              onChange={(e) => setPairsText(e.target.value)}
              placeholder={'Una coppia per riga: x y (spazio o tab)\nEs:\n1  2,1\n2  3,9\n3  6,2'}
              spellCheck={false}
            />
            {pairsResult && 'error' in pairsResult && (
              <p style={{ color: 'var(--error)', fontSize: 13, marginTop: 8 }}>{pairsResult.error}</p>
            )}
            {reg && pairsResult?.xs && pairsResult.ys && (
              <div style={{ marginTop: 14 }}>
                <div className="stat-tile-label" style={{ marginBottom: 4 }}>Dispersione + retta</div>
                <Scatter xs={pairsResult.xs} ys={pairsResult.ys} reg={reg} />
              </div>
            )}
          </div>
          <div className="stats-grid">
            {regTiles.length === 0 ? (
              <p className="muted" style={{ gridColumn: '1 / -1' }}>
                Inserisci almeno due coppie per la retta ai minimi quadrati.
              </p>
            ) : (
              <>
                <div className="stat-tile" style={{ gridColumn: '1 / -1' }}>
                  <div className="stat-tile-label">Retta di regressione</div>
                  <div className="stat-tile-value">
                    y = {fmt(reg!.slope)}x {regSign} {fmt(Math.abs(reg!.intercept))}
                  </div>
                </div>
                {regTiles.map((t) => (
                  <div key={t.label} className="stat-tile">
                    <div className="stat-tile-label">{t.label}</div>
                    <div className="stat-tile-value">{t.value}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
