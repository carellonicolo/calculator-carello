import { describe, it, expect } from 'vitest';
import {
  evaluate,
  compile,
  fullPermissions,
  CalcError,
  CalcPermissionError,
} from './evaluator';

const rad = { angleMode: 'rad' as const, permissions: fullPermissions() };
const radX = { ...rad, variables: ['x'] };

describe('virgola decimale', () => {
  it('0,5 equivale a 0.5 ovunque', () => {
    expect(evaluate('0,5+1', rad)).toBe(1.5);
    expect(evaluate('2,5*2', rad)).toBe(5);
    expect(evaluate(',5*4', rad)).toBe(2);
    expect(compile('2,5x', radX)({ x: 2 })).toBe(5);
  });

  it('virgola usata come separatore → errore che suggerisce ";"', () => {
    expect(() => evaluate('se(1, 2, 3)', rad)).toThrow(/";"/);
  });

  it('doppio separatore decimale → numero non valido', () => {
    expect(() => evaluate('1,2,3', rad)).toThrow(CalcError);
    expect(() => evaluate('1.2,3', rad)).toThrow('Numero non valido');
  });
});

describe('confronti', () => {
  it('restituiscono 1/0 e legano meno di + e −', () => {
    expect(evaluate('(2<3)+(5>=5)', rad)).toBe(2);
    expect(evaluate('(1+1<3)', rad)).toBe(1);
    expect(evaluate('(2>3)', rad)).toBe(0);
  });

  it('accetta i simboli ≤ e ≥', () => {
    expect(evaluate('se(1≤2; 5; 0)', rad)).toBe(5);
    expect(evaluate('se(1≥2; 5; 0)', rad)).toBe(0);
  });
});

describe('se(...) — funzioni a tratti', () => {
  it('valore assoluto a tratti', () => {
    const f = compile('se(x<0; -x; x)', radX);
    expect(f({ x: -3 })).toBe(3);
    expect(f({ x: 4 })).toBe(4);
    expect(f({ x: 0 })).toBe(0);
  });

  it('è pigra: il ramo non scelto non viene valutato', () => {
    const f = compile('se(x>0; ln(x); 0)', radX);
    expect(f({ x: -5 })).toBe(0);
    expect(f({ x: 1 })).toBe(0);
  });

  it('si annida', () => {
    const f = compile('se(x<0; -1; se(x<2; 0; 1))', radX);
    expect(f({ x: -1 })).toBe(-1);
    expect(f({ x: 1 })).toBe(0);
    expect(f({ x: 5 })).toBe(1);
  });

  it('arità sbagliata → errore chiaro', () => {
    expect(() => evaluate('se(1; 2)', rad)).toThrow(/3 argomenti/);
    expect(() => evaluate('min(3)', rad)).toThrow(/almeno|da 2/);
  });
});

describe('min, max e nuove funzioni', () => {
  it('min/max con più argomenti (e decimali con virgola)', () => {
    expect(evaluate('min(3; 1; 2)', rad)).toBe(1);
    expect(evaluate('max(2,5; 2)', rad)).toBe(2.5);
  });

  it('floor, ceil, round, sign', () => {
    expect(evaluate('floor(2,7)', rad)).toBe(2);
    expect(evaluate('ceil(2,1)', rad)).toBe(3);
    expect(evaluate('round(2,5)', rad)).toBe(3);
    expect(evaluate('sign(-4)', rad)).toBe(-1);
    expect(evaluate('floor(-1,5)', rad)).toBe(-2);
  });

  it('iperboliche', () => {
    expect(evaluate('sinh(0)', rad)).toBe(0);
    expect(evaluate('cosh(0)', rad)).toBe(1);
    expect(evaluate('tanh(0)', rad)).toBe(0);
    expect(evaluate('cosh(1)^2 - sinh(1)^2', rad)).toBeCloseTo(1, 10);
  });

  it('i permessi bloccano le nuove funzioni come le vecchie', () => {
    const perms = { ...fullPermissions(), functions: new Set(['abs', 'se', 'min', 'max']) };
    const opts = { angleMode: 'rad' as const, permissions: perms };
    expect(() => evaluate('floor(2)', opts)).toThrow(CalcPermissionError);
    expect(() => evaluate('sinh(1)', opts)).toThrow(CalcPermissionError);
    expect(evaluate('se(1<2; min(1; 2); 0)', opts)).toBe(1);
  });
});
