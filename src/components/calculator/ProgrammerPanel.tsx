import { useCallback, useMemo, useState } from 'react';
import { Delete } from 'lucide-react';
import { CalcError } from '../../lib/engine/evaluator';
import {
  BASES,
  digitsForBase,
  formatInBase,
  groupedBinary,
  maxForWord,
  parseInBase,
  progApply,
  toSigned,
  PROG_OP_LABEL,
  isUnary,
  type Base,
  type ProgOp,
  type WordSize,
} from '../../lib/engine/bases';
import type { CalcConfig } from '../../lib/config';
import { Key } from './Key';

interface Props {
  config: CalcConfig;
}

const NUM_DIGITS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'];

/**
 * Modalità Programmatore: valore mostrato in 4 basi contemporaneamente,
 * input nella base attiva (clic sulla riga per cambiarla), word size a scelta,
 * operazioni bitwise e aritmetica intera con wrap a complemento a due.
 */
export function ProgrammerPanel({ config }: Props) {
  const { baseConv, bitwise } = config.programmer;

  const [bits, setBits] = useState<WordSize>(8);
  const [inputBase, setInputBase] = useState<Base>(baseConv ? 10 : 10);
  const [current, setCurrent] = useState('');
  const [acc, setAcc] = useState<bigint>(0n);
  const [pending, setPending] = useState<ProgOp | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shownValue = useMemo(() => {
    if (current !== '') {
      try {
        return parseInBase(current, inputBase);
      } catch {
        return 0n;
      }
    }
    return acc;
  }, [current, inputBase, acc]);

  const pressDigit = useCallback(
    (d: string) => {
      setError(null);
      const candidate = current + d.toLowerCase();
      try {
        const v = parseInBase(candidate, inputBase);
        if (v > maxForWord(bits)) return; // oltre la word: ignora
        setCurrent(candidate);
      } catch {
        // cifra non valida nella base attiva: ignora
      }
    },
    [current, inputBase, bits]
  );

  const switchBase = useCallback(
    (b: Base) => {
      if (!baseConv || b === inputBase) return;
      setError(null);
      // Il valore digitato si conserva, cambiano le cifre.
      if (current !== '') {
        try {
          setCurrent(formatInBase(parseInBase(current, inputBase), b).toLowerCase());
        } catch {
          setCurrent('');
        }
      }
      setInputBase(b);
    },
    [baseConv, current, inputBase]
  );

  const switchBits = useCallback(
    (b: WordSize) => {
      setBits(b);
      setError(null);
      setAcc((a) => a & maxForWord(b));
      if (current !== '') {
        try {
          if (parseInBase(current, inputBase) > maxForWord(b)) setCurrent('');
        } catch {
          setCurrent('');
        }
      }
    },
    [current, inputBase]
  );

  const applyPendingWith = useCallback(
    (b: bigint): bigint => {
      if (pending === null) return b;
      return progApply(pending, acc, b, bits);
    },
    [pending, acc, bits]
  );

  const pressOp = useCallback(
    (op: ProgOp) => {
      setError(null);
      try {
        if (isUnary(op)) {
          const v = progApply(op, shownValue, 0n, bits);
          setAcc(v);
          setCurrent('');
          setPending(null);
          return;
        }
        // Concatena: se c'è già un'operazione in sospeso e un operando, applicala.
        const base = current !== '' ? applyPendingWith(parseInBase(current, inputBase)) : shownValue;
        setAcc(base);
        setCurrent('');
        setPending(op);
      } catch (e) {
        setError(e instanceof CalcError ? e.message : 'Errore');
      }
    },
    [shownValue, current, inputBase, bits, applyPendingWith]
  );

  const equals = useCallback(() => {
    if (pending === null || current === '') return;
    setError(null);
    try {
      const r = applyPendingWith(parseInBase(current, inputBase));
      setAcc(r);
      setCurrent('');
      setPending(null);
    } catch (e) {
      setError(e instanceof CalcError ? e.message : 'Errore');
    }
  }, [pending, current, inputBase, applyPendingWith]);

  const clearAll = useCallback(() => {
    setAcc(0n);
    setCurrent('');
    setPending(null);
    setError(null);
  }, []);

  const backspace = useCallback(() => {
    setError(null);
    setCurrent((c) => c.slice(0, -1));
  }, []);

  const validDigits = useMemo(() => new Set(digitsForBase(inputBase)), [inputBase]);
  const rows = baseConv ? BASES : BASES.filter((b) => b.base === 10);

  return (
    <div>
      <div className="pad-toolbar">
        <div className="seg" role="radiogroup" aria-label="Dimensione word">
          {([8, 16, 32] as WordSize[]).map((b) => (
            <button
              key={b}
              type="button"
              className={`seg-btn${bits === b ? ' active' : ''}`}
              onClick={() => switchBits(b)}
            >
              {b} bit
            </button>
          ))}
        </div>
        <span className="muted" style={{ fontSize: 11.5 }}>
          signed: {toSigned(shownValue, bits).toString()}
        </span>
      </div>

      <div className="prog-pending">
        {pending !== null ? `${formatInBase(acc, inputBase)} ${PROG_OP_LABEL[pending]} …` : ' '}
        {error && <span style={{ color: 'var(--error)', fontWeight: 600 }}> {error}</span>}
      </div>

      <div className="prog-rows">
        {rows.map(({ base, label }) => (
          <button
            key={base}
            type="button"
            className={`prog-row${inputBase === base ? ' active' : ''}`}
            onClick={() => switchBase(base)}
            title={baseConv ? `Scrivi in base ${base}` : undefined}
          >
            <span className="prog-base">{label}</span>
            <span className="prog-val">
              {base === 2 ? groupedBinary(shownValue, bits) : formatInBase(shownValue, base)}
            </span>
          </button>
        ))}
      </div>

      <div className="prog-layout">
        <div className="prog-digits">
          <Key label="AC" variant="danger" onPress={clearAll} />
          <Key label={<Delete size={18} />} variant="op" onPress={backspace} ariaLabel="Cancella cifra" />
          <Key label="E" onPress={() => pressDigit('E')} disabled={!validDigits.has('E')} />
          <Key label="F" onPress={() => pressDigit('F')} disabled={!validDigits.has('F')} />
          <Key label="A" onPress={() => pressDigit('A')} disabled={!validDigits.has('A')} />
          <Key label="B" onPress={() => pressDigit('B')} disabled={!validDigits.has('B')} />
          <Key label="C" onPress={() => pressDigit('C')} disabled={!validDigits.has('C')} />
          <Key label="D" onPress={() => pressDigit('D')} disabled={!validDigits.has('D')} />
          {NUM_DIGITS.map((d) => (
            <Key
              key={d}
              label={d}
              wide={d === '0'}
              onPress={() => pressDigit(d)}
              disabled={!validDigits.has(d)}
            />
          ))}
          <Key label="=" variant="eq" onPress={equals} />
        </div>

        <div className="prog-ops">
          {bitwise && (
            <>
              <Key label="AND" variant="fn" smallLabel onPress={() => pressOp('AND')} />
              <Key label="OR" variant="fn" smallLabel onPress={() => pressOp('OR')} />
              <Key label="XOR" variant="fn" smallLabel onPress={() => pressOp('XOR')} />
              <Key label="NOT" variant="fn" smallLabel onPress={() => pressOp('NOT')} />
              <Key label="<<" variant="fn" smallLabel onPress={() => pressOp('SHL')} />
              <Key label=">>" variant="fn" smallLabel onPress={() => pressOp('SHR')} />
            </>
          )}
          <Key label="+" variant="op" onPress={() => pressOp('ADD')} />
          <Key label="−" variant="op" onPress={() => pressOp('SUB')} />
          <Key label="×" variant="op" onPress={() => pressOp('MUL')} />
          <Key label="÷" variant="op" onPress={() => pressOp('DIV')} />
          <Key label="MOD" variant="op" smallLabel onPress={() => pressOp('MOD')} />
        </div>
      </div>
    </div>
  );
}
