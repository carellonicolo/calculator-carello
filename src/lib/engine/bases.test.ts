import { describe, it, expect } from 'vitest';
import {
  parseInBase,
  formatInBase,
  groupedBinary,
  maskToWord,
  toSigned,
  progApply,
  digitsForBase,
} from './bases';
import { CalcError } from './evaluator';

describe('conversioni di base', () => {
  it('parse e format in tutte le basi', () => {
    expect(parseInBase('ff', 16)).toBe(255n);
    expect(parseInBase('FF', 16)).toBe(255n);
    expect(parseInBase('1010', 2)).toBe(10n);
    expect(parseInBase('777', 8)).toBe(511n);
    expect(parseInBase('42', 10)).toBe(42n);
    expect(formatInBase(255n, 16)).toBe('FF');
    expect(formatInBase(255n, 2)).toBe('11111111');
    expect(formatInBase(255n, 8)).toBe('377');
  });

  it('rifiuta cifre non valide per la base', () => {
    expect(() => parseInBase('12', 2)).toThrow(CalcError);
    expect(() => parseInBase('8', 8)).toThrow(CalcError);
    expect(() => parseInBase('G', 16)).toThrow(CalcError);
    expect(() => parseInBase('', 10)).toThrow(CalcError);
  });

  it('binario raggruppato a nibble', () => {
    expect(groupedBinary(255n, 8)).toBe('1111 1111');
    expect(groupedBinary(5n, 8)).toBe('0000 0101');
    expect(groupedBinary(65535n, 16)).toBe('1111 1111 1111 1111');
  });

  it('cifre per la tastiera', () => {
    expect(digitsForBase(2)).toEqual(['0', '1']);
    expect(digitsForBase(16)).toHaveLength(16);
  });
});

describe('word size e complemento a due', () => {
  it('mask e signed', () => {
    expect(maskToWord(256n, 8)).toBe(0n);
    expect(maskToWord(-1n, 8)).toBe(255n);
    expect(toSigned(255n, 8)).toBe(-1n);
    expect(toSigned(127n, 8)).toBe(127n);
    expect(toSigned(128n, 8)).toBe(-128n);
  });
});

describe('operazioni programmatore', () => {
  it('bitwise', () => {
    expect(progApply('AND', 0b1100n, 0b1010n, 8)).toBe(0b1000n);
    expect(progApply('OR', 0b1100n, 0b1010n, 8)).toBe(0b1110n);
    expect(progApply('XOR', 0b1100n, 0b1010n, 8)).toBe(0b0110n);
    expect(progApply('NOT', 0b0000_1111n, 0n, 8)).toBe(0b1111_0000n);
  });

  it('shift con wrap alla word', () => {
    expect(progApply('SHL', 0b1000_0000n, 1n, 8)).toBe(0n);
    expect(progApply('SHL', 1n, 3n, 8)).toBe(8n);
    expect(progApply('SHR', 0b1000n, 3n, 8)).toBe(1n);
    expect(() => progApply('SHL', 1n, 99n, 8)).toThrow(CalcError);
  });

  it('aritmetica intera con wrap', () => {
    expect(progApply('ADD', 255n, 1n, 8)).toBe(0n);
    expect(progApply('SUB', 0n, 1n, 8)).toBe(255n);
    expect(progApply('MUL', 16n, 16n, 8)).toBe(0n);
    expect(progApply('DIV', 7n, 2n, 8)).toBe(3n);
    expect(progApply('MOD', 7n, 2n, 8)).toBe(1n);
    expect(() => progApply('DIV', 1n, 0n, 8)).toThrow('Divisione per zero');
  });
});
