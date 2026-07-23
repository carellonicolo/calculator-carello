import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  BookmarkPlus,
  ChartSpline,
  CircleDot,
  Combine,
  FunctionSquare,
  History,
  ImageDown,
  Maximize,
  Minimize,
  Presentation,
  Spline,
  Table2,
} from 'lucide-react';
import clsx from 'clsx';
import { enginePermissions, type CalcConfig } from '../../../lib/config';
import { sampleFunction } from '../../../lib/engine/graph';
import { sceneSummary } from '../../../lib/graphScene';
import { buildNotables, buildRenders, type GraphFeatures } from '../../../lib/graphDerived';
import { useGraphScene } from '../../../hooks/useGraphScene';
import type { HistoryEntry, HistoryStore } from '../../../hooks/useHistoryStore';
import { useToast } from '../../ui/Toast';
import { PlotCanvas } from './PlotCanvas';
import { FunctionList } from './FunctionList';
import { ValueTable } from './ValueTable';
import { ExportDialog } from './ExportDialog';
import { HistoryPanel } from '../HistoryPanel';

interface Props {
  config: CalcConfig;
  history: HistoryStore;
  userEmail: string;
  userName: string;
  /** Richiamo dalla cronologia: scena (o payload legacy già convertito). */
  recall?: { nonce: number; payload: unknown };
  /** Clic su una voce di cronologia dentro la sidebar. */
  onRecallEntry: (entry: HistoryEntry) => void;
}

type SideTab = 'fn' | 'table' | 'history';

/** Dimensioni base (1×) dell'immagine esportata, indipendenti dallo schermo. */
const EXPORT_W = 1280;
const EXPORT_H = 800;

