import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppState } from '../../hooks/useAppState';
import { useCalculator } from '../../hooks/useCalculator';
import { useHistoryStore, type HistoryEntry } from '../../hooks/useHistoryStore';
import { useToast } from '../ui/Toast';
import { countRestrictions, MODES, visibleModes, type ModeId } from '../../lib/config';
import { Display } from '../calculator/Display';
import { ModeTabs } from '../calculator/ModeTabs';
import { RestrictionBadge } from '../calculator/RestrictionBadge';
import { StandardPad } from '../calculator/StandardPad';
import { ScientificPad } from '../calculator/ScientificPad';
import { ProgrammerPanel } from '../calculator/ProgrammerPanel';
import { GraphWorkspace } from '../calculator/graph/GraphWorkspace';
import { PALETTE } from '../../lib/graphScene';
import { StatsPanel } from '../calculator/StatsPanel';
import { HistoryPanel } from '../calculator/HistoryPanel';

export function CalculatorPage() {
  const { user, config, configVersion } = useAppState();
  const { toast } = useToast();
  const history = useHistoryStore(user?.email ?? 'anon', config.history.enabled);
  const calc = useCalculator(config, history);
  const [mode, setMode] = useState<ModeId>('standard');
  const [progRecall, setProgRecall] = useState<{ nonce: number; value: string }>();
  const [graphRecall, setGraphRecall] = useState<{ nonce: number; payload: unknown }>();
  const recallNonce = useRef(0);

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
  useEffect(() => {
    if (configVersion === 0) return;
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

  /** Clic in cronologia: salta alla modalità della voce e la ricarica. */
  const recallEntry = (entry: HistoryEntry) => {
    if (entry.mode === 'calc') {
      if (mode !== 'standard' && mode !== 'scientific') setMode('standard');
      calc.recallHistory(entry);
      return;
    }
    if (entry.mode === 'prog') {
      if (!modes.includes('programmer')) {
        toast('info', 'La modalità Programmatore è disattivata dal docente.');
        return;
      }
      setMode('programmer');
      setProgRecall({ nonce: ++recallNonce.current, value: entry.value ?? '0' });
      return;
    }
    if (!modes.includes('graphing')) {
      toast('info', 'La modalità Grafici è disattivata dal docente.');
      return;
    }
    // Voci nuove: scena intera. Voci vecchie: singola funzione convertita.
    const payload =
      entry.scene ??
      (entry.graph
        ? {
            funcs: [{ kind: 'explicit', src: entry.graph.src, color: PALETTE[0] }],
            view: { xMin: entry.graph.xMin, xMax: entry.graph.xMax, yMin: -6.25, yMax: 6.25 },
          }
        : null);
    if (!payload) return;
    setMode('graphing');
    setGraphRecall({ nonce: ++recallNonce.current, payload });
  };

  const wide = mode !== 'standard';
  const showHistory = config.history.enabled && mode !== 'statistics' && mode !== 'graphing';
  const restricted = countRestrictions(config) > 0 && !user?.isTeacher;

  return (
    <>
      {restricted && (
        <div className="calc-userbar" style={{ justifyContent: 'flex-end' }}>
          <RestrictionBadge config={config} />
        </div>
      )}

      <ModeTabs visible={modes} mode={mode} onChange={setMode} />

      {mode === 'graphing' ? (
        <motion.div
          key="graph"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16 }}
        >
          <GraphWorkspace
            config={config}
            history={history}
            userEmail={user?.email ?? 'anon'}
            userName={user?.name ?? 'Studente'}
            recall={graphRecall}
            onRecallEntry={recallEntry}
          />
        </motion.div>
      ) : (
        <div className="calc-layout">
          <motion.div layout className={`calc-card${wide ? ' is-wide' : ''}`}>
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
                {mode === 'programmer' && (
                  <ProgrammerPanel config={config} history={history} recall={progRecall} />
                )}
                {mode === 'statistics' && <StatsPanel />}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {showHistory && <HistoryPanel history={history} onRecall={recallEntry} />}
        </div>
      )}
    </>
  );
}
