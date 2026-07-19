import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { Calculator } from '../../hooks/useCalculator';

interface Props {
  calc: Calculator;
  /** Mostra il badge DEG/RAD (solo quando la trigonometria è visibile). */
  showAngle?: boolean;
}

/** Raggruppa le cifre del risultato con spazi sottili (1 234 567,89). */
function prettyNumber(s: string): string {
  const it = s.replace('.', ',');
  const m = it.match(/^(-?)(\d+)(,\d+)?(e[+-]?\d+)?$/);
  if (!m) return it;
  const [, sign, intPart, decPart = '', expPart = ''] = m;
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return sign + grouped + decPart + expPart;
}

export function Display({ calc, showAngle }: Props) {
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (calc.shakeNonce === 0) return;
    setShaking(true);
    const t = window.setTimeout(() => setShaking(false), 380);
    return () => window.clearTimeout(t);
  }, [calc.shakeNonce]);

  const big = calc.error ?? calc.committed ?? calc.preview ?? (calc.exprText ? '…' : '0');
  const isPreview = !calc.error && !calc.committed && calc.preview !== null;

  return (
    <div className={`calc-display${shaking ? ' shake' : ''}`}>
      <div className="display-badges">
        {showAngle && <span className="display-badge">{calc.angleMode === 'deg' ? 'DEG' : 'RAD'}</span>}
        {calc.memory !== null && <span className="display-badge">M</span>}
      </div>
      <div className="calc-expr" aria-live="polite">
        {calc.exprText || ' '}
      </div>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={String(big) + (calc.error ? '!' : isPreview ? '~' : '=')}
          className={`calc-result${isPreview ? ' is-preview' : ''}${calc.error ? ' is-error' : ''}`}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, position: 'absolute' }}
          transition={{ duration: 0.14 }}
          aria-live="polite"
        >
          {calc.error ? calc.error : prettyNumber(String(big))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
