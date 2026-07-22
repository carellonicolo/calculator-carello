import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Eye,
  EyeOff,
  Keyboard,
  Pause,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import type { EnginePermissions } from '../../../lib/engine/evaluator';
import type { GraphSceneStore } from '../../../hooks/useGraphScene';
import { MAX_FUNCS, PALETTE, type GraphFunction, type StrokeStyle } from '../../../lib/graphScene';
import { fmtIt, type CurveRender, type GraphFeatures } from '../../../lib/graphDerived';

interface Props {
  store: GraphSceneStore;
  renders: CurveRender[];
  features: GraphFeatures;
  slidersEnabled: boolean;
  permissions: EnginePermissions;
}

const WIDTHS = [
  { v: 1.5, label: 'Fine' },
  { v: 2.5, label: 'Media' },
  { v: 4, label: 'Spessa' },
];

const STYLES: { v: StrokeStyle; label: string }[] = [
  { v: 'solid', label: '━' },
  { v: 'dashed', label: '╌ ╌' },
  { v: 'dotted', label: '· · ·' },
];

function NumInput({
  value,
  onCommit,
  ariaLabel,
  width = 74,
}: {
  value: number;
  onCommit: (v: number) => void;
  ariaLabel: string;
  width?: number;
}) {
  const [text, setText] = useState(String(value));
  const editing = useRef(false);
  useEffect(() => {
    if (!editing.current) setText(String(value));
  }, [value]);
  return (
    <input
      type="number"
      step="any"
      value={text}
      aria-label={ariaLabel}
      style={{ width }}
      onFocus={() => (editing.current = true)}
      onChange={(e) => {
        setText(e.target.value);
        const v = Number(e.target.value);
        if (e.target.value.trim() !== '' && Number.isFinite(v)) onCommit(v);
      }}
      onBlur={() => {
        editing.current = false;
        setText(String(value));
      }}
    />
  );
}

// --------------------------------------------- Input espressione + suggerimenti

interface ExprInputProps {
  fkey: string;
  value: string;
  placeholder: string;
  /** Nomi funzione disponibili (per l'autocompletamento). */
  allowed: string[];
  registerRef: (key: string, el: HTMLInputElement | null) => void;
  onFocusKey: (key: string) => void;
  commit: (key: string, next: string, caret?: number) => void;
}

