import { useState } from 'react';
import { CheckCircle2, Trash2, Wand2 } from 'lucide-react';
import { countRestrictions } from '../../lib/config';
import type { Preset } from '../../lib/api';

interface Props {
  presets: Preset[];
  classes: string[];
  onApply: (presetId: number, classes: string[]) => Promise<void>;
  onDelete: (presetId: number) => void;
}

/** Elenco preset: applicazione a più classi con un clic, eliminazione. */
export function PresetsSection({ presets, classes, onApply, onDelete }: Props) {
  const [applying, setApplying] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const toggleClass = (c: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  if (presets.length === 0) {
    return (
      <div className="rcard">
        <h3 className="rcard-title">Preset</h3>
        <p className="muted">
          Nessun preset salvato. Configura una classe (o la predefinita) nella sezione «Classi» e usa
          «Salva come preset»: qui potrai riapplicarlo in un clic, es. «Verifica conversioni di base».
        </p>
      </div>
    );
  }

  return (
    <div className="rcard">
      <h3 className="rcard-title">Preset</h3>
      {presets.map((p) => (
        <div key={p.id} className="preset-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div className="preset-name">{p.name}</div>
              <div className="preset-meta">
                {countRestrictions(p.config) === 0
                  ? 'tutto attivo'
                  : `${countRestrictions(p.config)} limitazioni`}{' '}
                · aggiornato {new Date(p.updatedAt).toLocaleDateString('it-IT')}
              </div>
            </div>
            <div className="preset-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-inline"
                onClick={() => {
                  setApplying((a) => (a === p.id ? null : p.id));
                  setSelected(new Set());
                }}
              >
                <Wand2 size={14} /> Applica a…
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-inline"
                onClick={() => onDelete(p.id)}
                title="Elimina preset"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {applying === p.id && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="chip-select">
                <button
                  type="button"
                  className={`chip-check${selected.has('*') ? ' on' : ''}`}
                  onClick={() => toggleClass('*')}
                >
                  Predefinita
                </button>
                {classes.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`chip-check${selected.has(c) ? ' on' : ''}`}
                    onClick={() => toggleClass(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div>
                <button
                  type="button"
                  className="btn btn-sm btn-inline"
                  disabled={selected.size === 0 || busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await onApply(p.id, [...selected]);
                      setApplying(null);
                      setSelected(new Set());
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <CheckCircle2 size={14} />
                  Applica a {selected.size} {selected.size === 1 ? 'destinazione' : 'destinazioni'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
