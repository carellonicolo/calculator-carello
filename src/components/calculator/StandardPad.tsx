import { Delete } from 'lucide-react';
import type { CalcConfig } from '../../lib/config';
import type { Calculator } from '../../hooks/useCalculator';
import { Key } from './Key';

interface Props {
  calc: Calculator;
  config: CalcConfig;
}

/**
 * Tastiera Standard (usata anche come blocco numerico della Scientifica).
 * I tasti dei gruppi disattivati diventano celle fantasma con lucchetto:
 * lo studente capisce che il tasto manca per scelta del docente.
 */
export function StandardPad({ calc, config }: Props) {
  const { standard } = config;
  return (
    <div className="pad-grid">
      {standard.memory && (
        <>
          <Key label="MC" variant="mem" onPress={calc.memClear} title="Azzera memoria" />
          <Key label="MR" variant="mem" onPress={calc.memRecall} title="Richiama memoria" />
          <Key label="M−" variant="mem" onPress={() => calc.memAdd(-1)} title="Sottrai dalla memoria" />
          <Key label="M+" variant="mem" onPress={() => calc.memAdd(1)} title="Aggiungi alla memoria" />
        </>
      )}

      <Key label="AC" variant="danger" onPress={calc.clearAll} ariaLabel="Cancella tutto" />
      <Key label={<Delete size={18} />} variant="op" onPress={calc.backspace} ariaLabel="Cancella ultimo" />
      <Key label="(" variant="op" onPress={() => calc.pressToken('(')} />
      <Key label=")" variant="op" onPress={() => calc.pressToken(')')} />

      {standard.percent ? (
        <Key label="%" variant="op" onPress={() => calc.pressToken('%')} title="Percento: 50% = 0,5" />
      ) : (
        <Key label="%" ghost />
      )}
      {standard.sqrt ? (
        <Key label="√" variant="op" onPress={() => calc.pressToken('sqrt(', '√(')} />
      ) : (
        <Key label="√" ghost />
      )}
      <Key label="±" variant="op" onPress={calc.toggleSign} ariaLabel="Cambia segno" />
      <Key label="÷" variant="op" onPress={() => calc.pressToken('/', '÷')} />

      <Key label="7" onPress={() => calc.pressDigit('7')} />
      <Key label="8" onPress={() => calc.pressDigit('8')} />
      <Key label="9" onPress={() => calc.pressDigit('9')} />
      <Key label="×" variant="op" onPress={() => calc.pressToken('*', '×')} />

      <Key label="4" onPress={() => calc.pressDigit('4')} />
      <Key label="5" onPress={() => calc.pressDigit('5')} />
      <Key label="6" onPress={() => calc.pressDigit('6')} />
      <Key label="−" variant="op" onPress={() => calc.pressToken('-', '−')} />

      <Key label="1" onPress={() => calc.pressDigit('1')} />
      <Key label="2" onPress={() => calc.pressDigit('2')} />
      <Key label="3" onPress={() => calc.pressDigit('3')} />
      <Key label="+" variant="op" onPress={() => calc.pressToken('+')} />

      <Key label="0" wide onPress={() => calc.pressDigit('0')} />
      <Key label="," onPress={() => calc.pressDigit('.')} ariaLabel="Virgola decimale" />
      <Key label="=" variant="eq" onPress={calc.equals} ariaLabel="Uguale" />
    </div>
  );
}
