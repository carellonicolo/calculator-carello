import { Binary, Calculator, ChartSpline, History, Trash2 } from 'lucide-react';
import type { HistoryEntry, HistoryStore } from '../../hooks/useHistoryStore';

interface Props {
  history: HistoryStore;
  /** Richiama la voce: salta alla sua modalità e la ricarica. */
  onRecall: (entry: HistoryEntry) => void;
}

const MODE_ICON = {
  calc: Calculator,
  prog: Binary,
  graph: ChartSpline,
} as const;

/** Cronologia condivisa: calcoli, operazioni programmatore e funzioni salvate. */
export function HistoryPanel({ history, onRecall }: Props) {
  return (
    <aside className="history-card">
      <div className="history-head">
        <span className="history-title">
          <History size={15} aria-hidden="true" /> Cronologia
        </span>
        {history.entries.length > 0 && (
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-inline"
            onClick={history.clear}
            title="Svuota cronologia"
          >
            <Trash2 size={13} /> Svuota
          </button>
        )}
      </div>
      <div className="history-scroll">
        {history.entries.length === 0 ? (
          <div className="history-empty">
            I calcoli confermati con “=” (e le funzioni salvate nei grafici) compaiono qui.
          </div>
        ) : (
          history.entries.map((h) => {
            const Icon = MODE_ICON[h.mode];
            return (
              <button
                key={h.at}
                type="button"
                className="history-item"
                onClick={() => onRecall(h)}
                title="Riprendi questa voce"
              >
                <div className="history-expr">
                  <Icon size={11} aria-hidden="true" className="history-mode-ico" />
                  {h.expr}
                  {h.mode !== 'graph' && ' ='}
                </div>
                <div className={`history-res${h.mode === 'graph' ? ' is-range' : ''}`}>
                  {h.mode === 'calc' ? h.result.replace('.', ',') : h.result}
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
