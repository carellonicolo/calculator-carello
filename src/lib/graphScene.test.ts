import { describe, it, expect } from 'vitest';
import {
  defaultScene,
  funcLabel,
  makeFunction,
  nextColor,
  sanitizeScene,
  sceneSummary,
  PALETTE,
  MAX_FUNCS,
} from './graphScene';

describe('sanitizeScene', () => {
  it('round-trip: una scena valida resta identica nei campi importanti', () => {
    const scene = defaultScene('x^2');
    scene.funcs.push(
      makeFunction({ color: PALETTE[1], kind: 'polar', src: '1+cos(θ)', tMin: 0, tMax: 6.28 })
    );
    scene.sliders.push({ name: 'a', value: 2, min: -5, max: 5, step: 0.1, playing: true });
    const out = sanitizeScene(JSON.parse(JSON.stringify(scene)));
    expect(out).not.toBeNull();
    expect(out?.funcs).toHaveLength(2);
    expect(out?.funcs[1].kind).toBe('polar');
    expect(out?.funcs[1].src).toBe('1+cos(θ)');
    expect(out?.sliders[0]).toMatchObject({ name: 'a', value: 2, playing: false });
    expect(out?.view).toEqual(scene.view);
  });

  it('payload legacy (singola funzione) → scena valida', () => {
    const out = sanitizeScene({
      funcs: [{ kind: 'explicit', src: 'sin(x)', color: PALETTE[0] }],
      view: { xMin: -5, xMax: 5, yMin: -6.25, yMax: 6.25 },
    });
    expect(out).not.toBeNull();
    expect(out?.funcs[0].src).toBe('sin(x)');
    expect(out?.view.xMin).toBe(-5);
    expect(out?.angleMode).toBe('rad');
  });

  it('spazzatura → null; vista degenere → default', () => {
    expect(sanitizeScene(null)).toBeNull();
    expect(sanitizeScene({ funcs: [] })).toBeNull();
    expect(sanitizeScene('ciao')).toBeNull();
    const out = sanitizeScene({
      funcs: [{ src: 'x' }],
      view: { xMin: 10, xMax: -10, yMin: 0, yMax: 0 },
    });
    expect(out?.view.xMax).toBeGreaterThan(out?.view.xMin as number);
    expect(out?.view.yMax).toBeGreaterThan(out?.view.yMin as number);
  });

  it('tronca a MAX_FUNCS e ripara i colori non validi', () => {
    const funcs = Array.from({ length: 12 }, (_, i) => ({ src: `x+${i}`, color: 'rosso' }));
    const out = sanitizeScene({ funcs, view: { xMin: -1, xMax: 1, yMin: -1, yMax: 1 } });
    expect(out?.funcs).toHaveLength(MAX_FUNCS);
    for (const f of out?.funcs ?? []) {
      expect(f.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe('etichette e riassunti', () => {
  it('funcLabel per i tre tipi', () => {
    expect(funcLabel(makeFunction({ color: '#000000', src: 'x^2' }))).toBe('y = x^2');
    expect(funcLabel(makeFunction({ color: '#000000', kind: 'polar', src: '2θ' }))).toBe('r = 2θ');
    expect(
      funcLabel(makeFunction({ color: '#000000', kind: 'parametric', src: 'cos(t)', srcY: 'sin(t)' }))
    ).toBe('x = cos(t) · y = sin(t)');
  });

  it('sceneSummary conta le funzioni e mostra la finestra', () => {
    const scene = defaultScene('sin(x)');
    scene.funcs.push(makeFunction({ color: PALETTE[1], src: 'x' }));
    scene.funcs.push(makeFunction({ color: PALETTE[2], src: '' })); // vuota: non conta
    const { expr, result } = sceneSummary(scene);
    expect(expr).toBe('y = sin(x) (+1)');
    expect(result).toBe('x ∈ [-10; 10]');
  });

  it('nextColor evita i colori già usati', () => {
    const funcs = [makeFunction({ color: PALETTE[0] }), makeFunction({ color: PALETTE[1] })];
    expect(nextColor(funcs)).toBe(PALETTE[2]);
  });
});
