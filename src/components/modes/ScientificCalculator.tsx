import { Button } from "@/components/ui/button";
import { CalculatorDisplay } from "../CalculatorDisplay";
import { useCalculatorState } from "@/hooks/useCalculatorState";
import { Badge } from "@/components/ui/badge";

interface ScientificCalculatorProps {
  settings: { [key: string]: boolean };
}

export const ScientificCalculator = ({
  settings,
}: ScientificCalculatorProps) => {
  const calc = useCalculatorState();

  const isEnabled = (key: string) => settings[key] !== false;

  const buttonClass =
    "btn-3d h-12 text-sm font-semibold rounded-lg transition-all duration-300 shadow-lg";
  const numberClass = `${buttonClass} bg-gradient-to-br from-[hsl(var(--calculator-button-start))] to-[hsl(var(--calculator-button-end))] text-[hsl(var(--calculator-text))] hover:shadow-lift border border-white/10`;
  const operatorClass = `${buttonClass} bg-gradient-to-br from-[hsl(var(--calculator-operator))] to-[hsl(var(--calculator-operator))]/80 text-white hover:shadow-glow-lg hover:scale-110 border border-[hsl(var(--calculator-operator-glow))]/30`;
  const specialClass = `${buttonClass} bg-gradient-to-br from-[hsl(var(--calculator-special))] to-[hsl(var(--calculator-special))]/80 text-white hover:shadow-glow border border-[hsl(var(--calculator-special-shine))]/30`;
  const disabledClass = `${buttonClass} bg-[hsl(var(--calculator-disabled))] text-muted-foreground cursor-not-allowed opacity-50`;

  return (
    <div className="space-y-4">
      <CalculatorDisplay
        display={calc.display}
        history={calc.history}
        operation={calc.operation}
        isAnimating={calc.isAnimating}
      />

      {/* Angle Mode Indicator */}
      {isEnabled("deg_rad") && (
        <div className="flex justify-end">
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-accent"
            onClick={calc.toggleAngleMode}
          >
            {calc.angleMode === "deg" ? "DEG" : "RAD"}
          </Badge>
        </div>
      )}

      <div className="space-y-2">
        {/* Row 1: Functions & Constants */}
        <div className="grid grid-cols-6 gap-2">
          <Button
            onClick={() => calc.insertConstant("pi")}
            className={isEnabled("pi") ? specialClass : disabledClass}
            disabled={!isEnabled("pi")}
          >
            π
          </Button>
          <Button
            onClick={() => calc.insertConstant("e")}
            className={isEnabled("e") ? specialClass : disabledClass}
            disabled={!isEnabled("e")}
          >
            e
          </Button>
          <Button
            onClick={() => calc.insertConstant("phi")}
            className={isEnabled("phi") ? specialClass : disabledClass}
            disabled={!isEnabled("phi")}
          >
            φ
          </Button>
          <Button onClick={calc.clear} className={specialClass}>
            C
          </Button>
          <Button onClick={calc.clearEntry} className={specialClass}>
            CE
          </Button>
          <Button onClick={calc.backspace} className={specialClass}>
            ⌫
          </Button>
        </div>

        {/* Row 2: Advanced Functions */}
        <div className="grid grid-cols-6 gap-2">
          <Button
            onClick={() => calc.performUnaryOperation("square")}
            className={isEnabled("square_sci") ? specialClass : disabledClass}
            disabled={!isEnabled("square_sci")}
          >
            x²
          </Button>
          <Button
            onClick={() => calc.performUnaryOperation("cube")}
            className={isEnabled("cube") ? specialClass : disabledClass}
            disabled={!isEnabled("cube")}
          >
            x³
          </Button>
          <Button
            onClick={() => calc.performOperation("^")}
            className={isEnabled("power") ? specialClass : disabledClass}
            disabled={!isEnabled("power")}
          >
            xʸ
          </Button>
          <Button
            onClick={() => calc.performLogarithmic("pow10")}
            className={isEnabled("pow10") ? specialClass : disabledClass}
            disabled={!isEnabled("pow10")}
          >
            10ˣ
          </Button>
          <Button
            onClick={() => calc.performLogarithmic("pow2")}
            className={isEnabled("pow2") ? specialClass : disabledClass}
            disabled={!isEnabled("pow2")}
          >
            2ˣ
          </Button>
          <Button
            onClick={() => calc.performLogarithmic("exp")}
            className={isEnabled("exp") ? specialClass : disabledClass}
            disabled={!isEnabled("exp")}
          >
            eˣ
          </Button>
        </div>

        {/* Row 3: Roots */}
        <div className="grid grid-cols-6 gap-2">
          <Button
            onClick={() => calc.performUnaryOperation("sqrt")}
            className={isEnabled("sqrt") ? specialClass : disabledClass}
            disabled={!isEnabled("sqrt")}
          >
            √
          </Button>
          <Button
            onClick={() => calc.performUnaryOperation("cbrt")}
            className={isEnabled("cbrt") ? specialClass : disabledClass}
            disabled={!isEnabled("cbrt")}
          >
            ∛
          </Button>
          <Button
            onClick={() => calc.performUnaryOperation("reciprocal")}
            className={isEnabled("reciprocal_sci") ? specialClass : disabledClass}
            disabled={!isEnabled("reciprocal_sci")}
          >
            1/x
          </Button>
          <Button
            onClick={() => calc.performUnaryOperation("factorial")}
            className={isEnabled("factorial") ? specialClass : disabledClass}
            disabled={!isEnabled("factorial")}
          >
            n!
          </Button>
          <Button
            onClick={() => calc.performUnaryOperation("abs")}
            className={isEnabled("abs") ? specialClass : disabledClass}
            disabled={!isEnabled("abs")}
          >
            |x|
          </Button>
          <Button
            onClick={() => calc.performOperation("mod")}
            className={isEnabled("mod") ? specialClass : disabledClass}
            disabled={!isEnabled("mod")}
          >
            mod
          </Button>
        </div>

        {/* Row 4: Trigonometric */}
        {isEnabled("trigonometric") && (
          <div className="grid grid-cols-6 gap-2">
            <Button
              onClick={() => calc.performTrigonometric("sin")}
              className={isEnabled("sin") ? specialClass : disabledClass}
              disabled={!isEnabled("sin")}
            >
              sin
            </Button>
            <Button
              onClick={() => calc.performTrigonometric("cos")}
              className={isEnabled("cos") ? specialClass : disabledClass}
              disabled={!isEnabled("cos")}
            >
              cos
            </Button>
            <Button
              onClick={() => calc.performTrigonometric("tan")}
              className={isEnabled("tan") ? specialClass : disabledClass}
              disabled={!isEnabled("tan")}
            >
              tan
            </Button>
            <Button
              onClick={() => calc.performTrigonometric("asin")}
              className={isEnabled("asin") ? specialClass : disabledClass}
              disabled={!isEnabled("asin")}
            >
              sin⁻¹
            </Button>
            <Button
              onClick={() => calc.performTrigonometric("acos")}
              className={isEnabled("acos") ? specialClass : disabledClass}
              disabled={!isEnabled("acos")}
            >
              cos⁻¹
            </Button>
            <Button
              onClick={() => calc.performTrigonometric("atan")}
              className={isEnabled("atan") ? specialClass : disabledClass}
              disabled={!isEnabled("atan")}
            >
              tan⁻¹
            </Button>
          </div>
        )}

        {/* Row 5: Hyperbolic */}
        {isEnabled("hyperbolic") && (
          <div className="grid grid-cols-6 gap-2">
            <Button
              onClick={() => calc.performTrigonometric("sinh")}
              className={isEnabled("sinh") ? specialClass : disabledClass}
              disabled={!isEnabled("sinh")}
            >
              sinh
            </Button>
            <Button
              onClick={() => calc.performTrigonometric("cosh")}
              className={isEnabled("cosh") ? specialClass : disabledClass}
              disabled={!isEnabled("cosh")}
            >
              cosh
            </Button>
            <Button
              onClick={() => calc.performTrigonometric("tanh")}
              className={isEnabled("tanh") ? specialClass : disabledClass}
              disabled={!isEnabled("tanh")}
            >
              tanh
            </Button>
            <Button
              onClick={() => calc.performUnaryOperation("floor")}
              className={isEnabled("floor") ? specialClass : disabledClass}
              disabled={!isEnabled("floor")}
            >
              ⌊x⌋
            </Button>
            <Button
              onClick={() => calc.performUnaryOperation("ceil")}
              className={isEnabled("ceil") ? specialClass : disabledClass}
              disabled={!isEnabled("ceil")}
            >
              ⌈x⌉
            </Button>
            <Button
              onClick={() => calc.performUnaryOperation("round")}
              className={isEnabled("round") ? specialClass : disabledClass}
              disabled={!isEnabled("round")}
            >
              rnd
            </Button>
          </div>
        )}

        {/* Row 6: Logarithms */}
        {isEnabled("logarithms") && (
          <div className="grid grid-cols-6 gap-2">
            <Button
              onClick={() => calc.performLogarithmic("log")}
              className={isEnabled("log") ? specialClass : disabledClass}
              disabled={!isEnabled("log")}
            >
              log
            </Button>
            <Button
              onClick={() => calc.performLogarithmic("ln")}
              className={isEnabled("ln") ? specialClass : disabledClass}
              disabled={!isEnabled("ln")}
            >
              ln
            </Button>
            <Button
              onClick={() => calc.performLogarithmic("log2")}
              className={isEnabled("log2") ? specialClass : disabledClass}
              disabled={!isEnabled("log2")}
            >
              log₂
            </Button>
            <Button onClick={calc.percentage} className={specialClass}>
              %
            </Button>
            <Button
              onClick={() => calc.performOperation("(")}
              className={numberClass}
            >
              (
            </Button>
            <Button
              onClick={() => calc.performOperation(")")}
              className={numberClass}
            >
              )
            </Button>
          </div>
        )}

        {/* Row 7: Numbers & Operators */}
        <div className="grid grid-cols-4 gap-2">
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
            onClick={() => calc.performOperation("÷")}
            className={operatorClass}
          >
            ÷
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-2">
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
            onClick={() => calc.performOperation("×")}
            className={operatorClass}
          >
            ×
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-2">
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
            onClick={() => calc.performOperation("-")}
            className={operatorClass}
          >
            −
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-2">
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
            onClick={() => calc.performOperation("+")}
            className={operatorClass}
          >
            +
          </Button>
        </div>

        {/* Equals Row */}
        <div className="grid grid-cols-1">
          <Button
            onClick={() => calc.performOperation("=")}
            className={`${buttonClass} h-14 bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-glow-lg hover:scale-105 border border-orange-400/30`}
          >
            =
          </Button>
        </div>
      </div>
    </div>
  );
};
