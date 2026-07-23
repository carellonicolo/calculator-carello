import { describe, it, expect } from 'vitest';
import {
  evaluate,
  compile,
  formatResult,
  fullPermissions,
  CalcError,
  CalcPermissionError,
  type EnginePermissions,
} from './evaluator';

const rad = { angleMode: 'rad' as const, permissions: fullPermissions() };
const deg = { angleMode: 'deg' as const, permissions: fullPermissions() };

describe('evaluate — nuove funzioni scientifiche', () => {
  it('iperboliche inverse', () => {
    expect(evaluate('asinh(0)', rad)).toBe(0);
    expect(evaluate('acosh(1)', rad)).toBe(0);
    expect(evaluate('atanh(0)', rad)).toBe(0);
    expect(() => evaluate('acosh(0.5)', rad)).toThrow(CalcError);
    expect(() => evaluate('atanh(1)', rad)).toThrow(CalcError);
  });

  it('logaritmo in base arbitraria', () => {
    expect(evaluate('logb(2; 8)', rad)).toBeCloseTo(3, 10);
    expect(evaluate('logb(10; 1000)', rad)).toBeCloseTo(3, 10);
    expect(() => evaluate('logb(1; 5)', rad)).toThrow(CalcError);
    expect(() => evaluate('logb(2; -1)', rad)).toThrow(CalcError);
  });

  it('radice n-esima, indice dispari su negativi', () => {
    expect(evaluate('root(3; 27)', rad)).toBeCloseTo(3, 10);
    expect(evaluate('root(3; -8)', rad)).toBeCloseTo(-2, 10);
    expect(() => evaluate('root(2; -4)', rad)).toThrow(CalcError);
  });

  it('modulo con segno del divisore', () => {
    expect(evaluate('mod(7; 3)', rad)).toBe(1);
    expect(evaluate('mod(-1; 3)', rad)).toBe(2);
    expect(() => evaluate('mod(5; 0)', rad)).toThrow(CalcError);
  });

  it('combinazioni e disposizioni', () => {
    expect(evaluate('ncr(5; 2)', rad)).toBe(10);
    expect(evaluate('npr(5; 2)', rad)).toBe(20);
    expect(evaluate('ncr(10; 0)', rad)).toBe(1);
    expect(() => evaluate('ncr(2; 5)', rad)).toThrow(CalcError);
    expect(() => evaluate('ncr(2,5; 1)', rad)).toThrow(CalcError);
  });
});

describe('evaluate — aritmetica', () => {
  it('rispetta le precedenze', () => {
    expect(evaluate('2+3*4', rad)).toBe(14);
    expect(evaluate('(2+3)*4', rad)).toBe(20);
    expect(evaluate('10-4-3', rad)).toBe(3);
    expect(evaluate('20/4/5', rad)).toBe(1);
  });

  it('potenza associativa a destra e meno unario', () => {
    expect(evaluate('2^3^2', rad)).toBe(512);
    expect(evaluate('-2^2', rad)).toBe(-4);
    expect(evaluate('(-2)^2', rad)).toBe(4);
    expect(evaluate('-3+5', rad)).toBe(2);
  });

  it('moltiplicazione implicita', () => {
    expect(evaluate('2(3+4)', rad)).toBe(14);
    expect(evaluate('2pi', rad)).toBeCloseTo(2 * Math.PI, 12);
    expect(evaluate('3sqrt(4)', rad)).toBe(6);
  });

  it('percentuale e fattoriale', () => {
    expect(evaluate('50%', rad)).toBe(0.5);
    expect(evaluate('5!', rad)).toBe(120);
    expect(evaluate('0!', rad)).toBe(1);
    expect(evaluate('3!!', rad)).toBe(720);
    expect(() => evaluate('2.5!', rad)).toThrow(CalcError);
    expect(() => evaluate('(-1)!', rad)).toThrow(CalcError);
  });

  it('errori di sintassi e dominio', () => {
    expect(() => evaluate('', rad)).toThrow(CalcError);
    expect(() => evaluate('2+', rad)).toThrow(CalcError);
    expect(() => evaluate('(2+3', rad)).toThrow(CalcError);
    expect(() => evaluate('1/0', rad)).toThrow('Divisione per zero');
    expect(() => evaluate('sqrt(-1)', rad)).toThrow(CalcError);
    expect(() => evaluate('ln(0)', rad)).toThrow(CalcError);
    expect(() => evaluate('asin(2)', rad)).toThrow(CalcError);
    expect(() => evaluate('boh(1)', rad)).toThrow('sconosciut');
  });
});

