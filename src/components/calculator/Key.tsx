import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import clsx from 'clsx';

interface Props {
  label: ReactNode;
  onPress?: () => void;
  variant?: 'num' | 'op' | 'fn' | 'eq' | 'danger' | 'mem';
  wide?: boolean;
  smallLabel?: boolean;
  /** Tasto rimosso dal docente: cella fantasma con lucchetto. */
  ghost?: boolean;
  /** Tasto momentaneamente non usabile (es. cifra non valida nella base). */
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
}

export function Key({ label, onPress, variant = 'num', wide, smallLabel, ghost, disabled, title, ariaLabel }: Props) {
  if (ghost) {
    return (
      <div
        className={clsx('calc-key k-ghost', wide && 'k-wide')}
        title="Disattivato dal docente"
        aria-label="Tasto disattivato dal docente"
        role="presentation"
      >
        <Lock size={14} aria-hidden="true" />
      </div>
    );
  }
  return (
    <motion.button
      type="button"
      className={clsx(
        'calc-key',
        variant !== 'num' && `k-${variant}`,
        wide && 'k-wide',
        smallLabel && 'k-sm-label',
        disabled && 'k-disabled'
      )}
      whileTap={disabled ? undefined : { scale: 0.94, y: 1 }}
      transition={{ duration: 0.08 }}
      onClick={disabled ? undefined : onPress}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
    >
      {label}
    </motion.button>
  );
}
