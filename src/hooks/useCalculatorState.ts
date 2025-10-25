import { useState } from "react";

export type AngleMode = "deg" | "rad";
export type WordSize = 8 | 16 | 32 | 64;
export type BaseMode = 2 | 8 | 10 | 16;

export interface CalculatorState {
  display: string;
  previousValue: number | null;
  operation: string | null;
  waitingForOperand: boolean;
  memory: number;
  history: string;
  isAnimating: boolean;
  angleMode: AngleMode;
  wordSize: WordSize;
  baseMode: BaseMode;
}

export const useCalculatorState = () => {
  const [display, setDisplay] = useState<string>("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [memory, setMemory] = useState<number>(0);
  const [history, setHistory] = useState<string>("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [angleMode, setAngleMode] = useState<AngleMode>("deg");
  const [wordSize, setWordSize] = useState<WordSize>(32);
  const [baseMode, setBaseMode] = useState<BaseMode>(10);

  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const inputDigit = (digit: string) => {
    triggerAnimation();

    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputHexDigit = (digit: string) => {
    triggerAnimation();

    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      const currentValue = parseInt(display, baseMode);
      const newDigit = parseInt(digit, 16);

      if (isNaN(currentValue) || isNaN(newDigit)) {
        setDisplay(digit);
      } else {
        const newValue = currentValue * 16 + newDigit;
        setDisplay(newValue.toString(baseMode).toUpperCase());
      }
    }
  };

  const inputDecimal = () => {
    if (baseMode !== 10) return; // Decimal point only for base 10

    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setHistory("");
    triggerAnimation();
  };

  const clearEntry = () => {
    setDisplay("0");
    triggerAnimation();
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
    triggerAnimation();
  };

  const toggleSign = () => {
    const value = parseFloat(display);
    setDisplay(String(value * -1));
    triggerAnimation();
  };

  const percentage = () => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
    setWaitingForOperand(true);
    triggerAnimation();
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
      setHistory(`${inputValue} ${nextOperation}`);
    } else if (operation && nextOperation === "=") {
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
      setPreviousValue(null);
      setOperation(null);
      setHistory(`${currentValue} ${operation} ${inputValue} = ${newValue}`);
      triggerAnimation();
      return;
    } else if (operation) {
      // Chain operations
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
  };

  const performUnaryOperation = (op: string) => {
    let value = parseFloat(display);
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
  };

  const performTrigonometric = (func: string) => {
    let value = parseFloat(display);
    let result = 0;

    // Convert to radians if in degree mode
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
  };

  const performLogarithmic = (func: string) => {
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
  };

  const insertConstant = (constant: string) => {
    let value = 0;

    switch (constant) {
      case "pi":
        value = Math.PI;
        break;
      case "e":
        value = Math.E;
        break;
      case "phi":
        value = (1 + Math.sqrt(5)) / 2; // Golden ratio
        break;
    }

    setDisplay(String(value));
    setWaitingForOperand(true);
    triggerAnimation();
  };

  const performBitwiseOperation = (op: string, value2?: number) => {
    const value1 = parseInt(display, baseMode);
    let result = 0;

    if (op === "not") {
      // Apply mask based on word size
      const mask = (1 << wordSize) - 1;
      result = (~value1) & mask;
    } else if (value2 !== undefined) {
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
  };

  const convertBase = (toBase: BaseMode) => {
    const value = parseInt(display, baseMode);
    if (!isNaN(value)) {
      setBaseMode(toBase);
      setDisplay(value.toString(toBase).toUpperCase());
      triggerAnimation();
    }
  };

  const toggleAngleMode = () => {
    setAngleMode(angleMode === "deg" ? "rad" : "deg");
  };

  const setWordSizeMode = (size: WordSize) => {
    setWordSize(size);
    // Re-apply mask to current value
    const value = parseInt(display, baseMode);
    const mask = (1 << size) - 1;
    const maskedValue = value & mask;
    setDisplay(maskedValue.toString(baseMode).toUpperCase());
    triggerAnimation();
  };

  // Memory operations
  const memoryClear = () => {
    setMemory(0);
  };

  const memoryRecall = () => {
    setDisplay(String(memory));
    setWaitingForOperand(true);
    triggerAnimation();
  };

  const memoryAdd = () => {
    const value = parseFloat(display);
    setMemory(memory + value);
  };

  const memorySubtract = () => {
    const value = parseFloat(display);
    setMemory(memory - value);
  };

  const memoryStore = () => {
    const value = parseFloat(display);
    setMemory(value);
  };

  return {
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
    inputDigit,
    inputHexDigit,
    inputDecimal,
    clear,
    clearEntry,
    backspace,
    toggleSign,
    percentage,
    performOperation,
    performUnaryOperation,
    performTrigonometric,
    performLogarithmic,
    insertConstant,
    performBitwiseOperation,
    convertBase,
    toggleAngleMode,
    setWordSizeMode,
    memoryClear,
    memoryRecall,
    memoryAdd,
    memorySubtract,
    memoryStore,
    setDisplay,
    setWaitingForOperand,
  };
};

// Helper functions
const factorial = (n: number): number => {
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity; // Prevent overflow
  return n * factorial(n - 1);
};

const rotateLeft = (value: number, shift: number, bits: number): number => {
  shift = shift % bits;
  const mask = (1 << bits) - 1;
  return ((value << shift) | (value >>> (bits - shift))) & mask;
};

const rotateRight = (value: number, shift: number, bits: number): number => {
  shift = shift % bits;
  const mask = (1 << bits) - 1;
  return ((value >>> shift) | (value << (bits - shift))) & mask;
};
