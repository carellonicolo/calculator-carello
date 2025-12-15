/**
 * ============================================================================
 * useCalculatorState.ts
 * ============================================================================
 * 
 * Custom React hook che gestisce lo stato completo della calcolatrice.
 * Fornisce tutte le operazioni matematiche, gestione memoria, e supporto
 * per modalità scientifica e programmatore.
 * 
 * @author Prof. Nicolò Carello
 * @version 2.0.0 - Ottimizzato con useCallback per performance
 * 
 * FUNZIONALITÀ PRINCIPALI:
 * - Operazioni aritmetiche base (+, -, ×, ÷)
 * - Operazioni scientifiche (trigonometria, logaritmi, potenze)
 * - Operazioni programmatore (bitwise, conversioni base)
 * - Gestione memoria (MS, MR, M+, M-, MC)
 * - Supporto per gradi/radianti
 * - Supporto per word size (8, 16, 32, 64 bit)
 * 
 * ============================================================================
 */

import { useState, useCallback, useMemo } from "react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Modalità angolare per funzioni trigonometriche */
export type AngleMode = "deg" | "rad";

/** Dimensione word per operazioni bitwise */
export type WordSize = 8 | 16 | 32 | 64;

/** Base numerica per modalità programmatore */
export type BaseMode = 2 | 8 | 10 | 16;

/**
 * Interfaccia che definisce lo stato completo della calcolatrice
 */
export interface CalculatorState {
  /** Valore corrente visualizzato */
  display: string;
  /** Valore precedente per operazioni binarie */
  previousValue: number | null;
  /** Operazione corrente in attesa */
  operation: string | null;
  /** Flag: in attesa di nuovo operando */
  waitingForOperand: boolean;
  /** Valore in memoria */
  memory: number;
  /** Storico delle operazioni */
  history: string;
  /** Flag: animazione display attiva */
  isAnimating: boolean;
  /** Modalità angolare corrente */
  angleMode: AngleMode;
  /** Dimensione word corrente */
  wordSize: WordSize;
  /** Base numerica corrente */
  baseMode: BaseMode;
}

// ============================================================================
// HELPER FUNCTIONS (definite fuori dal hook per evitare ri-creazione)
// ============================================================================

/**
 * Cache per memoizzazione del fattoriale
 * Evita ricalcoli ripetuti per gli stessi valori
 */
const factorialCache = new Map<number, number>();

/**
 * Calcola il fattoriale di un numero con memoizzazione
 * 
 * @param n - Numero di cui calcolare il fattoriale
 * @returns Il fattoriale di n
 * 
 * @example
 * factorial(5) // returns 120
 * factorial(0) // returns 1
 */
const factorial = (n: number): number => {
  // Gestione casi limite
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity; // Previene overflow JavaScript

  // Controlla cache per valore già calcolato
  if (factorialCache.has(n)) {
    return factorialCache.get(n)!;
  }

  // Calcolo iterativo (più efficiente della ricorsione)
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }

  // Salva in cache per uso futuro
  factorialCache.set(n, result);
  return result;
};

/**
 * Rotazione bit a sinistra (circular left shift)
 * 
 * @param value - Valore da ruotare
 * @param shift - Numero di posizioni
 * @param bits - Dimensione word in bit
 * @returns Valore ruotato
 */
const rotateLeft = (value: number, shift: number, bits: number): number => {
  shift = shift % bits;
  const mask = (1 << bits) - 1;
  return ((value << shift) | (value >>> (bits - shift))) & mask;
};

/**
 * Rotazione bit a destra (circular right shift)
 * 
 * @param value - Valore da ruotare
 * @param shift - Numero di posizioni
 * @param bits - Dimensione word in bit
 * @returns Valore ruotato
 */
const rotateRight = (value: number, shift: number, bits: number): number => {
  shift = shift % bits;
  const mask = (1 << bits) - 1;
  return ((value >>> shift) | (value << (bits - shift))) & mask;
};

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook principale per la gestione dello stato della calcolatrice
 * 
 * Tutte le funzioni sono wrappate con useCallback per evitare
 * ri-renderizzazioni inutili dei componenti che le utilizzano.
 * 
 * @returns Oggetto con stato e metodi della calcolatrice
 */
