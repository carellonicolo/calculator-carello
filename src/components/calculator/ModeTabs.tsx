import { motion } from 'framer-motion';
import { MODES, type ModeId } from '../../lib/config';

interface Props {
  visible: ModeId[];
  mode: ModeId;
  onChange: (m: ModeId) => void;
}

/**
 * Barra modalità FISSA: vive fuori dalla card (che sotto cambia larghezza),
 * centrata e sempre uguale. Icona + etichetta; sugli schermi stretti restano
 * solo le icone (mai voci nascoste o scroll).
 */
export function ModeTabs({ visible, mode, onChange }: Props) {
  if (visible.length <= 1) return null;
  return (
    <div className="mode-bar-wrap">
      <div className="mode-tabs" role="tablist" aria-label="Modalità calcolatrice">
        {MODES.filter((m) => visible.includes(m.id)).map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              aria-label={m.label}
              title={m.label}
              className={`mode-tab${mode === m.id ? ' active' : ''}`}
              onClick={() => onChange(m.id)}
            >
              {mode === m.id && (
                <motion.span
                  layoutId="mode-pill"
                  className="mode-tab-pill"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <Icon size={16} aria-hidden="true" />
              <span className="mode-tab-label">{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