function ExprInput({ fkey, value, placeholder, allowed, registerRef, onFocusKey, commit }: ExprInputProps) {
  const [sug, setSug] = useState<string[] | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const update = (val: string, caret: number | null) => {
    commit(fkey, val);
    if (caret == null) {
      setSug(null);
      return;
    }
    const m = val.slice(0, caret).match(/([a-zA-Z]{2,})$/);
    if (!m) {
      setSug(null);
      return;
    }
    const word = m[1].toLowerCase();
    const list = allowed.filter((n) => n.startsWith(word) && n !== word).slice(0, 6);
    setSug(list.length > 0 ? list : null);
  };

  const pick = (name: string) => {
    const el = inputRef.current;
    const caret = el?.selectionStart ?? value.length;
    const before = value.slice(0, caret).replace(/[a-zA-Z]+$/, '');
    const next = `${before}${name}(${value.slice(caret)}`;
    commit(fkey, next, before.length + name.length + 1);
    setSug(null);
  };

  return (
    <span className="fn-input-wrap">
      <input
        ref={(el) => {
          inputRef.current = el;
          registerRef(fkey, el);
        }}
        type="text"
        className="fn-input"
        value={value}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        placeholder={placeholder}
        onChange={(e) => update(e.target.value, e.target.selectionStart)}
        onFocus={() => onFocusKey(fkey)}
        onBlur={() => window.setTimeout(() => setSug(null), 150)}
        onKeyDown={(e) => {
          if (sug && (e.key === 'Tab' || e.key === 'Enter')) {
            e.preventDefault();
            pick(sug[0]);
            return;
          }
          if (e.key === 'Escape') setSug(null);
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
      {sug && (
        <div className="fn-sug" role="listbox">
          {sug.map((n) => (
            <button
              key={n}
              type="button"
              className="fn-sug-item"
              role="option"
              aria-selected={false}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(n);
              }}
            >
              {n}(
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

// ----------------------------------------------------- Tastiera matematica

function MathKeyboard({
  permissions,
  onInsert,
}: {
  permissions: EnginePermissions;
  onInsert: (t: string) => void;
}) {
  const FN_ORDER = [
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
    'ln', 'log', 'exp', 'sqrt', 'cbrt', 'abs',
    'floor', 'ceil', 'round', 'sign', 'se', 'min', 'max',
  ];
  const fns = FN_ORDER.filter((n) => permissions.functions.has(n));
  const base: { label: string; ins: string; ok?: boolean }[] = [
    { label: 'x', ins: 'x' },
    { label: 't', ins: 't' },
    { label: 'n', ins: 'n' },
    { label: 'θ', ins: 'θ' },
    { label: 'π', ins: 'π', ok: permissions.constants },
    { label: 'e', ins: 'e', ok: permissions.constants },
    { label: 'x²', ins: '^2', ok: permissions.power },
    { label: '^', ins: '^', ok: permissions.power },
    { label: '(', ins: '(' },
    { label: ')', ins: ')' },
    { label: ';', ins: ';' },
    { label: '<', ins: '<' },
    { label: '≤', ins: '≤' },
    { label: '>', ins: '>' },
    { label: '≥', ins: '≥' },
  ];
  return (
    <div className="mkb" aria-label="Tastiera matematica">
      <div className="mkb-row">
        {base
          .filter((k) => k.ok !== false)
          .map((k) => (
            <button
              key={k.label}
              type="button"
              className="mkb-key"
              onMouseDown={(e) => {
                e.preventDefault();
                onInsert(k.ins);
              }}
            >
              {k.label}
            </button>
          ))}
      </div>
      {fns.length > 0 && (
        <div className="mkb-row">
          {fns.map((n) => (
            <button
              key={n}
              type="button"
              className="mkb-key mkb-fn"
              onMouseDown={(e) => {
                e.preventDefault();
                onInsert(`${n}(`);
              }}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Elenco funzioni con stile, strumenti per-funzione e slider dei parametri. */
export function FunctionList({ store, renders, features, slidersEnabled, permissions }: Props) {
  const { scene, setScene, patchFunc, addFunc, removeFunc, patchSlider } = store;
  const [openId, setOpenId] = useState<string | null>(null);
  const [kbOpen, setKbOpen] = useState(false);
  const inputRefs = useRef(new Map<string, HTMLInputElement>());
  const kbTarget = useRef<string | null>(null);

  const allowedFns = useMemo(() => [...permissions.functions].sort(), [permissions]);

  const registerRef = (key: string, el: HTMLInputElement | null) => {
    if (el) inputRefs.current.set(key, el);
    else inputRefs.current.delete(key);
  };

  /** Applica il testo e (se richiesto) rimette il cursore dove serve. */
  const commitExpr = (key: string, next: string, caret?: number) => {
    const [id, field] = key.split('|');
    patchFunc(id, field === 'y' ? { srcY: next } : { src: next });
    if (caret != null) {
      requestAnimationFrame(() => {
        const el = inputRefs.current.get(key);
        el?.focus();
        el?.setSelectionRange(caret, caret);
      });
    }
  };

  /** Inserimento dalla tastiera matematica nel campo attivo (al cursore). */
  const insertToken = (text: string) => {
    const fallback = scene.funcs[0] ? `${scene.funcs[0].id}|x` : null;
    const key = kbTarget.current ?? fallback;
    if (!key) return;
    const [id, field] = key.split('|');
    const f = scene.funcs.find((q) => q.id === id);
    if (!f) return;
    const cur = field === 'y' ? f.srcY : f.src;
    const el = inputRefs.current.get(key);
    const start = el?.selectionStart ?? cur.length;
    const end = el?.selectionEnd ?? cur.length;
    commitExpr(key, cur.slice(0, start) + text + cur.slice(end), start + text.length);
  };

  // Animazione degli slider in ▶: un solo ciclo rAF per tutti.
  const playingKey = scene.sliders.filter((s) => s.playing).map((s) => s.name).join(',');
  const dirRef = useRef<Record<string, 1 | -1>>({});
  useEffect(() => {
    if (!playingKey) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setScene((s) => ({
        ...s,
        sliders: s.sliders.map((sl) => {
          if (!sl.playing) return sl;
          const dir = dirRef.current[sl.name] ?? 1;
          let v = sl.value + dir * ((sl.max - sl.min) / 4) * dt;
          if (v >= sl.max) {
            v = sl.max;
            dirRef.current[sl.name] = -1;
          } else if (v <= sl.min) {
            v = sl.min;
            dirRef.current[sl.name] = 1;
          }
          return { ...sl, value: v };
        }),
      }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playingKey, setScene]);

  const errorFor = (f: GraphFunction): string | null =>
    renders.find((r) => r.f.id === f.id)?.error ?? null;

  const prefixFor = (f: GraphFunction): string =>
    f.kind === 'polar' ? 'r(θ) =' : f.kind === 'parametric' ? 'x(t) =' : f.kind === 'sequence' ? 'aₙ =' : 'y =';

  const placeholderFor = (f: GraphFunction): string =>
    f.kind === 'polar'
      ? 'es. 1 + cos(θ)'
      : f.kind === 'parametric'
        ? 'es. cos(t)'
        : f.kind === 'sequence'
          ? 'es. 1/n'
          : 'es. se(x<0; -x; x^2)';

  const full = scene.funcs.length >= MAX_FUNCS;

  return (
    <div className="fn-list">
      {scene.funcs.map((f, idx) => {
        const err = errorFor(f);
        const open = openId === f.id;
        return (
          <div key={f.id} className={clsx('fn-row', !f.visible && 'is-hidden', err && 'has-error')}>
            <div className="fn-main">
              <button
                type="button"
                className="fn-dot"
                style={{ background: f.color }}
                title="Colore e stile"
                aria-label={`Stile della funzione ${idx + 1}`}
                onClick={() => setOpenId(open ? null : f.id)}
              />
              <span className="fn-prefix">{prefixFor(f)}</span>
              <ExprInput
                fkey={`${f.id}|x`}
                value={f.src}
                placeholder={placeholderFor(f)}
                allowed={allowedFns}
                registerRef={registerRef}
                onFocusKey={(k) => (kbTarget.current = k)}
                commit={commitExpr}
              />
              {f.kind === 'parametric' && (
                <>
                  <span className="fn-prefix">y(t) =</span>
                  <ExprInput
                    fkey={`${f.id}|y`}
                    value={f.srcY}
                    placeholder="es. sin(t)"
                    allowed={allowedFns}
                    registerRef={registerRef}
                    onFocusKey={(k) => (kbTarget.current = k)}
                    commit={commitExpr}
                  />
                </>
              )}
              <button
                type="button"
                className="fn-icon"
                title={f.visible ? 'Nascondi' : 'Mostra'}
                aria-label={f.visible ? 'Nascondi funzione' : 'Mostra funzione'}
                onClick={() => patchFunc(f.id, { visible: !f.visible })}
              >
                {f.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button
                type="button"
                className={clsx('fn-icon', open && 'active')}
                title="Opzioni"
                aria-label="Opzioni della funzione"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : f.id)}
              >
                <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }} />
              </button>
            </div>

            {err && <div className="fn-error">{err}</div>}

            {open && (
              <div className="fn-detail">
                <div className="fn-detail-row">
                  <span className="fn-detail-label">Colore</span>
                  <div className="fn-swatches">
                    {PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={clsx('fn-swatch', f.color === c && 'active')}
                        style={{ background: c }}
                        aria-label={`Colore ${c}`}
                        onClick={() => patchFunc(f.id, { color: c })}
                      />
                    ))}
                  </div>
                </div>
                <div className="fn-detail-row">
                  <span className="fn-detail-label">Tratto</span>
                  <div className="seg">
                    {WIDTHS.map((o) => (
                      <button
                        key={o.v}
                        type="button"
                        className={clsx('seg-btn', f.width === o.v && 'active')}
                        onClick={() => patchFunc(f.id, { width: o.v })}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  {f.kind !== 'sequence' && (
                    <div className="seg">
                      {STYLES.map((o) => (
                        <button
                          key={o.v}
                          type="button"
                          className={clsx('seg-btn', f.style === o.v && 'active')}
                          onClick={() => patchFunc(f.id, { style: o.v })}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {(f.kind === 'parametric' || f.kind === 'polar') && (
                  <div className="fn-detail-row">
                    <span className="fn-detail-label">{f.kind === 'polar' ? 'θ da' : 't da'}</span>
                    <NumInput value={f.tMin} ariaLabel="Inizio intervallo parametro" onCommit={(v) => patchFunc(f.id, { tMin: v })} />
                    <span className="fn-detail-label">a</span>
                    <NumInput value={f.tMax} ariaLabel="Fine intervallo parametro" onCommit={(v) => patchFunc(f.id, { tMax: v })} />
                  </div>
                )}

                {f.kind === 'explicit' && features.calculus && (
                  <>
                    <div className="fn-detail-row">
                      <label className="fn-check">
                        <input
                          type="checkbox"
                          checked={f.derivative}
                          onChange={(e) => patchFunc(f.id, { derivative: e.target.checked })}
                        />
                        Derivata f′(x)
                      </label>
                      <label className="fn-check">
                        <input
                          type="checkbox"
                          checked={f.tangent}
                          onChange={(e) => patchFunc(f.id, { tangent: e.target.checked })}
                        />
                        Tangente
                      </label>
                      <label className="fn-check">
                        <input
                          type="checkbox"
                          checked={f.integral}
                          onChange={(e) => patchFunc(f.id, { integral: e.target.checked })}
                        />
                        Area / integrale
                      </label>
                    </div>
                    {f.integral && (
                      <div className="fn-detail-row">
                        <span className="fn-detail-label">da</span>
                        <NumInput value={f.intA} ariaLabel="Estremo inferiore" onCommit={(v) => patchFunc(f.id, { intA: v })} />
                        <span className="fn-detail-label">a</span>
                        <NumInput value={f.intB} ariaLabel="Estremo superiore" onCommit={(v) => patchFunc(f.id, { intB: v })} />
                        <span className="fn-hint-inline">trascina le maniglie sull'asse x</span>
                      </div>
                    )}
                  </>
                )}

                <div className="fn-detail-row">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-inline fn-delete"
                    onClick={() => {
                      removeFunc(f.id);
                      setOpenId(null);
                    }}
                  >
                    <Trash2 size={13} /> Elimina funzione
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="fn-add-row">
        <button type="button" className="btn btn-ghost btn-sm btn-inline" disabled={full} onClick={() => addFunc('explicit')}>
          <Plus size={13} /> f(x)
        </button>
        {features.paramPolar && (
          <>
            <button type="button" className="btn btn-ghost btn-sm btn-inline" disabled={full} onClick={() => addFunc('parametric')}>
              <Plus size={13} /> param.
            </button>
            <button type="button" className="btn btn-ghost btn-sm btn-inline" disabled={full} onClick={() => addFunc('polar')}>
              <Plus size={13} /> polare
            </button>
          </>
        )}
        <button type="button" className="btn btn-ghost btn-sm btn-inline" disabled={full} onClick={() => addFunc('sequence')}>
          <Plus size={13} /> aₙ
        </button>
        <button
          type="button"
          className={clsx('fn-icon', kbOpen && 'active')}
          title="Tastiera matematica"
          aria-pressed={kbOpen}
          onClick={() => setKbOpen((v) => !v)}
        >
          <Keyboard size={15} />
        </button>
        <span className="fn-counter">
          {scene.funcs.length}/{MAX_FUNCS}
        </span>
      </div>

      {kbOpen && <MathKeyboard permissions={permissions} onInsert={insertToken} />}

      {slidersEnabled && scene.sliders.length > 0 && (
        <div className="slider-panel">
          <div className="slider-title">Parametri</div>
          {scene.sliders.map((sl) => (
            <div key={sl.name} className="slider-row">
              <div className="slider-head">
                <span className="slider-name">
                  {sl.name} = <b>{fmtIt(sl.value, 4)}</b>
                </span>
                <button
                  type="button"
                  className={clsx('fn-icon', sl.playing && 'active')}
                  title={sl.playing ? 'Ferma l’animazione' : 'Anima il parametro'}
                  aria-label={sl.playing ? 'Ferma animazione' : 'Anima parametro'}
                  onClick={() => patchSlider(sl.name, { playing: !sl.playing })}
                >
                  {sl.playing ? <Pause size={13} /> : <Play size={13} />}
                </button>
              </div>
              <input
                type="range"
                min={sl.min}
                max={sl.max}
                step={sl.step}
                value={sl.value}
                aria-label={`Valore di ${sl.name}`}
                onChange={(e) => patchSlider(sl.name, { value: Number(e.target.value), playing: false })}
              />
              <div className="slider-limits">
                <NumInput
                  value={sl.min}
                  width={62}
                  ariaLabel={`Minimo di ${sl.name}`}
                  onCommit={(v) => {
                    const min = Math.min(v, sl.max);
                    patchSlider(sl.name, { min, value: Math.max(min, sl.value) });
                  }}
                />
                <NumInput value={sl.step} width={56} ariaLabel={`Passo di ${sl.name}`} onCommit={(v) => v > 0 && patchSlider(sl.name, { step: v })} />
                <NumInput
                  value={sl.max}
                  width={62}
                  ariaLabel={`Massimo di ${sl.name}`}
                  onCommit={(v) => {
                    const max = Math.max(v, sl.min);
                    patchSlider(sl.name, { max, value: Math.min(max, sl.value) });
                  }}
                />
              </div>
            </div>
          ))}
          <div className="graph-hint" style={{ marginTop: 4 }}>
            Scrivi una lettera nella funzione (es. <code>a·x²+b</code>) e lo slider appare da solo.
          </div>
        </div>
      )}
    </div>
  );
}
