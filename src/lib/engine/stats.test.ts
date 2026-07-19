import { describe, it, expect } from 'vitest';
import { parseNumbers, computeStats } from './stats';
import { CalcError } from './evaluator';

describe('parseNumbers', () => {
  it('accetta spazi, a capo, punto e virgola come separatori', () => {
    expect(parseNumbers('1 2 3')).toEqual([1, 2, 3]);
    expect(parseNumbers('1;2\n3')).toEqual([1, 2, 3]);
  });

  it('virgola decimale italiana e punto', () => {
    expect(parseNumbers('12,5 13.5')).toEqual([12.5, 13.5]);
    expect(parseNumbers('-1,5 +2')).toEqual([-1.5, 2]);
  });

  it('rifiuta token non numerici', () => {
    expect(() => parseNumbers('1 ciao 3')).toThrow(CalcError);
    expect(() => parseNumbers('1..2')).toThrow(CalcError);
  });
});

describe('computeStats', () => {
  it('indici principali', () => {
    const s = computeStats([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(s.count).toBe(8);
    expect(s.sum).toBe(40);
    expect(s.mean).toBe(5);
    expect(s.median).toBe(4.5);
    expect(s.min).toBe(2);
    expect(s.max).toBe(9);
    expect(s.range).toBe(7);
    expect(s.popVariance).toBe(4);
    expect(s.popStd).toBe(2);
    expect(s.sampleVariance).toBeCloseTo(32 / 7, 12);
  });

  it('mediana con n dispari e caso singolo', () => {
    expect(computeStats([3, 1, 2]).median).toBe(2);
    const single = computeStats([5]);
    expect(single.mean).toBe(5);
    expect(single.sampleVariance).toBeNull();
    expect(single.sampleStd).toBeNull();
  });

  it('serie vuota → errore', () => {
    expect(() => computeStats([])).toThrow(CalcError);
  });
});
