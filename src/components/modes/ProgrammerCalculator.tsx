import { Button } from "@/components/ui/button";
import { CalculatorDisplay } from "../CalculatorDisplay";
import { useCalculatorState, WordSize, BaseMode } from "@/hooks/useCalculatorState";
import { Badge } from "@/components/ui/badge";

interface ProgrammerCalculatorProps {
  settings: { [key: string]: boolean };
}

export const ProgrammerCalculator = ({
  settings,
}: ProgrammerCalculatorProps) => {
  const calc = useCalculatorState();

  const isEnabled = (key: string) => settings[key] !== false;

  const buttonClass =
    "btn-3d h-12 text-sm font-semibold rounded-lg transition-all duration-300 shadow-lg";
  const numberClass = `${buttonClass} bg-gradient-to-br from-[hsl(var(--calculator-button-start))] to-[hsl(var(--calculator-button-end))] text-[hsl(var(--calculator-text))] hover:shadow-lift border border-white/10`;
  const operatorClass = `${buttonClass} bg-gradient-to-br from-[hsl(var(--calculator-operator))] to-[hsl(var(--calculator-operator))]/80 text-white hover:shadow-glow-lg hover:scale-110 border border-[hsl(var(--calculator-operator-glow))]/30`;
  const specialClass = `${buttonClass} bg-gradient-to-br from-[hsl(var(--calculator-special))] to-[hsl(var(--calculator-special))]/80 text-white hover:shadow-glow border border-[hsl(var(--calculator-special-shine))]/30`;
  const bitwiseClass = `${buttonClass} bg-gradient-to-br from-cyan-600 to-cyan-700 text-white hover:shadow-glow border border-cyan-400/30`;
  const disabledClass = `${buttonClass} bg-[hsl(var(--calculator-disabled))] text-muted-foreground cursor-not-allowed opacity-50`;

  const hexDigits = ["A", "B", "C", "D", "E", "F"];
  const isHexDigitEnabled = calc.baseMode === 16;

  return (
    <div className="space-y-4">
      <CalculatorDisplay
        display={calc.display}
        history={calc.history}
        operation={calc.operation}
        isAnimating={calc.isAnimating}
        isProgrammerMode={true}
        baseMode={calc.baseMode}
      />

      {/* Word Size & Base Mode Indicators */}
      <div className="flex flex-wrap gap-2 justify-between">
        {isEnabled("word_size") && (
          <div className="flex gap-1">
            <Badge
              variant={calc.wordSize === 8 ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => calc.setWordSizeMode(8 as WordSize)}
            >
              BYTE
            </Badge>
            <Badge
              variant={calc.wordSize === 16 ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => calc.setWordSizeMode(16 as WordSize)}
            >
              WORD
            </Badge>
            <Badge
              variant={calc.wordSize === 32 ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => calc.setWordSizeMode(32 as WordSize)}
            >
              DWORD
            </Badge>
            <Badge
              variant={calc.wordSize === 64 ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => calc.setWordSizeMode(64 as WordSize)}
            >
              QWORD
            </Badge>
          </div>
        )}

        {isEnabled("conversions_prog") && (
          <div className="flex gap-1">
            <Badge
              variant={calc.baseMode === 16 ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => calc.convertBase(16 as BaseMode)}
            >
              HEX
            </Badge>
            <Badge
              variant={calc.baseMode === 10 ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => calc.convertBase(10 as BaseMode)}
            >
              DEC
            </Badge>
            <Badge
              variant={calc.baseMode === 8 ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => calc.convertBase(8 as BaseMode)}
            >
              OCT
            </Badge>
            <Badge
              variant={calc.baseMode === 2 ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => calc.convertBase(2 as BaseMode)}
            >
              BIN
            </Badge>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {/* Row 1: Bitwise Operations */}
        {isEnabled("bitwise_ops") && (
          <div className="grid grid-cols-6 gap-2">
            <Button
              onClick={() => calc.performBitwiseOperation("and")}
              className={isEnabled("and") ? bitwiseClass : disabledClass}
              disabled={!isEnabled("and")}
            >
              AND
            </Button>
            <Button
              onClick={() => calc.performBitwiseOperation("or")}
              className={isEnabled("or") ? bitwiseClass : disabledClass}
              disabled={!isEnabled("or")}
            >
              OR
            </Button>
            <Button
              onClick={() => calc.performBitwiseOperation("xor")}
              className={isEnabled("xor") ? bitwiseClass : disabledClass}
              disabled={!isEnabled("xor")}
            >
              XOR
            </Button>
            <Button
              onClick={() => calc.performBitwiseOperation("not")}
              className={isEnabled("not") ? bitwiseClass : disabledClass}
              disabled={!isEnabled("not")}
            >
              NOT
            </Button>
            <Button
              onClick={() => calc.performBitwiseOperation("nand")}
              className={isEnabled("nand") ? bitwiseClass : disabledClass}
              disabled={!isEnabled("nand")}
            >
              NAND
            </Button>
            <Button
              onClick={() => calc.performBitwiseOperation("nor")}
              className={isEnabled("nor") ? bitwiseClass : disabledClass}
              disabled={!isEnabled("nor")}
            >
              NOR
            </Button>
          </div>
        )}

        {/* Row 2: Shift Operations */}
        {isEnabled("shift_ops") && (
          <div className="grid grid-cols-4 gap-2">
            <Button
              onClick={() => calc.performBitwiseOperation("lsh", 1)}
              className={isEnabled("lsh") ? bitwiseClass : disabledClass}
              disabled={!isEnabled("lsh")}
            >
              {"<<"}
            </Button>
            <Button
              onClick={() => calc.performBitwiseOperation("rsh", 1)}
              className={isEnabled("rsh") ? bitwiseClass : disabledClass}
              disabled={!isEnabled("rsh")}
            >
              {">>"}
            </Button>
            <Button
              onClick={() => calc.performBitwiseOperation("rol", 1)}
              className={isEnabled("rol") ? bitwiseClass : disabledClass}
              disabled={!isEnabled("rol")}
            >
              ROL
            </Button>
            <Button
              onClick={() => calc.performBitwiseOperation("ror", 1)}
              className={isEnabled("ror") ? bitwiseClass : disabledClass}
              disabled={!isEnabled("ror")}
            >
              ROR
            </Button>
          </div>
        )}

        {/* Row 3: Controls */}
        <div className="grid grid-cols-4 gap-2">
          <Button onClick={calc.clear} className={specialClass}>
            C
          </Button>
          <Button onClick={calc.clearEntry} className={specialClass}>
            CE
          </Button>
          <Button onClick={calc.backspace} className={specialClass}>
            ⌫
          </Button>
          <Button
            onClick={() => calc.performOperation("÷")}
            className={operatorClass}
          >
            ÷
          </Button>
        </div>

        {/* Row 4: Hex Digits A-F (enabled only in hex mode) */}
        <div className="grid grid-cols-6 gap-2">
          {hexDigits.map((digit) => (
            <Button
              key={digit}
              onClick={() => calc.inputHexDigit(digit)}
              className={isHexDigitEnabled ? numberClass : disabledClass}
              disabled={!isHexDigitEnabled}
            >
              {digit}
            </Button>
          ))}
        </div>

        {/* Row 5: 7, 8, 9, × */}
        <div className="grid grid-cols-4 gap-2">
          <Button
            onClick={() => calc.inputDigit("7")}
            className={calc.baseMode >= 8 ? numberClass : disabledClass}
            disabled={calc.baseMode < 8}
          >
            7
          </Button>
          <Button
            onClick={() => calc.inputDigit("8")}
            className={calc.baseMode >= 8 ? numberClass : disabledClass}
            disabled={calc.baseMode < 8}
          >
            8
          </Button>
          <Button
            onClick={() => calc.inputDigit("9")}
            className={calc.baseMode >= 10 ? numberClass : disabledClass}
            disabled={calc.baseMode < 10}
          >
            9
          </Button>
          <Button
            onClick={() => calc.performOperation("×")}
            className={operatorClass}
          >
            ×
          </Button>
        </div>

        {/* Row 6: 4, 5, 6, − */}
        <div className="grid grid-cols-4 gap-2">
          <Button
            onClick={() => calc.inputDigit("4")}
            className={calc.baseMode >= 8 ? numberClass : disabledClass}
            disabled={calc.baseMode < 8}
          >
            4
          </Button>
          <Button
            onClick={() => calc.inputDigit("5")}
            className={calc.baseMode >= 8 ? numberClass : disabledClass}
            disabled={calc.baseMode < 8}
          >
            5
          </Button>
          <Button
            onClick={() => calc.inputDigit("6")}
            className={calc.baseMode >= 8 ? numberClass : disabledClass}
            disabled={calc.baseMode < 8}
          >
            6
          </Button>
          <Button
            onClick={() => calc.performOperation("-")}
            className={operatorClass}
          >
            −
          </Button>
        </div>

        {/* Row 7: 1, 2, 3, + */}
        <div className="grid grid-cols-4 gap-2">
          <Button onClick={() => calc.inputDigit("1")} className={numberClass}>
            1
          </Button>
          <Button
            onClick={() => calc.inputDigit("2")}
            className={calc.baseMode >= 8 ? numberClass : disabledClass}
            disabled={calc.baseMode < 8}
          >
            2
          </Button>
          <Button
            onClick={() => calc.inputDigit("3")}
            className={calc.baseMode >= 8 ? numberClass : disabledClass}
            disabled={calc.baseMode < 8}
          >
            3
          </Button>
          <Button
            onClick={() => calc.performOperation("+")}
            className={operatorClass}
          >
            +
          </Button>
        </div>

        {/* Row 8: +/-, 0, =  */}
        <div className="grid grid-cols-4 gap-2">
          <Button onClick={calc.toggleSign} className={numberClass}>
            +/−
          </Button>
          <Button onClick={() => calc.inputDigit("0")} className={numberClass}>
            0
          </Button>
          <Button
            onClick={() => calc.performOperation("mod")}
            className={operatorClass}
          >
            MOD
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
