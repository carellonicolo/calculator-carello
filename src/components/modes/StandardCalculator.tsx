import { Button } from "@/components/ui/button";
import { CalculatorDisplay } from "../CalculatorDisplay";
import { useCalculatorState } from "@/hooks/useCalculatorState";

interface StandardCalculatorProps {
  settings: { [key: string]: boolean };
}

export const StandardCalculator = ({ settings }: StandardCalculatorProps) => {
  const calc = useCalculatorState();

  const isEnabled = (key: string) => settings[key] !== false;

  const buttonClass =
    "btn-3d h-16 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg";
  const numberClass = `${buttonClass} bg-gradient-to-br from-[hsl(var(--calculator-button-start))] to-[hsl(var(--calculator-button-end))] text-[hsl(var(--calculator-text))] hover:shadow-lift border border-white/10`;
  const operatorClass = `${buttonClass} bg-gradient-to-br from-[hsl(var(--calculator-operator))] to-[hsl(var(--calculator-operator))]/80 text-white hover:shadow-glow-lg hover:scale-110 border border-[hsl(var(--calculator-operator-glow))]/30`;
  const specialClass = `${buttonClass} bg-gradient-to-br from-[hsl(var(--calculator-special))] to-[hsl(var(--calculator-special))]/80 text-white hover:shadow-glow border border-[hsl(var(--calculator-special-shine))]/30`;
  const memoryClass = `${buttonClass} bg-gradient-to-br from-purple-600 to-purple-700 text-white hover:shadow-glow border border-purple-400/30`;
  const disabledClass = `${buttonClass} bg-[hsl(var(--calculator-disabled))] text-muted-foreground cursor-not-allowed opacity-50`;

  return (
    <div className="space-y-4">
      <CalculatorDisplay
        display={calc.display}
        history={calc.history}
        operation={calc.operation}
        isAnimating={calc.isAnimating}
      />

      <div className="space-y-3">
        {/* Memory Row */}
        {isEnabled("memory_functions") && (
          <div className="grid grid-cols-5 gap-2">
            <Button onClick={calc.memoryClear} className={memoryClass} size="sm">
              MC
            </Button>
            <Button onClick={calc.memoryRecall} className={memoryClass} size="sm">
              MR
            </Button>
            <Button onClick={calc.memoryAdd} className={memoryClass} size="sm">
              M+
            </Button>
            <Button
              onClick={calc.memorySubtract}
              className={memoryClass}
              size="sm"
            >
              M-
            </Button>
            <Button onClick={calc.memoryStore} className={memoryClass} size="sm">
              MS
            </Button>
          </div>
        )}

        {/* Row 1: Functions */}
        <div className="grid grid-cols-4 gap-3">
          <Button onClick={calc.percentage} className={specialClass}>
            %
          </Button>
          <Button onClick={calc.clearEntry} className={specialClass}>
            CE
          </Button>
          <Button onClick={calc.clear} className={specialClass}>
            C
          </Button>
          <Button onClick={calc.backspace} className={specialClass}>
            ⌫
          </Button>
        </div>

        {/* Row 2: 1/x, x², √, ÷ */}
        <div className="grid grid-cols-4 gap-3">
          <Button
            onClick={() => calc.performUnaryOperation("reciprocal")}
            className={isEnabled("reciprocal") ? specialClass : disabledClass}
            disabled={!isEnabled("reciprocal")}
          >
            1/x
          </Button>
          <Button
            onClick={() => calc.performUnaryOperation("square")}
            className={isEnabled("square") ? specialClass : disabledClass}
            disabled={!isEnabled("square")}
          >
            x²
          </Button>
          <Button
            onClick={() => calc.performUnaryOperation("sqrt")}
            className={isEnabled("sqrt") ? specialClass : disabledClass}
            disabled={!isEnabled("sqrt")}
          >
            √
          </Button>
          <Button
            onClick={() => calc.performOperation("÷")}
            className={operatorClass}
          >
            ÷
          </Button>
        </div>

        {/* Row 3: 7, 8, 9, × */}
        <div className="grid grid-cols-4 gap-3">
          <Button onClick={() => calc.inputDigit("7")} className={numberClass}>
            7
          </Button>
          <Button onClick={() => calc.inputDigit("8")} className={numberClass}>
            8
          </Button>
          <Button onClick={() => calc.inputDigit("9")} className={numberClass}>
            9
          </Button>
          <Button
            onClick={() => calc.performOperation("×")}
            className={operatorClass}
          >
            ×
          </Button>
        </div>

        {/* Row 4: 4, 5, 6, − */}
        <div className="grid grid-cols-4 gap-3">
          <Button onClick={() => calc.inputDigit("4")} className={numberClass}>
            4
          </Button>
          <Button onClick={() => calc.inputDigit("5")} className={numberClass}>
            5
          </Button>
          <Button onClick={() => calc.inputDigit("6")} className={numberClass}>
            6
          </Button>
          <Button
            onClick={() => calc.performOperation("-")}
            className={operatorClass}
          >
            −
          </Button>
        </div>

        {/* Row 5: 1, 2, 3, + */}
        <div className="grid grid-cols-4 gap-3">
          <Button onClick={() => calc.inputDigit("1")} className={numberClass}>
            1
          </Button>
          <Button onClick={() => calc.inputDigit("2")} className={numberClass}>
            2
          </Button>
          <Button onClick={() => calc.inputDigit("3")} className={numberClass}>
            3
          </Button>
          <Button
            onClick={() => calc.performOperation("+")}
            className={operatorClass}
          >
            +
          </Button>
        </div>

        {/* Row 6: +/-, 0, ., = */}
        <div className="grid grid-cols-4 gap-3">
          <Button onClick={calc.toggleSign} className={numberClass}>
            +/−
          </Button>
          <Button onClick={() => calc.inputDigit("0")} className={numberClass}>
            0
          </Button>
          <Button onClick={calc.inputDecimal} className={numberClass}>
            .
          </Button>
          <Button
            onClick={() => calc.performOperation("=")}
            className={`${buttonClass} bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-glow-lg hover:scale-105 border border-orange-400/30`}
          >
            =
          </Button>
        </div>
      </div>
    </div>
  );
};
