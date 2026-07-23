/**
 * Modalità programmatore: conversioni di base e operazioni bitwise.
 * Tutto su BigInt con word size a complemento a due (8/16/32 bit):
 * i valori sono mostrati come unsigned nell'intervallo [0, 2^bits).
 */

import { CalcError } from './evaluator';

export type Base = 2 | 8 | 10 | 16;
export type WordSize = 8 | 16 | 32 | 64;

export const BASES: { base: Base; label: string; prefix: string }[] = [
  { base: 16, label: 'HEX', prefix: '0x' },
  { base: 10, label: 'DEC', prefix: '' },
  { base: 8, label: 'OCT', prefix: '0o' },
  { base: 2, label: 'BIN', prefix: '0b' },
];

const DIGITS = '0123456789abcdef';

/** Cifre valide per una base (per abilitare i tasti della tastiera). */
export function digitsForBase(base: Base): string[] {
  return DIGITS.slice(0, base).toUpperCase().split('');
}

export function maxForWord(bits: WordSize): bigint {
  return (1n << BigInt(bits)) - 1n;
}

/** Riporta un valore nell'intervallo unsigned della word (wrap a complemento a due). */
export function maskToWord(v: bigint, bits: WordSize): bigint {
  return v & maxForWord(bits);
}

/** Interpreta una stringa nella base data. Lancia CalcError su cifre non valide. */
export function parseInBase(text: string, base: Base): bigint {
  const t = text.trim().toLowerCase();
  if (t === '') throw new CalcError('Valore vuoto');
  let v = 0n;
  const B = BigInt(base);
  for (const ch of t) {
    const d = DIGITS.indexOf(ch);
    if (d === -1 || d >= base) throw new CalcError(`Cifra "${ch.toUpperCase()}" non valida in base ${base}`);
    v = v * B + BigInt(d);
  }
  return v;
}

/** Formatta un valore (unsigned) nella base data. HEX in maiuscolo. */
export function formatInBase(v: bigint, base: Base): string {
  const s = v.toString(base);
  return base === 16 ? s.toUpperCase() : s;
}

/** Binario a gruppi di 4 bit, riempito fino alla word (per il display). */
export function groupedBinary(v: bigint, bits: WordSize): string {
  const raw = v.toString(2).padStart(bits, '0');
  const groups: string[] = [];
  for (let i = 0; i < raw.length; i += 4) groups.push(raw.slice(i, i + 4));
  return groups.join(' ');
}

/** Valore interpretato come signed a complemento a due (per il display DEC signed). */
export function toSigned(v: bigint, bits: WordSize): bigint {
  const half = 1n << BigInt(bits - 1);
  return v >= half ? v - (1n << BigInt(bits)) : v;
}

export type ProgOp =
  | 'AND' | 'OR' | 'XOR' | 'NOT'
  | 'SHL' | 'SHR' | 'ROL' | 'ROR'
  | 'ADD' | 'SUB' | 'MUL' | 'DIV' | 'MOD';

/** Le operazioni unarie non chiedono il secondo operando. */
export function isUnary(op: ProgOp): boolean {
  return op === 'NOT';
}

/** Simbolo mostrato nel nastro operazione del display programmatore. */
export const PROG_OP_LABEL: Record<ProgOp, string> = {
  AND: 'AND',
  OR: 'OR',
  XOR: 'XOR',
  NOT: 'NOT',
  SHL: '<<',
  SHR: '>>',
  ROL: 'ROL',
  ROR: 'ROR',
  ADD: '+',
  SUB: '−',
  MUL: '×',
  DIV: '÷',
  MOD: 'MOD',
};

/**
 * Applica un'operazione della modalità programmatore. Il risultato è sempre
 * mascherato alla word (wrap). SHR è logico (unsigned). DIV è divisione intera.
 */
export function progApply(op: ProgOp, a: bigint, b: bigint, bits: WordSize): bigint {
  const mask = maxForWord(bits);
  switch (op) {
    case 'AND':
      return a & b;
    case 'OR':
      return a | b;
    case 'XOR':
      return a ^ b;
    case 'NOT':
      return ~a & mask;
    case 'SHL':
      if (b < 0n || b > BigInt(bits)) throw new CalcError(`Shift fuori intervallo (0–${bits})`);
      return (a << b) & mask;
    case 'SHR':
      if (b < 0n || b > BigInt(bits)) throw new CalcError(`Shift fuori intervallo (0–${bits})`);
      return a >> b;
    case 'ROL': {
      if (b < 0n) throw new CalcError('Rotazione negativa');
      const w = BigInt(bits);
      const r = ((b % w) + w) % w;
      return ((a << r) | (a >> (w - r))) & mask;
    }
    case 'ROR': {
      if (b < 0n) throw new CalcError('Rotazione negativa');
      const w = BigInt(bits);
      const r = ((b % w) + w) % w;
      return ((a >> r) | (a << (w - r))) & mask;
    }
    case 'ADD':
      return (a + b) & mask;
    case 'SUB':
      return (a - b) & mask;
    case 'MUL':
      return (a * b) & mask;
    case 'DIV':
      if (b === 0n) throw new CalcError('Divisione per zero');
      return a / b;
    case 'MOD':
      if (b === 0n) throw new CalcError('Divisione per zero');
      return a % b;
  }
}
