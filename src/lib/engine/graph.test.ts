import { describe, it, expect } from 'vitest';
import { fullPermissions, CalcPermissionError } from './evaluator';
import {
  sampleFunction,
  sampleParametric,
  samplePolar,
  sampleSequence,
  compileExplicit,
  detectParams,
} from './graph';

const base = { angleMode: 'rad' as const, permissions: fullPermissions() };

describe('sampleFunction', () => {
  it('campiona una retta senza buchi', () => {
    const s = sampleFunction('2x+1', { ...base, xMin: 0, xMax: 10, samples: 101 });
    expect(s.points).toHaveLength(101);
    expect(s.points.every((p) => p !== null)).toBe(true);
    expect(s.points[50]).toMatchObject({ x: 5, y: 11 });
  });

  it('usa i parametri passati come variabili extra', () => {
    const s = sampleFunction('a*x^2', { ...base, xMin: -2, xMax: 2, samples: 65, vars: { a: 3 } });
    const p = s.points.find((q) => q !== null && Math.abs(q.x - 2) < 1e-9);
    expect(p?.y).toBeCloseTo(12, 9);
  });

  it('propaga i permessi del docente', () => {
    const perms = { ...fullPermissions(), functions: new Set(['abs']) };
    expect(() =>
      sampleFunction('sin(x)', { angleMode: 'rad', permissions: perms, xMin: -1, xMax: 1 })
    ).toThrow(CalcPermissionError);
  });
});

describe('sampleParametric e samplePolar', () => {
  it('parametrica: circonferenza unitaria', () => {
    const { points } = sampleParametric('cos(t)', 'sin(t)', {
      ...base,
      tMin: 0,
      tMax: 2 * Math.PI,
      samples: 128,
    });
    for (const p of points) {
      expect(p).not.toBeNull();
      if (p) expect(Math.hypot(p.x, p.y)).toBeCloseTo(1, 9);
    }
  });

  it('polare: r = 2 è una circonferenza di raggio 2 (θ o t equivalenti)', () => {
    for (const src of ['2', '2+0θ', '2+0t']) {
      const { points } = samplePolar(src, { ...base, tMin: 0, tMax: 2 * Math.PI, samples: 64 });
      for (const p of points) {
        if (p) expect(Math.hypot(p.x, p.y)).toBeCloseTo(2, 9);
      }
    }
  });

  it('polare in gradi: θ interpretato nell’unità attiva', () => {
    const { points } = samplePolar('1', {
      angleMode: 'deg',
      permissions: fullPermissions(),
      tMin: 0,
      tMax: 360,
      samples: 65,
    });
    // step = 360/64 → points[16] è θ = 90° → punto (0, 1)
    expect(points[16]?.x).toBeCloseTo(0, 9);
    expect(points[16]?.y).toBeCloseTo(1, 9);
  });
});

describe('sampleSequence', () => {
  it('campiona solo gli interi della finestra', () => {
    const { points } = sampleSequence('n^2', { ...base, xMin: -2.7, xMax: 3.4 });
    expect(points.map((p) => p.x)).toEqual([-2, -1, 0, 1, 2, 3]);
    expect(points[5].y).toBe(9);
  });

  it('salta gli n fuori dominio senza errore', () => {
    const { points } = sampleSequence('1/n', { ...base, xMin: -2, xMax: 2 });
    expect(points.map((p) => p.x)).toEqual([-2, -1, 1, 2]);
  });

  it('usa i parametri degli slider', () => {
    const { points } = sampleSequence('k*n', { ...base, xMin: 1, xMax: 3, vars: { k: 2 } });
    expect(points.map((p) => p.y)).toEqual([2, 4, 6]);
  });

  it('finestra senza interi → nessun punto', () => {
    const { points } = sampleSequence('n', { ...base, xMin: 0.2, xMax: 0.8 });
    expect(points).toEqual([]);
  });
});

describe('spezzamento dei salti', () => {
  it('floor(x): i gradini NON sono collegati in verticale', () => {
    const s = sampleFunction('floor(x)', { ...base, xMin: 0, xMax: 5, samples: 200 });
    expect(s.points.some((p) => p === null)).toBe(true);
  });

  it('se(...) spezza al confine del tratto', () => {
    const s = sampleFunction('se(x<0; -5; 5)', { ...base, xMin: -3, xMax: 3, samples: 200 });
    expect(s.points.some((p) => p === null)).toBe(true);
  });

  it('le funzioni continue restano intere', () => {
    for (const src of ['sin(x)', 'x^3', 'exp(x)']) {
      const s = sampleFunction(src, { ...base, xMin: -6, xMax: 6, samples: 200 });
      expect(s.points.every((p) => p !== null)).toBe(true);
    }
  });
});

describe('compileExplicit', () => {
  it('valuta con parametri', () => {
    const f = compileExplicit('k*x + 1', { ...base, vars: { k: 2 } });
    expect(f(3)).toBe(7);
  });
});

describe('detectParams', () => {
  it('trova i parametri a lettera singola', () => {
    expect(detectParams('a*x^2 + b*x + c')).toEqual(['a', 'b', 'c']);
    expect(detectParams('k sin(x)')).toEqual(['k']);
  });

  it('ignora variabili note, costanti e funzioni', () => {
    expect(detectParams('sin(x) + pi + e + t + θ')).toEqual([]);
    expect(detectParams('x^2')).toEqual([]);
  });

  it('ignora i nomi lunghi (restano errori di sintassi)', () => {
    expect(detectParams('foo + a')).toEqual(['a']);
  });
});
