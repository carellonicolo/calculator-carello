import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowLeft, Bookmark, Plus, School, ShieldX } from 'lucide-react';
import {
  apiApplyPreset,
  apiDeleteClassConfig,
  apiDeletePreset,
  apiPutClassConfig,
  apiSavePreset,
  apiTeacherOverview,
  type TeacherOverview,
} from '../../lib/api';
import { redirectToLogin } from '../../lib/auth';
import { sanitizeConfig, type CalcConfig } from '../../lib/config';
import { useToast } from '../ui/Toast';
import { ClassCard } from '../admin/ClassCard';
import { PresetsSection } from '../admin/PresetsSection';
import { LiveSection } from '../admin/LiveSection';
import { LoadingScreen } from './GateScreens';

type Section = 'classi' | 'preset' | 'live';

const SAVE_DEBOUNCE_MS = 500;

/**
 * Console docente: configurazione per classe (salvataggio istantaneo con
 * debounce), preset riusabili, log utilizzi in diretta.
 */
export function AdminPage() {
  const { toast } = useToast();
  const [overview, setOverview] = useState<TeacherOverview | null>(null);
  const [gate, setGate] = useState<'loading' | 'ok' | 'forbidden'>('loading');
  const [section, setSection] = useState<Section>('classi');
  const [savingSet, setSavingSet] = useState<Set<string>>(new Set());
  const [newClass, setNewClass] = useState('');

  const timers = useRef(new Map<string, number>());

  const load = useCallback(async () => {
    const res = await apiTeacherOverview();
    if (res.ok && res.data) {
      setOverview(res.data);
      setGate('ok');
      return;
    }
    if (res.status === 401) {
      redirectToLogin();
      return;
    }
    if (res.status === 403) {
      setGate('forbidden');
      return;
    }
    toast('error', res.error ?? 'Errore di rete');
  }, [toast]);

  useEffect(() => {
    void load();
    const t = timers.current;
    return () => {
      for (const id of t.values()) window.clearTimeout(id);
      t.clear();
    };
  }, [load]);

  const markSaving = (key: string, on: boolean) => {
    setSavingSet((s) => {
      const next = new Set(s);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  /** Applica subito nello stato locale e salva (debounced) sul server. */
  const queueSave = useCallback(
    (cls: string, config: CalcConfig) => {
      setOverview((o) => {
        if (!o) return o;
        if (cls === '*') {
          return { ...o, defaultConfig: { ...o.defaultConfig, config, customized: true } };
        }
        const exists = o.classes.some((c) => c.class === cls);
        return {
          ...o,
          classes: exists
            ? o.classes.map((c) => (c.class === cls ? { ...c, config } : c))
            : [...o.classes, { class: cls, config, updatedAt: null }],
        };
      });
      markSaving(cls, true);
      const prev = timers.current.get(cls);
      if (prev) window.clearTimeout(prev);
      const id = window.setTimeout(async () => {
        timers.current.delete(cls);
        const res = await apiPutClassConfig(cls, config);
        markSaving(cls, false);
        if (res.ok) {
          toast('success', cls === '*' ? 'Predefinita salvata' : `Salvato · ${cls}`);
        } else {
          toast('error', res.error ?? 'Errore di salvataggio');
          void load();
        }
      }, SAVE_DEBOUNCE_MS);
      timers.current.set(cls, id);
    },
    [toast, load]
  );

  const resetClass = useCallback(
    async (cls: string) => {
      const res = await apiDeleteClassConfig(cls);
      if (res.ok) {
        toast('success', `${cls} torna alla configurazione predefinita`);
        void load();
      } else {
        toast('error', res.error ?? 'Errore');
      }
    },
    [toast, load]
  );

  const saveAsPreset = useCallback(
    async (name: string, config: CalcConfig) => {
      const res = await apiSavePreset(name, config);
      if (res.ok && res.data) {
        setOverview((o) => (o ? { ...o, presets: res.data!.presets } : o));
        toast('success', `Preset «${name}» salvato`);
      } else {
        toast('error', res.error ?? 'Errore');
      }
    },
    [toast]
  );

  const deletePreset = useCallback(
    async (id: number) => {
      const res = await apiDeletePreset(id);
      if (res.ok && res.data) {
        setOverview((o) => (o ? { ...o, presets: res.data!.presets } : o));
        toast('success', 'Preset eliminato');
      } else {
        toast('error', res.error ?? 'Errore');
      }
    },
    [toast]
  );

  const applyPreset = useCallback(
    async (presetId: number, classes: string[]) => {
      const res = await apiApplyPreset(presetId, classes);
      if (res.ok) {
        toast('success', `Preset applicato a: ${classes.map((c) => (c === '*' ? 'predefinita' : c)).join(', ')}`);
        void load();
      } else {
        toast('error', res.error ?? 'Errore');
      }
    },
    [toast, load]
  );

  const addClass = useCallback(() => {
    const cls = newClass.trim();
    if (!cls || !overview) return;
    if (cls.length > 40) {
      toast('error', 'Nome classe troppo lungo');
      return;
    }
    if (overview.classes.some((c) => c.class.toLowerCase() === cls.toLowerCase())) {
      toast('info', `La classe ${cls} è già in elenco`);
      return;
    }
    setNewClass('');
    queueSave(cls, sanitizeConfig(overview.defaultConfig.config));
  }, [newClass, overview, queueSave, toast]);

  if (gate === 'loading' || (gate === 'ok' && !overview)) return <LoadingScreen />;

  if (gate === 'forbidden') {
    return (
      <div className="gate-wrap">
        <div className="gate-icon">
          <ShieldX size={30} />
        </div>
        <h1 className="gate-title">Sezione riservata</h1>
        <p className="gate-text">La console di configurazione è riservata al docente.</p>
        <Link to="/" className="btn btn-secondary">
          Vai alla calcolatrice
        </Link>
      </div>
    );
  }

  const o = overview!;

  return (
    <>
      <div className="admin-topline" style={{ margin: '4px 0 14px' }}>
        <div>
          <h1 className="admin-title">Console docente</h1>
          <p className="admin-sub">
            Le modifiche arrivano alle calcolatrici aperte in pochi secondi, anche a verifica iniziata.
          </p>
        </div>
        <Link to="/" className="btn btn-ghost btn-sm btn-inline">
          <ArrowLeft size={14} /> Calcolatrice
        </Link>
      </div>

      <div className="sidebar-shell">
        <nav className="sidebar-nav">
          <div className="sidebar-group-label">Configurazione</div>
          <button
            type="button"
            className={`sidebar-item${section === 'classi' ? ' active' : ''}`}
            onClick={() => setSection('classi')}
          >
            <School size={17} />
            <span>Classi</span>
          </button>
          <button
            type="button"
            className={`sidebar-item${section === 'preset' ? ' active' : ''}`}
            onClick={() => setSection('preset')}
          >
            <Bookmark size={17} />
            <span>Preset</span>
            {o.presets.length > 0 && <span className="sidebar-badge">{o.presets.length}</span>}
          </button>
          <div className="sidebar-group-label">Monitoraggio</div>
          <button
            type="button"
            className={`sidebar-item${section === 'live' ? ' active' : ''}`}
            onClick={() => setSection('live')}
          >
            <Activity size={17} />
            <span>In diretta</span>
          </button>
        </nav>

        <div className="sidebar-content">
          {section === 'classi' && (
            <>
              <ClassCard
                cls={null}
                config={o.defaultConfig.customized ? o.defaultConfig.config : null}
                defaultConfig={o.defaultConfig.config}
                updatedAt={o.defaultConfig.updatedAt}
                saving={savingSet.has('*')}
                onChange={(cfg) => queueSave('*', cfg)}
                onSaveAsPreset={saveAsPreset}
              />

              {o.classes.map((c) => (
                <ClassCard
                  key={c.class}
                  cls={c.class}
                  config={c.config}
                  defaultConfig={o.defaultConfig.config}
                  updatedAt={c.updatedAt}
                  saving={savingSet.has(c.class)}
                  onChange={(cfg) => queueSave(c.class, cfg)}
                  onReset={() => void resetClass(c.class)}
                  onSaveAsPreset={saveAsPreset}
                />
              ))}

              <div className="rcard" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Aggiungi una classe (es. 3AI)"
                  value={newClass}
                  maxLength={40}
                  onChange={(e) => setNewClass(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addClass()}
                  style={{ width: 240 }}
                />
                <button type="button" className="btn btn-sm btn-inline" onClick={addClass}>
                  <Plus size={14} /> Aggiungi
                </button>
                <span className="muted">
                  Le classi compaiono da sole quando gli studenti accedono; aggiungila a mano solo se vuoi
                  prepararla in anticipo.
                </span>
              </div>
            </>
          )}

          {section === 'preset' && (
            <PresetsSection
              presets={o.presets}
              classes={o.classes.map((c) => c.class)}
              onApply={applyPreset}
              onDelete={(id) => void deletePreset(id)}
            />
          )}

          {section === 'live' && <LiveSection />}
        </div>
      </div>
    </>
  );
}
