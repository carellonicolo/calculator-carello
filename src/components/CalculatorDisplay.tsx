/**
 * ============================================================================
 * CalculatorDisplay.tsx
 * ============================================================================
 * 
 * Componente display della calcolatrice con supporto per:
 * - Display numerico principale con animazioni
 * - Storico operazioni
 * - Indicatore operazione corrente
 * - Visualizzazione multi-base per modalità programmer
 * - Branding Prof. Carello
 * 
 * DESIGN:
 * - Effetto LCD realistico
 * - Font monospace per allineamento cifre
 * - Animazioni fluide sui cambi valore
 * - Responsive per mobile e desktop
 * 
 * @author Prof. Nicolò Carello
 * ============================================================================
 */

import { BaseMode } from "@/hooks/useCalculatorState";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CalculatorDisplayProps {
  /** Valore corrente da visualizzare */
  display: string;
  /** Storico delle operazioni (es: "5 + 3 =") */
  history: string;
  /** Operazione corrente in attesa (es: "+") */
  operation: string | null;
  /** Flag per animazione su cambio valore */
  isAnimating: boolean;
  /** Se true, mostra display multi-base */
  isProgrammerMode?: boolean;
  /** Base numerica corrente per programmer mode */
  baseMode?: BaseMode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Display principale della calcolatrice
 * Mostra il valore corrente, lo storico e (opzionalmente) 
 * la rappresentazione multi-base in programmer mode
 */
export const CalculatorDisplay = ({
  display,
  history,
  operation,
  isAnimating,
  isProgrammerMode = false,
  baseMode = 10,
}: CalculatorDisplayProps) => {
  
  // -------------------------------------------------------------------------
  // UTILITY: Calcola rappresentazione in tutte le basi
  // -------------------------------------------------------------------------
  
  /**
   * Converte un valore in tutte le basi numeriche
   * Usato per la visualizzazione multi-base in programmer mode
   * 
   * @param value - Valore come stringa nella base corrente
   * @param currentBase - Base numerica del valore input
   * @returns Oggetto con rappresentazioni in tutte le basi
   */
  const getMultiBaseDisplay = (value: string, currentBase: BaseMode) => {
    const numValue = parseInt(value, currentBase);

    // Gestione valore non valido
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

  // Calcola multi-base solo se necessario (performance)
  const multiBase = isProgrammerMode
    ? getMultiBaseDisplay(display, baseMode)
    : null;

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  return (
    <div className="relative mb-6 p-6 lcd-display rounded-2xl min-h-[120px] sm:min-h-[140px] flex flex-col justify-end overflow-hidden z-10 calculator-display">
      
      {/* ===================================================================
          PROGRAMMER MODE: Display multi-base
          Mostra il valore in HEX, DEC, OCT, BIN simultaneamente
          =================================================================== */}
      {isProgrammerMode && multiBase && (
        <div className="mb-3 space-y-1">
          {/* Hexadecimal */}
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
          
          {/* Decimal */}
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
          
          {/* Octal */}
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
          
          {/* Binary - può essere lungo, quindi break-all */}
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

      {/* ===================================================================
          HISTORY DISPLAY
          Mostra lo storico delle operazioni (es: "5 + 3 = 8")
          =================================================================== */}
      {history && (
        <div className="text-sm font-mono text-[hsl(var(--calculator-text))]/50 mb-2 text-right truncate">
          {history}
        </div>
      )}

      {/* ===================================================================
          OPERATION INDICATOR
          Badge che mostra l'operazione corrente in attesa
          =================================================================== */}
      {operation && (
        <div className="absolute top-3 right-3 text-xs font-bold text-[hsl(var(--calculator-operator-glow))] bg-[hsl(var(--calculator-operator))]/20 px-2 py-1 rounded">
          {operation}
        </div>
      )}

      {/* ===================================================================
          MAIN DISPLAY
          Il valore numerico principale con animazione su cambiamenti
          =================================================================== */}
      <div
        className={`text-4xl sm:text-5xl md:text-6xl font-semibold font-mono text-[hsl(var(--calculator-text))] break-all text-right glow-text transition-all duration-300 number-flip ${
          isAnimating ? 'scale-105' : 'scale-100'
        }`}
        style={{
          letterSpacing: '-0.02em',
          fontFeatureSettings: "'tnum' 1" // Numeri tabulari per allineamento
        }}
      >
        {display}
        {/* Cursore lampeggiante quando display è zero */}
        {display === '0' && <span className="cursor-blink">|</span>}
      </div>

      {/* ===================================================================
          BRANDING
          Link al portfolio Prof. Carello
          =================================================================== */}
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