/** Workspace Grafici in stile GeoGebra: pannello funzioni + piano interattivo. */
export function GraphWorkspace({ config, history, userEmail, userName, recall, onRecallEntry }: Props) {
  const { toast } = useToast();
  const permissions = useMemo(() => enginePermissions(config), [config]);
  const features: GraphFeatures = useMemo(
    () => ({
      paramPolar: config.graphing.paramPolar,
      analysis: config.graphing.analysis,
      calculus: config.graphing.calculus,
    }),
    [config]
  );

  // Prima funzione proposta: la prima consentita dalla configurazione.
  const initialSrc = useMemo(() => {
    for (const c of ['sin(x)', 'x^2', 'x+1']) {
      try {
        sampleFunction(c, { angleMode: 'rad', permissions, xMin: -10, xMax: 10, samples: 64 });
        return c;
      } catch {
        // prova la successiva
      }
    }
    return 'x';
  }, [permissions]);

  const store = useGraphScene(userEmail, history.enabled, config.graphing.sliders, initialSrc);
  const { scene, setScene } = store;
  const [tab, setTab] = useState<SideTab>('fn');
  const [fs, setFs] = useState(false);
  const [board, setBoard] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Richiamo dalla cronologia.
  useEffect(() => {
    if (!recall) return;
    if (!store.loadScene(recall.payload)) {
      toast('error', 'Voce di cronologia non ripristinabile');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recall?.nonce]);

  // Fullscreen: Esc per uscire, niente scroll della pagina sotto.
  useEffect(() => {
    if (!fs) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFs(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [fs]);

  // La derivazione (campioni/analisi) segue input e slider con priorità bassa:
  // la digitazione resta fluida anche con più funzioni tracciate.
  const dFuncs = useDeferredValue(scene.funcs);
  const dSliders = useDeferredValue(scene.sliders);
  const deriveScene = useMemo(
    () => ({ ...scene, funcs: dFuncs, sliders: dSliders }),
    [scene, dFuncs, dSliders]
  );
  const vars = useMemo(
    () => Object.fromEntries(dSliders.map((s) => [s.name, s.value])),
    [dSliders]
  );
  const renders = useMemo(
    () => buildRenders(deriveScene, permissions, vars, features),
    [deriveScene, permissions, vars, features]
  );
  const notables = useMemo(
    () => buildNotables(deriveScene, renders, features),
    [deriveScene, renders, features]
  );

  const saveScene = () => {
    const meaningful = scene.funcs.some((f) => f.src.trim() !== '');
    if (!meaningful) {
      toast('info', 'Scrivi almeno una funzione prima di salvare');
      return;
    }
    const { expr, result } = sceneSummary(scene);
    history.add({
      mode: 'graph',
      expr,
      result,
      scene: JSON.parse(JSON.stringify({ ...scene, sliders: scene.sliders.map((s) => ({ ...s, playing: false })) })),
    });
    toast('success', 'Grafico salvato in cronologia');
  };

  const toolChip = (
    key: 'zeros' | 'extrema' | 'intersections' | 'inflections',
    label: string,
    Icon: typeof CircleDot
  ) => (
    <button
      type="button"
      className={clsx('graph-chip', scene.tools[key] && 'active')}
      aria-pressed={scene.tools[key]}
      onClick={() => setScene((s) => ({ ...s, tools: { ...s.tools, [key]: !s.tools[key] } }))}
    >
      <Icon size={13} aria-hidden="true" /> {label}
    </button>
  );

  const showTable = config.graphing.table;
  const showHistory = history.enabled;

  return (
    <div className={clsx('graph-stage', fs && 'is-fs')}>
      <div className="graph-topbar">
        <div className="seg" role="radiogroup" aria-label="Unità angoli">
          {(['rad', 'deg'] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={clsx('seg-btn', scene.angleMode === m && 'active')}
              onClick={() => setScene((s) => ({ ...s, angleMode: m }))}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        {features.analysis && (
          <div className="graph-chips" role="group" aria-label="Punti notevoli">
            {toolChip('zeros', 'Zeri', CircleDot)}
            {toolChip('extrema', 'Max/min', ArrowUpDown)}
            {toolChip('inflections', 'Flessi', Spline)}
            {toolChip('intersections', 'Intersezioni', Combine)}
          </div>
        )}

        <span className="graph-topbar-spacer" />

        {showHistory && (
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-inline"
            onClick={saveScene}
            title="Salva il grafico in cronologia"
          >
            <BookmarkPlus size={14} /> <span className="graph-btn-label">Salva</span>
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-inline"
          onClick={() => setExportOpen(true)}
          title="Esporta come immagine PNG o JPEG"
        >
          <ImageDown size={14} /> <span className="graph-btn-label">Esporta</span>
        </button>
        <button
          type="button"
          className={clsx('btn btn-ghost btn-sm btn-inline', board && 'is-active-tool')}
          onClick={() => setBoard((v) => !v)}
          title="Modalità lavagna: tratti e caratteri ingranditi per la proiezione"
          aria-pressed={board}
        >
          <Presentation size={14} /> <span className="graph-btn-label">Lavagna</span>
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-inline"
          onClick={() => setFs((v) => !v)}
          title={fs ? 'Esci dallo schermo intero' : 'Schermo intero'}
          aria-label={fs ? 'Esci dallo schermo intero' : 'Schermo intero'}
        >
          {fs ? <Minimize size={14} /> : <Maximize size={14} />}
        </button>
      </div>

      <div className="graph-body">
        <aside className="graph-side">
          <div className="graph-tabs" role="tablist" aria-label="Pannelli">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'fn'}
              className={clsx('graph-tab', tab === 'fn' && 'active')}
              onClick={() => setTab('fn')}
            >
              <FunctionSquare size={14} aria-hidden="true" /> Funzioni
            </button>
            {showTable && (
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'table'}
                className={clsx('graph-tab', tab === 'table' && 'active')}
                onClick={() => setTab('table')}
              >
                <Table2 size={14} aria-hidden="true" /> Tabella
              </button>
            )}
            {showHistory && (
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'history'}
                className={clsx('graph-tab', tab === 'history' && 'active')}
                onClick={() => setTab('history')}
              >
                <History size={14} aria-hidden="true" /> Cronologia
              </button>
            )}
          </div>
          <div className="graph-side-scroll">
            {tab === 'fn' && (
              <FunctionList
                store={store}
                renders={renders}
                features={features}
                slidersEnabled={config.graphing.sliders}
                permissions={permissions}
              />
            )}
            {tab === 'table' && showTable && <ValueTable store={store} renders={renders} />}
            {tab === 'history' && showHistory && (
              <HistoryPanel history={history} onRecall={onRecallEntry} embedded />
            )}
          </div>
          <div className="graph-side-foot">
            <ChartSpline size={12} aria-hidden="true" />
            Trascina = sposta · rotella/pizzico = zoom · Shift+trascina = zoom su area · clic su un punto
            notevole = fissa l'etichetta.
          </div>
        </aside>

        <PlotCanvas store={store} renders={renders} notables={notables} board={board} />
      </div>

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        scene={scene}
        permissions={permissions}
        vars={vars}
        features={features}
        plotW={EXPORT_W}
        plotH={EXPORT_H}
        userName={userName}
      />
    </div>
  );
}
