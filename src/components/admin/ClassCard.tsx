import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookmarkPlus, ChevronDown, RotateCcw, School, Sparkles } from 'lucide-react';
import { AREAS, countRestrictions, getFlag, type CalcConfig } from '../../lib/config';
import { ConfigEditor } from './ConfigEditor';

export interface ClassCardProps {
  /** Nome classe, oppure null per la card "Predefinita". */
  cls: string | null;
  /** Config esplicita della classe (null = usa la predefinita). */
  config: CalcConfig | null;
  defaultConfig: CalcConfig;
  updatedAt: string | null;
  saving: boolean;
  onChange: (config: CalcConfig) => void;
  onReset?: () => void;
  onSaveAsPreset: (name: string, config: CalcConfig) => void;
}

/** Pallini di riepilogo per area: verde = tutto, giallo = parziale, rosso = off. */
function AreaDots({ config }: { config: CalcConfig }) {
  return (
    <>
      {AREAS.map((a) => {
        const masterOn = a.hasMaster ? getFlag(config, a.area, 'enabled') : true;
        const offGroups = a.groups.filter((g) => !getFlag(config, g.area, g.key)).length;
        const state = !masterOn ? 'off' : offGroups === 0 ? 'ok' : a.groups.length === offGroups ? 'off' : 'part';
        return (
          <span key={a.area} className={`area-dot ${state}`} title={a.label}>
            {a.label.slice(0, 4)}
          </span>
        );
      })}
    </>
  );
}

export function ClassCard(props: ClassCardProps) {
  const { cls, config, defaultConfig, updatedAt, saving, onChange, onReset, onSaveAsPreset } = props;
  const [open, setOpen] = useState(cls === null);
  const [presetForm, setPresetForm] = useState(false);
  const [presetName, setPresetName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (presetForm) inputRef.current?.focus();
  }, [presetForm]);

  const effective = config ?? defaultConfig;
  const isDefaultCard = cls === null;
  const restrictions = countRestrictions(effective);

  return (
    <div className="rcard class-card">
      <button type="button" className="class-card-head" onClick={() => setOpen((o) => !o)}>
        <span className="class-card-name">
          {isDefaultCard ? <Sparkles size={17} /> : <School size={17} />}
          {isDefaultCard ? 'Predefinita' : cls}
        </span>
        <span className="class-card-meta">
          {isDefaultCard
            ? 'vale per tutte le classi senza configurazione propria'
            : config
              ? `personalizzata${updatedAt ? ` · ${new Date(updatedAt).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}` : ''}`
              : 'usa la predefinita'}
          {restrictions > 0 && ` · ${restrictions} limitazioni`}
        </span>
        <span className="class-card-summary">
          <AreaDots config={effective} />
          {saving && <span className="saving-dot">salvo…</span>}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronDown size={17} />
          </motion.span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="class-card-body">
              {!isDefaultCard && !config && (
                <p className="muted" style={{ margin: '10px 0' }}>
                  Questa classe segue la configurazione predefinita: al primo interruttore che tocchi
                  diventa personalizzata.
                </p>
              )}
              <ConfigEditor config={effective} onChange={onChange} />
              <div className="class-card-actions">
                {presetForm ? (
                  <form
                    style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const name = presetName.trim();
                      if (!name) return;
                      onSaveAsPreset(name, effective);
                      setPresetForm(false);
                      setPresetName('');
                    }}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Nome del preset (es. Verifica basi)"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      style={{ width: 260 }}
                      maxLength={60}
                    />
                    <button type="submit" className="btn btn-sm">
                      Salva
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPresetForm(false)}>
                      Annulla
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm btn-inline"
                    onClick={() => setPresetForm(true)}
                  >
                    <BookmarkPlus size={14} /> Salva come preset
                  </button>
                )}
                {!isDefaultCard && config && onReset && (
                  <button type="button" className="btn btn-ghost btn-sm btn-inline" onClick={onReset}>
                    <RotateCcw size={14} /> Torna alla predefinita
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
