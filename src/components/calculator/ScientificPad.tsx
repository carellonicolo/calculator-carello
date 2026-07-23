import type { CalcConfig } from '../../lib/config';
import type { Calculator } from '../../hooks/useCalculator';
import { Key } from './Key';
import { StandardPad } from './StandardPad';

interface Props {
  calc: Calculator;
  config: CalcConfig;
}

/**
 * Modalità Scientifica: colonna funzioni (i gruppi spenti spariscono in
 * blocco) + blocco Standard. Il selettore DEG/RAD compare solo con la
 * trigonometria attiva.
 */
export function ScientificPad({ calc, config }: Props) {
  const sci = config.scientific;
  return (
    <div className="sci-layout">
      <div>
        <div className="pad-toolbar">
          {sci.trig ? (
            <div className="seg" role="radiogroup" aria-label="Unità angoli">
              <button
                type="button"
                className={`seg-btn${calc.angleMode === 'deg' ? ' active' : ''}`}
                onClick={() => calc.setAngleMode('deg')}
              >
                DEG
              </button>
              <button
                type="button"
                className={`seg-btn${calc.angleMode === 'rad' ? ' active' : ''}`}
                onClick={() => calc.setAngleMode('rad')}
              >
                RAD
              </button>
            </div>
          ) : (
            <span />
          )}
        </div>
        <div className="sci-fns">
          {sci.trig && (
            <>
              <Key label="sin" variant="fn" onPress={() => calc.pressToken('sin(', 'sin(')} />
              <Key label="cos" variant="fn" onPress={() => calc.pressToken('cos(', 'cos(')} />
              <Key label="tan" variant="fn" onPress={() => calc.pressToken('tan(', 'tan(')} />
              <Key label="sin⁻¹" variant="fn" onPress={() => calc.pressToken('asin(', 'sin⁻¹(')} />
              <Key label="cos⁻¹" variant="fn" onPress={() => calc.pressToken('acos(', 'cos⁻¹(')} />
              <Key label="tan⁻¹" variant="fn" onPress={() => calc.pressToken('atan(', 'tan⁻¹(')} />
              <Key label="sinh" variant="fn" onPress={() => calc.pressToken('sinh(', 'sinh(')} />
              <Key label="cosh" variant="fn" onPress={() => calc.pressToken('cosh(', 'cosh(')} />
              <Key label="tanh" variant="fn" onPress={() => calc.pressToken('tanh(', 'tanh(')} />
              <Key label="sinh⁻¹" variant="fn" smallLabel onPress={() => calc.pressToken('asinh(', 'sinh⁻¹(')} />
              <Key label="cosh⁻¹" variant="fn" smallLabel onPress={() => calc.pressToken('acosh(', 'cosh⁻¹(')} />
              <Key label="tanh⁻¹" variant="fn" smallLabel onPress={() => calc.pressToken('atanh(', 'tanh⁻¹(')} />
            </>
          )}
          {sci.logExp && (
            <>
              <Key label="ln" variant="fn" onPress={() => calc.pressToken('ln(', 'ln(')} />
              <Key label="log₁₀" variant="fn" onPress={() => calc.pressToken('log(', 'log(')} />
              <Key
                label="logₐb"
                variant="fn"
                smallLabel
                title="Logaritmo in base a: logₐb = logb(base; valore)"
                onPress={() => calc.pressToken('logb(', 'logₐ(')}
              />
              <Key label="eˣ" variant="fn" onPress={() => calc.pressToken('exp(', 'e^(')} />
              <Key label="10ˣ" variant="fn" onPress={() => calc.pressToken('pow10(', '10^(')} />
            </>
          )}
          {sci.powRoot && (
            <>
              <Key label="x²" variant="fn" onPress={() => calc.pressToken('^2', '²')} />
              <Key label="x³" variant="fn" onPress={() => calc.pressToken('^3', '³')} />
              <Key label="xʸ" variant="fn" onPress={() => calc.pressToken('^')} />
              <Key label="∛" variant="fn" onPress={() => calc.pressToken('cbrt(', '∛(')} />
              <Key
                label="ⁿ√"
                variant="fn"
                title="Radice n-esima: ⁿ√x = root(n; x)"
                onPress={() => calc.pressToken('root(', 'ⁿ√(')}
              />
              <Key label="¹⁄ₓ" variant="fn" onPress={() => calc.pressToken('1/(', '1/(')} />
            </>
          )}
          {sci.factorial && (
            <>
              <Key label="n!" variant="fn" onPress={() => calc.pressToken('!')} />
              <Key
                label="nCr"
                variant="fn"
                smallLabel
                title="Combinazioni: nCr = ncr(n; k)"
                onPress={() => calc.pressToken('ncr(', 'nCr(')}
              />
              <Key
                label="nPr"
                variant="fn"
                smallLabel
                title="Disposizioni: nPr = npr(n; k)"
                onPress={() => calc.pressToken('npr(', 'nPr(')}
              />
            </>
          )}
          {sci.rounding && (
            <>
              <Key label="floor" variant="fn" smallLabel onPress={() => calc.pressToken('floor(', 'floor(')} />
              <Key label="ceil" variant="fn" smallLabel onPress={() => calc.pressToken('ceil(', 'ceil(')} />
              <Key label="round" variant="fn" smallLabel onPress={() => calc.pressToken('round(', 'round(')} />
              <Key label="sign" variant="fn" smallLabel onPress={() => calc.pressToken('sign(', 'sign(')} />
              <Key
                label="mod"
                variant="fn"
                smallLabel
                title="Resto: mod(a; b)"
                onPress={() => calc.pressToken('mod(', 'mod(')}
              />
            </>
          )}
          {sci.constants && (
            <>
              <Key label="π" variant="fn" onPress={() => calc.pressToken('pi', 'π')} />
              <Key label="e" variant="fn" onPress={() => calc.pressToken('e')} />
            </>
          )}
        </div>
      </div>
      <StandardPad calc={calc} config={config} />
    </div>
  );
}
