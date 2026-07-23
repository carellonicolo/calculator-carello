import { describe, it, expect } from 'vitest';
import { parseNumbers, computeStats, parsePairs, linearRegression } from './stats';
import { CalcError } from './evaluator';

describe('computeStats — nuovi indici', () => {
  it('quartili, IQR, moda e Σx²', () => {
    const s = computeStats([1, 2, 3, 4, 5]);
    expect(s.q1).toBeCloseTo(2, 10);
    expect(s.q3).toBeCloseTo(4, 10);
    expect(s.iqr).toBeCloseTo(2, 10);
    expect(s.sumSq).toBe(55);
    expect(s.mode).toEqual([]);
  });

  it('moda con valori ripetuti', () => {
    expect(computeStats([1, 2, 2, 3, 3]).mode).toEqual([2, 3]);
    expect(computeStats([4, 4, 4, 1]).mode).toEqual([4]);
  });

  it('coefficiente di variazione, null se media 0', () => {
    expect(computeStats([2, 4, 6]).cv).toBeCloseTo(computeStats([2, 4, 6]).popStd / 4, 10);
    expect(computeStats([-1, 1]).cv).toBeNull();
  });
});

describe('regressione lineare', () => {
  it('retta perfetta y = 2x + 1', () => {
    const { xs, ys } = parsePairs('0 1\n1 3\n2 5');
    const r = linearRegression(xs, ys);
    expect(r.slope).toBeCloseTo(2, 10);
    expect(r.intercept).toBeCloseTo(1, 10);
    expect(r.r2).toBeCloseTo(1, 10);
  });

  it('parsePairs rifiuta righe malformate', () => {
    expect(() => parsePairs('1 2 3')).toThrow(CalcError);
    expect(() => parsePairs('1 ciao')).toThrow(CalcError);
  });

  it('richiede almeno due coppie e x non tutte uguali', () => {
    expect(() => linearRegression([1], [2])).toThrow(CalcError);
    expect(() => linearRegression([3, 3], [1, 2])).toThrow(CalcError);
  });
});

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
