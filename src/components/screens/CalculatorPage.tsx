import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import { useAppState } from '../../hooks/useAppState';
import { useCalculator } from '../../hooks/useCalculator';
import { useToast } from '../ui/Toast';
import { MODES, visibleModes, type ModeId } from '../../lib/config';
import { Display } from '../calculator/Display';
import { ModeTabs } from '../calculator/ModeTabs';
import { RestrictionBadge } from '../calculator/RestrictionBadge';
import { StandardPad } from '../calculator/StandardPad';
import { ScientificPad } from '../calculator/ScientificPad';
import { ProgrammerPanel } from '../calculator/ProgrammerPanel';
import { GraphPanel } from '../calculator/GraphPanel';
import { StatsPanel } from '../calculator/StatsPanel';
import { HistoryPanel } from '../calculator/HistoryPanel';

export function CalculatorPage() {
  const { user, config, configVersion } = useAppState();
  const { toast } = useToast();
  const calc = useCalculator(config, user?.email ?? 'anon');
  const [mode, setMode] = useState<ModeId>('standard');

  const modes = visibleModes(config);
  const modesKey = modes.join(',');

  // Il docente spegne la modalità in uso → si torna alla Standard, con garbo.
  const modeRef = useRef(mode);
  modeRef.current = mode;
  useEffect(() => {
    if (!modes.includes(modeRef.current)) {
      const label = MODES.find((m) => m.id === modeRef.current)?.label ?? '';
      setMode('standard');
      toast('info', `La modalità ${label} è stata disattivata dal docente.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modesKey, toast]);

  // Notifica discreta quando la configurazione cambia in corsa.
  const firstVersion = useRef(true);
  useEffect(() => {
    if (configVersion === 0) return;
    if (firstVersion.current) firstVersion.current = false;
    toast('info', 'Il docente ha aggiornato la configurazione della calcolatrice.');
  }, [configVersion, toast]);

  // Tastiera fisica (solo Standard/Scientifica, mai dentro i campi di testo).
  useEffect(() => {
    if (mode !== 'standard' && mode !== 'scientific') return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (/^[0-9]$/.test(k)) return void (e.preventDefault(), calc.pressDigit(k));
      if (k === '.' || k === ',') return void (e.preventDefault(), calc.pressDigit('.'));
      if (k === '+') return void (e.preventDefault(), calc.pressToken('+'));
      if (k === '-') return void (e.preventDefault(), calc.pressToken('-', '−'));
      if (k === '*') return void (e.preventDefault(), calc.pressToken('*', '×'));
      if (k === '/') return void (e.preventDefault(), calc.pressToken('/', '÷'));
      if (k === '(') return void (e.preventDefault(), calc.pressToken('('));
      if (k === ')') return void (e.preventDefault(), calc.pressToken(')'));
      if (k === '^' && config.scientific.enabled && config.scientific.powRoot)
        return void (e.preventDefault(), calc.pressToken('^'));
      if (k === '!' && config.scientific.enabled && config.scientific.factorial)
        return void (e.preventDefault(), calc.pressToken('!'));
      if (k === '%' && config.standard.percent) return void (e.preventDefault(), calc.pressToken('%'));
      if (k === 'Enter' || k === '=') return void (e.preventDefault(), calc.equals());
      if (k === 'Backspace') return void (e.preventDefault(), calc.backspace());
      if (k === 'Escape') return void (e.preventDefault(), calc.clearAll());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, calc, config]);

  const wide = mode !== 'standard';
  const showHistory = config.history.enabled && (mode === 'standard' || mode === 'scientific');

  return (
    <>
      <div className="calc-userbar">
        <span className="calc-userbar-id">
          <b>{user?.name}</b>
          {user?.class && <span className="class-chip">{user.class}</span>}
          {user?.isTeacher && <span className="class-chip">docente</span>}
        </span>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <RestrictionBadge config={config} />
          {user?.isTeacher && (
            <Link to="/admin" className="btn btn-secondary btn-sm btn-inline">
              <Settings2 size={14} /> Console docente
            </Link>
          )}
        </span>
      </div>

      <div className="calc-layout">
        <motion.div layout className={`calc-card${wide ? ' is-wide' : ''}`}>
          <ModeTabs visible={modes} mode={mode} onChange={setMode} />
          {(mode === 'standard' || mode === 'scientific') && (
            <Display calc={calc} showAngle={mode === 'scientific' && config.scientific.trig} />
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode + `:${configVersion}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
            >
              {mode === 'standard' && <StandardPad calc={calc} config={config} />}
              {mode === 'scientific' && <ScientificPad calc={calc} config={config} />}
              {mode === 'programmer' && <ProgrammerPanel config={config} />}
              {mode === 'graphing' && <GraphPanel config={config} />}
              {mode === 'statistics' && <StatsPanel />}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {showHistory && <HistoryPanel calc={calc} />}
      </div>
    </>
  );
}