describe('evaluate — funzioni e angoli', () => {
  it('gradi vs radianti', () => {
    expect(evaluate('sin(90)', deg)).toBeCloseTo(1, 12);
    expect(evaluate('cos(180)', deg)).toBeCloseTo(-1, 12);
    expect(evaluate('sin(pi/2)', rad)).toBeCloseTo(1, 12);
    expect(evaluate('atan(1)', deg)).toBeCloseTo(45, 12);
  });

  it('logaritmi, radici, esponenziali', () => {
    expect(evaluate('ln(e)', rad)).toBeCloseTo(1, 12);
    expect(evaluate('log(1000)', rad)).toBeCloseTo(3, 12);
    expect(evaluate('sqrt(16)', rad)).toBe(4);
    expect(evaluate('cbrt(-27)', rad)).toBe(-3);
    expect(evaluate('exp(0)', rad)).toBe(1);
    expect(evaluate('abs(-5)', rad)).toBe(5);
  });
});

describe('evaluate — permessi docente', () => {
  function restricted(over: Partial<EnginePermissions>): EnginePermissions {
    return { ...fullPermissions(), ...over };
  }

  it('funzione disattivata → CalcPermissionError', () => {
    const perms = restricted({ functions: new Set(['cos']) });
    expect(() => evaluate('sin(1)', { angleMode: 'rad', permissions: perms })).toThrow(
      CalcPermissionError
    );
    expect(evaluate('cos(0)', { angleMode: 'rad', permissions: perms })).toBe(1);
  });

  it('costanti / potenza / percento / fattoriale disattivati', () => {
    const noConst = { angleMode: 'rad' as const, permissions: restricted({ constants: false }) };
    expect(() => evaluate('pi', noConst)).toThrow(CalcPermissionError);
    const noPow = { angleMode: 'rad' as const, permissions: restricted({ power: false }) };
    expect(() => evaluate('2^3', noPow)).toThrow(CalcPermissionError);
    const noPct = { angleMode: 'rad' as const, permissions: restricted({ percent: false }) };
    expect(() => evaluate('50%', noPct)).toThrow(CalcPermissionError);
    const noFact = { angleMode: 'rad' as const, permissions: restricted({ factorial: false }) };
    expect(() => evaluate('5!', noFact)).toThrow(CalcPermissionError);
  });
});

describe('compile — variabili per i grafici', () => {
  it('valuta f(x) su più punti', () => {
    const f = compile('x^2+1', { ...rad, variables: ['x'] });
    expect(f({ x: 0 })).toBe(1);
    expect(f({ x: 3 })).toBe(10);
  });

  it('x non ammessa fuori dai grafici', () => {
    expect(() => evaluate('x+1', rad)).toThrow(CalcError);
  });
});

describe('formatResult', () => {
  it('elimina il rumore floating point', () => {
    expect(formatResult(0.1 + 0.2)).toBe('0.3');
    expect(formatResult(0.30000000000000004)).toBe('0.3');
  });

  it('numeri normali e notazione esponenziale', () => {
    expect(formatResult(42)).toBe('42');
    expect(formatResult(-1.5)).toBe('-1.5');
    expect(formatResult(1e15)).toBe('1e15');
    expect(formatResult(0.0000000001)).toBe('1e-10');
    expect(formatResult(0)).toBe('0');
    expect(formatResult(-0)).toBe('0');
  });
});
