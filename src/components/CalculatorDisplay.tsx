import { BaseMode } from "@/hooks/useCalculatorState";

interface CalculatorDisplayProps {
  display: string;
  history: string;
  operation: string | null;
  isAnimating: boolean;
  isProgrammerMode?: boolean;
  baseMode?: BaseMode;
}

export const CalculatorDisplay = ({
  display,
  history,
  operation,
  isAnimating,
  isProgrammerMode = false,
  baseMode = 10,
}: CalculatorDisplayProps) => {
  const getMultiBaseDisplay = (value: string, currentBase: BaseMode) => {
    const numValue = parseInt(value, currentBase);

    if (isNaN(numValue)) {
      return {
        hex: "0",
        dec: "0",
        oct: "0",
        bin: "0",
      };
    }

    return {
      hex: numValue.toString(16).toUpperCase(),
      dec: numValue.toString(10),
      oct: numValue.toString(8),
      bin: numValue.toString(2),
    };
  };

  const multiBase = isProgrammerMode
    ? getMultiBaseDisplay(display, baseMode)
    : null;

  return (
    <div className="relative mb-6 p-6 bg-gradient-to-b from-[hsl(var(--calculator-display))] to-[hsl(var(--calculator-display))]/80 rounded-2xl min-h-[100px] flex flex-col justify-end border-2 border-[hsl(var(--calculator-display-glow))]/20 shadow-inner animate-glow-pulse overflow-hidden z-10">
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Programmer mode: Multi-base display */}
      {isProgrammerMode && multiBase && (
        <div className="mb-3 space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[hsl(var(--calculator-text))]/60">
            <span className="w-10 text-[hsl(var(--calculator-text))]/40">
              HEX
            </span>
            <span
              className={
                baseMode === 16 ? "text-[hsl(var(--calculator-operator-glow))]" : ""
              }
            >
              {multiBase.hex}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[hsl(var(--calculator-text))]/60">
            <span className="w-10 text-[hsl(var(--calculator-text))]/40">
              DEC
            </span>
            <span
              className={
                baseMode === 10 ? "text-[hsl(var(--calculator-operator-glow))]" : ""
              }
            >
              {multiBase.dec}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[hsl(var(--calculator-text))]/60">
            <span className="w-10 text-[hsl(var(--calculator-text))]/40">
              OCT
            </span>
            <span
              className={
                baseMode === 8 ? "text-[hsl(var(--calculator-operator-glow))]" : ""
              }
            >
              {multiBase.oct}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[hsl(var(--calculator-text))]/60 break-all">
            <span className="w-10 text-[hsl(var(--calculator-text))]/40 flex-shrink-0">
              BIN
            </span>
            <span
              className={
                baseMode === 2 ? "text-[hsl(var(--calculator-operator-glow))]" : ""
              }
            >
              {multiBase.bin}
            </span>
          </div>
        </div>
      )}

      {/* History/Operation display */}
      {history && (
        <div className="text-sm font-mono text-[hsl(var(--calculator-text))]/50 mb-2 text-right truncate">
          {history}
        </div>
      )}

      {/* Current operation indicator */}
      {operation && (
        <div className="absolute top-3 right-3 text-xs font-bold text-[hsl(var(--calculator-operator-glow))] bg-[hsl(var(--calculator-operator))]/20 px-2 py-1 rounded">
          {operation}
        </div>
      )}

      {/* Main display */}
      <div
        className={`text-5xl font-mono text-[hsl(var(--calculator-text))] break-all text-right glow-text transition-all duration-300 ${
          isAnimating ? 'scale-105' : 'scale-100'
        }`}
      >
        {display}
      </div>

      {/* Branding */}
      <a 
        href="https://apps.nicolocarello.it"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 left-2 text-[10px] sm:text-xs font-medium text-[hsl(var(--calculator-text))]/30 hover:text-[hsl(var(--calculator-text))]/60 transition-colors duration-300 cursor-pointer"
      >
        Powered by Prof. Carello
      </a>
    </div>
  );
};
