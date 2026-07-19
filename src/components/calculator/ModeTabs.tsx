import { motion } from 'framer-motion';
import { MODES, type ModeId } from '../../lib/config';

interface Props {
  visible: ModeId[];
  mode: ModeId;
  onChange: (m: ModeId) => void;
}

export function ModeTabs({ visible, mode, onChange }: Props) {
  if (visible.length <= 1) return null;
  return (
    <div className="mode-tabs" role="tablist" aria-label="Modalità calcolatrice">
      {MODES.filter((m) => visible.includes(m.id)).map((m) => (
        <button
          key={m.id}
          type="button"
          role="tab"
          aria-selected={mode === m.id}
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
          {m.label}
        </button>
      ))}
    </div>
  );
}
