import { describe, it, expect } from 'vitest';
import { fullPermissions, CalcError } from './evaluator';
import { compileExplicit } from './graph';
import {
  findZeros,
  findExtrema,
  findIntersections,
  derivativeAt,
  tangentAt,
  integrate,
} from './analyze';

const base = { angleMode: 'rad' as const, permissions: fullPermissions() };
const f = (src: string, vars?: Record<string, number>) => compileExplicit(src, { ...base, vars });

describe('findZeros', () => {
  it('zeri di sin(x) in [−7, 7]: −2π, −π, 0, π, 2π', () => {
    const zeros = findZeros(f('sin(x)'), -7, 7);
    expect(zeros).toHaveLength(5);
    const expected = [-2 * Math.PI, -Math.PI, 0, Math.PI, 2 * Math.PI];
    zeros.forEach((z, i) => expect(z).toBeCloseTo(expected[i], 6));
  });

  it('parabola senza zeri reali → nessun risultato', () => {
    expect(findZeros(f('x^2+1'), -10, 10)).toEqual([]);
  });

  it('gestisce i buchi di dominio (ln)', () => {
    const zeros = findZeros(f('ln(x)'), -5, 5);
    expect(zeros).toHaveLength(1);
    expect(zeros[0]).toBeCloseTo(1, 6);
  });
});

describe('findExtrema', () => {
  it('minimo della parabola traslata', () => {
    const ext = findExtrema(f('(x-2)^2 + 3'), -10, 10);
    expect(ext).toHaveLength(1);
    expect(ext[0].kind).toBe('min');
    expect(ext[0].x).toBeCloseTo(2, 5);
    expect(ext[0].y).toBeCloseTo(3, 8);
  });

  it('massimi e minimi di sin(x)', () => {
    const ext = findExtrema(f('sin(x)'), 0, 2 * Math.PI);
    expect(ext).toHaveLength(2);
    expect(ext[0].kind).toBe('max');
    expect(ext[0].x).toBeCloseTo(Math.PI / 2, 5);
    expect(ext[1].kind).toBe('min');
    expect(ext[1].x).toBeCloseTo((3 * Math.PI) / 2, 5);
  });
});

describe('findIntersections', () => {
  it('x² ∩ x → (0,0) e (1,1)', () => {
    const pts = findIntersections(f('x^2'), f('x'), -5, 5);
    expect(pts).toHaveLength(2);
    expect(pts[0].x).toBeCloseTo(0, 6);
    expect(pts[1].x).toBeCloseTo(1, 6);
    expect(pts[1].y).toBeCloseTo(1, 6);
  });
});

describe('derivata e tangente', () => {
  it('derivata di x³ in 2 vale 12', () => {
    expect(derivativeAt(f('x^3'), 2)).toBeCloseTo(12, 5);
  });

  it('tangente a x² in x=1: y = 2x − 1', () => {
    const t = tangentAt(f('x^2'), 1);
    expect(t.m).toBeCloseTo(2, 5);
    expect(t.q).toBeCloseTo(-1, 5);
  });

  it('tangente fuori dominio → CalcError', () => {
    expect(() => tangentAt(f('sqrt(x)'), -4)).toThrow(CalcError);
  });
});

describe('integrate (Simpson)', () => {
  it('∫₀¹ x² dx = 1/3', () => {
    expect(integrate(f('x^2'), 0, 1)).toBeCloseTo(1 / 3, 9);
  });

  it('∫₀^π sin = 2 e l’inversione degli estremi cambia segno', () => {
    expect(integrate(f('sin(x)'), 0, Math.PI)).toBeCloseTo(2, 8);
    expect(integrate(f('sin(x)'), Math.PI, 0)).toBeCloseTo(-2, 8);
  });

  it('intervallo con buchi di dominio → CalcError', () => {
    expect(() => integrate(f('ln(x)'), -1, 1)).toThrow(CalcError);
  });

  it('con parametri slider', () => {
    expect(integrate(f('a*x', { a: 4 }), 0, 1)).toBeCloseTo(2, 9);
  });
});
