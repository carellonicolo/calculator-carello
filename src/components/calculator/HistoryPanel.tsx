import { History, Trash2 } from 'lucide-react';
import type { Calculator } from '../../hooks/useCalculator';

interface Props {
  calc: Calculator;
}

/** Cronologia locale dei calcoli: un clic riprende il risultato. */
export function HistoryPanel({ calc }: Props) {
  return (
    <aside className="history-card">
      <div className="history-head">
        <span className="history-title">
          <History size={15} aria-hidden="true" /> Cronologia
        </span>
        {calc.history.length > 0 && (
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-inline"
            onClick={calc.clearHistory}
            title="Svuota cronologia"
          >
            <Trash2 size={13} /> Svuota
          </button>
        )}
      </div>
      <div className="history-scroll">
        {calc.history.length === 0 ? (
          <div className="history-empty">I calcoli confermati con “=” compaiono qui.</div>
        ) : (
          calc.history.map((h) => (
            <button
              key={h.at}
              type="button"
              className="history-item"
              onClick={() => calc.recallHistory(h)}
              title="Riprendi questo risultato"
            >
              <div className="history-expr">{h.expr} =</div>
              <div className="history-res">{h.result.replace('.', ',')}</div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