export const useCalculatorState = () => {
  // -------------------------------------------------------------------------
  // STATE DECLARATIONS
  // -------------------------------------------------------------------------
  
  /** Valore visualizzato sul display */
  const [display, setDisplay] = useState<string>("0");
  
  /** Valore salvato per operazioni binarie */
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  
  /** Operazione corrente in attesa di secondo operando */
  const [operation, setOperation] = useState<string | null>(null);
  
  /** Flag: calcolatrice in attesa di nuovo numero */
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  
  /** Valore salvato in memoria (M+, M-, MR, MS) */
  const [memory, setMemory] = useState<number>(0);
  
  /** Storico operazioni per display secondario */
  const [history, setHistory] = useState<string>("");
  
  /** Flag per animazione display su operazioni */
  const [isAnimating, setIsAnimating] = useState(false);
  
  /** Modalità angolare: gradi o radianti */
  const [angleMode, setAngleMode] = useState<AngleMode>("deg");
  
  /** Dimensione word per operazioni bitwise */
  const [wordSize, setWordSize] = useState<WordSize>(32);
  
  /** Base numerica per modalità programmatore */
  const [baseMode, setBaseMode] = useState<BaseMode>(10);

  // -------------------------------------------------------------------------
  // ANIMATION UTILITY
  // -------------------------------------------------------------------------
  
  /**
   * Attiva breve animazione sul display per feedback visivo
   * Usata dopo ogni operazione significativa
   */
  const triggerAnimation = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  // -------------------------------------------------------------------------
  // INPUT HANDLERS
  // -------------------------------------------------------------------------
  
  /**
   * Inserisce una cifra decimale (0-9)
   * Gestisce correttamente la sostituzione vs. concatenazione
   * 
   * @param digit - Cifra da inserire ("0"-"9")
   */
  const inputDigit = useCallback((digit: string) => {
    triggerAnimation();

    if (waitingForOperand) {
      // Inizia nuovo numero, sostituisce display
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      // Concatena al numero esistente (evita leading zeros)
      setDisplay(prev => prev === "0" ? digit : prev + digit);
    }
  }, [waitingForOperand, triggerAnimation]);

  /**
   * Inserisce una cifra esadecimale (A-F)
   * Disponibile solo in modalità programmatore con base 16
   * 
   * @param digit - Cifra hex da inserire ("A"-"F")
   */
  const inputHexDigit = useCallback((digit: string) => {
    triggerAnimation();

    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      // Converte valore corrente, aggiunge nuova cifra
      const currentValue = parseInt(display, baseMode);
      const newDigit = parseInt(digit, 16);

      if (isNaN(currentValue) || isNaN(newDigit)) {
        setDisplay(digit);
      } else {
        const newValue = currentValue * 16 + newDigit;
        setDisplay(newValue.toString(baseMode).toUpperCase());
      }
    }
  }, [waitingForOperand, display, baseMode, triggerAnimation]);

  /**
   * Inserisce il punto decimale
   * Ignorato in basi non-decimali (programmatore mode)
   */
  const inputDecimal = useCallback(() => {
    // Punto decimale valido solo in base 10
    if (baseMode !== 10) return;

    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) {
      // Aggiunge punto solo se non già presente
      setDisplay(prev => prev + ".");
    }
  }, [baseMode, waitingForOperand, display]);

  // -------------------------------------------------------------------------
  // CLEAR OPERATIONS
  // -------------------------------------------------------------------------
  
  /**
   * Reset completo della calcolatrice (Clear)
   * Azzera display, operazione, storico
   */
  const clear = useCallback(() => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setHistory("");
    triggerAnimation();
  }, [triggerAnimation]);

  /**
   * Azzera solo il display corrente (Clear Entry)
   * Mantiene operazione e valore precedente
   */
  const clearEntry = useCallback(() => {
    setDisplay("0");
    triggerAnimation();
  }, [triggerAnimation]);

  /**
   * Cancella l'ultima cifra inserita (Backspace)
   */
  const backspace = useCallback(() => {
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
    triggerAnimation();
  }, [triggerAnimation]);

  // -------------------------------------------------------------------------
  // UNARY OPERATIONS
  // -------------------------------------------------------------------------
  
  /**
   * Inverte il segno del numero corrente (+/-)
   */
  const toggleSign = useCallback(() => {
    const value = parseFloat(display);
    setDisplay(String(value * -1));
    triggerAnimation();
  }, [display, triggerAnimation]);

  /**
   * Calcola la percentuale del valore corrente
   * Divide per 100
   */
  const percentage = useCallback(() => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
    setWaitingForOperand(true);
    triggerAnimation();
  }, [display, triggerAnimation]);

  // -------------------------------------------------------------------------
  // BINARY OPERATIONS
  // -------------------------------------------------------------------------
  
  /**
   * Esegue un'operazione binaria (+, -, ×, ÷, etc.)
   * Gestisce anche il concatenamento di operazioni
   * 
   * @param nextOperation - Operatore da applicare
   */
  const performOperation = useCallback((nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      // Prima operazione: salva valore e operatore
      setPreviousValue(inputValue);
      setHistory(`${inputValue} ${nextOperation}`);
    } else if (operation && nextOperation === "=") {
      // Calcolo finale con operatore "="
      const currentValue = previousValue || 0;
      let newValue = currentValue;

      // Esegue operazione salvata
      switch (operation) {
        case "+":
          newValue = currentValue + inputValue;
          break;
        case "-":
          newValue = currentValue - inputValue;
          break;
        case "*":
        case "×":
          newValue = currentValue * inputValue;
          break;
        case "/":
        case "÷":
          newValue = inputValue !== 0 ? currentValue / inputValue : 0;
          break;
        case "^":
          newValue = Math.pow(currentValue, inputValue);
          break;
        case "mod":
          newValue = currentValue % inputValue;
          break;
      }

      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setHistory(`${currentValue} ${operation} ${inputValue} = ${newValue}`);
      triggerAnimation();
      return;
    } else if (operation) {
      // Concatenamento operazioni (es: 1 + 2 + 3)
      const currentValue = previousValue || 0;
      let newValue = currentValue;

      switch (operation) {
        case "+":
          newValue = currentValue + inputValue;
          break;
        case "-":
          newValue = currentValue - inputValue;
          break;
        case "*":
        case "×":
          newValue = currentValue * inputValue;
          break;
        case "/":
        case "÷":
          newValue = inputValue !== 0 ? currentValue / inputValue : 0;
          break;
        case "^":
          newValue = Math.pow(currentValue, inputValue);
          break;
        case "mod":
          newValue = currentValue % inputValue;
          break;
      }

      setDisplay(String(newValue));
      setPreviousValue(newValue);
      setHistory(`${newValue} ${nextOperation}`);
      triggerAnimation();
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  }, [display, previousValue, operation, triggerAnimation]);

  /**
   * Esegue un'operazione unaria (√, x², 1/x, etc.)
   * 
   * @param op - Nome dell'operazione da eseguire
   */
  const performUnaryOperation = useCallback((op: string) => {
    const value = parseFloat(display);
    let result = 0;

    switch (op) {
      case "sqrt":
        result = Math.sqrt(value);
        break;
      case "cbrt":
        result = Math.cbrt(value);
        break;
      case "square":
        result = value * value;
        break;
      case "cube":
        result = value * value * value;
        break;
      case "reciprocal":
        result = value !== 0 ? 1 / value : 0;
        break;
      case "abs":
        result = Math.abs(value);
        break;
      case "floor":
        result = Math.floor(value);
        break;
      case "ceil":
        result = Math.ceil(value);
        break;
      case "round":
        result = Math.round(value);
        break;
      case "factorial":
        result = factorial(Math.floor(Math.abs(value)));
        break;
      default:
        result = value;
    }

    setDisplay(String(result));
    setWaitingForOperand(true);
    setHistory(`${op}(${value}) = ${result}`);
    triggerAnimation();
  }, [display, triggerAnimation]);

  // -------------------------------------------------------------------------
  // TRIGONOMETRIC FUNCTIONS
  // -------------------------------------------------------------------------
  
  /**
   * Esegue una funzione trigonometrica
   * Gestisce automaticamente la conversione gradi/radianti
   * 
   * @param func - Nome della funzione (sin, cos, tan, etc.)
   */
  const performTrigonometric = useCallback((func: string) => {
    const value = parseFloat(display);
    let result = 0;

    // Converti in radianti se in modalità gradi
    const angleValue = angleMode === "deg" ? (value * Math.PI) / 180 : value;

    switch (func) {
      case "sin":
        result = Math.sin(angleValue);
        break;
      case "cos":
        result = Math.cos(angleValue);
        break;
      case "tan":
        result = Math.tan(angleValue);
        break;
      case "asin":
        result = Math.asin(value);
        // Converti risultato in gradi se necessario
        result = angleMode === "deg" ? (result * 180) / Math.PI : result;
        break;
      case "acos":
        result = Math.acos(value);
        result = angleMode === "deg" ? (result * 180) / Math.PI : result;
        break;
      case "atan":
        result = Math.atan(value);
        result = angleMode === "deg" ? (result * 180) / Math.PI : result;
        break;
      case "sinh":
        result = Math.sinh(value);
        break;
      case "cosh":
        result = Math.cosh(value);
        break;
      case "tanh":
        result = Math.tanh(value);
        break;
      default:
        result = value;
    }

    setDisplay(String(result));
    setWaitingForOperand(true);
    setHistory(`${func}(${value}) = ${result}`);
    triggerAnimation();
  }, [display, angleMode, triggerAnimation]);

  // -------------------------------------------------------------------------
  // LOGARITHMIC FUNCTIONS
  // -------------------------------------------------------------------------
  
  /**
   * Esegue una funzione logaritmica o esponenziale
   * 
   * @param func - Nome della funzione (log, ln, exp, etc.)
   */
  const performLogarithmic = useCallback((func: string) => {
    const value = parseFloat(display);
    let result = 0;

    switch (func) {
      case "log":
        result = Math.log10(value);
        break;
      case "ln":
        result = Math.log(value);
        break;
      case "log2":
        result = Math.log2(value);
        break;
      case "exp":
        result = Math.exp(value);
        break;
      case "pow10":
        result = Math.pow(10, value);
        break;
      case "pow2":
        result = Math.pow(2, value);
        break;
      default:
        result = value;
    }

    setDisplay(String(result));
    setWaitingForOperand(true);
    setHistory(`${func}(${value}) = ${result}`);
    triggerAnimation();
  }, [display, triggerAnimation]);

  // -------------------------------------------------------------------------
  // CONSTANTS
  // -------------------------------------------------------------------------
  
  /**
   * Inserisce una costante matematica
   * 
   * @param constant - Nome della costante (pi, e, phi)
   */
  const insertConstant = useCallback((constant: string) => {
    let value = 0;

    switch (constant) {
      case "pi":
        value = Math.PI;
        break;
      case "e":
        value = Math.E;
        break;
      case "phi":
        value = (1 + Math.sqrt(5)) / 2; // Sezione aurea
        break;
    }

    setDisplay(String(value));
    setWaitingForOperand(true);
    triggerAnimation();
  }, [triggerAnimation]);

  // -------------------------------------------------------------------------
  // BITWISE OPERATIONS (Programmer Mode)
  // -------------------------------------------------------------------------
  
  /**
   * Esegue un'operazione bitwise
   * 
   * @param op - Nome dell'operazione (and, or, xor, not, etc.)
   * @param value2 - Secondo operando (opzionale per NOT)
   */
  const performBitwiseOperation = useCallback((op: string, value2?: number) => {
    const value1 = parseInt(display, baseMode);
    let result = 0;

    if (op === "not") {
      // NOT è unario, applica maschera per word size
      const mask = (1 << wordSize) - 1;
      result = (~value1) & mask;
    } else if (value2 !== undefined) {
      // Operazioni binarie
      switch (op) {
        case "and":
          result = value1 & value2;
          break;
        case "or":
          result = value1 | value2;
          break;
        case "xor":
          result = value1 ^ value2;
          break;
        case "nand":
          result = ~(value1 & value2) & ((1 << wordSize) - 1);
          break;
        case "nor":
          result = ~(value1 | value2) & ((1 << wordSize) - 1);
          break;
        case "lsh":
          result = (value1 << value2) & ((1 << wordSize) - 1);
          break;
        case "rsh":
          result = value1 >>> value2;
          break;
        case "rol":
          result = rotateLeft(value1, value2, wordSize);
          break;
        case "ror":
          result = rotateRight(value1, value2, wordSize);
          break;
      }
    }

    setDisplay(result.toString(baseMode).toUpperCase());
    setWaitingForOperand(true);
    triggerAnimation();
  }, [display, baseMode, wordSize, triggerAnimation]);

  // -------------------------------------------------------------------------
  // BASE CONVERSION (Programmer Mode)
  // -------------------------------------------------------------------------
  
  /**
   * Converte il valore corrente in una nuova base numerica
   * 
   * @param toBase - Base di destinazione (2, 8, 10, 16)
   */
  const convertBase = useCallback((toBase: BaseMode) => {
    const value = parseInt(display, baseMode);
    if (!isNaN(value)) {
      setBaseMode(toBase);
      setDisplay(value.toString(toBase).toUpperCase());
      triggerAnimation();
    }
  }, [display, baseMode, triggerAnimation]);

  /**
   * Alterna tra modalità gradi e radianti
   */
  const toggleAngleMode = useCallback(() => {
    setAngleMode(prev => prev === "deg" ? "rad" : "deg");
  }, []);

  /**
   * Imposta la dimensione word per operazioni bitwise
   * Applica maschera al valore corrente
   * 
   * @param size - Nuova dimensione word
   */
  const setWordSizeMode = useCallback((size: WordSize) => {
    setWordSize(size);
    // Riapplica maschera al valore corrente
    const value = parseInt(display, baseMode);
    const mask = (1 << size) - 1;
    const maskedValue = value & mask;
    setDisplay(maskedValue.toString(baseMode).toUpperCase());
    triggerAnimation();
  }, [display, baseMode, triggerAnimation]);

  // -------------------------------------------------------------------------
  // MEMORY OPERATIONS
  // -------------------------------------------------------------------------
  
  /** Azzera la memoria (MC) */
  const memoryClear = useCallback(() => {
    setMemory(0);
  }, []);

  /** Richiama il valore dalla memoria (MR) */
  const memoryRecall = useCallback(() => {
    setDisplay(String(memory));
    setWaitingForOperand(true);
    triggerAnimation();
  }, [memory, triggerAnimation]);

  /** Aggiunge il valore corrente alla memoria (M+) */
  const memoryAdd = useCallback(() => {
    const value = parseFloat(display);
    setMemory(prev => prev + value);
  }, [display]);

  /** Sottrae il valore corrente dalla memoria (M-) */
  const memorySubtract = useCallback(() => {
    const value = parseFloat(display);
    setMemory(prev => prev - value);
  }, [display]);

  /** Salva il valore corrente in memoria (MS) */
  const memoryStore = useCallback(() => {
    const value = parseFloat(display);
    setMemory(value);
  }, [display]);

  // -------------------------------------------------------------------------
  // RETURN VALUE
  // -------------------------------------------------------------------------
  
  /**
   * Memoizza l'oggetto di ritorno per evitare ri-renderizzazioni
   * quando lo stato non cambia
   */
  return useMemo(() => ({
    // State values
    display,
    previousValue,
    operation,
    waitingForOperand,
    memory,
    history,
    isAnimating,
    angleMode,
    wordSize,
    baseMode,
    
    // Input handlers
    inputDigit,
    inputHexDigit,
    inputDecimal,
    
    // Clear operations
    clear,
    clearEntry,
    backspace,
    
    // Basic operations
    toggleSign,
    percentage,
    performOperation,
    performUnaryOperation,
    
    // Scientific functions
    performTrigonometric,
    performLogarithmic,
    insertConstant,
    
    // Programmer functions
    performBitwiseOperation,
    convertBase,
    toggleAngleMode,
    setWordSizeMode,
    
    // Memory operations
    memoryClear,
    memoryRecall,
    memoryAdd,
    memorySubtract,
    memoryStore,
    
    // Direct setters (for advanced use)
    setDisplay,
    setWaitingForOperand,
  }), [
    display, previousValue, operation, waitingForOperand, memory,
    history, isAnimating, angleMode, wordSize, baseMode,
    inputDigit, inputHexDigit, inputDecimal,
    clear, clearEntry, backspace,
    toggleSign, percentage, performOperation, performUnaryOperation,
    performTrigonometric, performLogarithmic, insertConstant,
    performBitwiseOperation, convertBase, toggleAngleMode, setWordSizeMode,
    memoryClear, memoryRecall, memoryAdd, memorySubtract, memoryStore
  ]);
};
