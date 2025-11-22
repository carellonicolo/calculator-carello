import { useEffect, useCallback, useRef } from 'react';
import { useCalculatorState } from './useCalculatorState';
import { toast } from '@/hooks/use-toast';

interface KeyboardInputOptions {
  mode: 'standard' | 'scientific' | 'programmer';
  settings: { [key: string]: boolean };
  calc: ReturnType<typeof useCalculatorState>;
  isActive: boolean;
  onKeyPress?: (key: string) => void;
}

export const useKeyboardInput = ({
  mode,
  settings,
  calc,
  isActive,
  onKeyPress
}: KeyboardInputOptions) => {
  const lastKeyPressRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  const isEnabled = useCallback((key: string) => {
    return settings[key] !== false;
  }, [settings]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isActive) return;

    const target = e.target as HTMLElement;
    
    // Ignora se l'utente sta digitando in un input/textarea
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable) {
      return;
    }

    // Previeni ripetizioni troppo rapide
    const now = Date.now();
    if (lastKeyPressRef.current === e.key && now - lastKeyTimeRef.current < 100) {
      return;
    }
    lastKeyPressRef.current = e.key;
    lastKeyTimeRef.current = now;

    // Tasti della calcolatrice
    const isCalculatorKey = /^[0-9a-f+\-*/%.=()!|&~<>^pectslnqrmhxy]$/i.test(e.key) || 
                           e.key === 'Enter' || 
                           e.key === 'Escape' || 
                           e.key === 'Backspace' || 
                           e.key === 'Delete' ||
                           e.key === '.' ||
                           e.key === '?' ||
                           e.key === '/' ||
                           (e.shiftKey && e.key === '/');

    if (isCalculatorKey) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Callback per feedback visivo
    onKeyPress?.(e.key);

    // Gestione numeri 0-9
    if (/^[0-9]$/.test(e.key)) {
      const digit = parseInt(e.key);
      
      // Verifica validità per base corrente in programmer mode
      if (mode === 'programmer') {
        if (calc.baseMode === 2 && digit > 1) {
          toast({
            title: "Invalid digit",
            description: `Only 0-1 are valid in binary mode`,
            variant: "destructive"
          });
          return;
        }
        if (calc.baseMode === 8 && digit > 7) {
          toast({
            title: "Invalid digit",
            description: `Only 0-7 are valid in octal mode`,
            variant: "destructive"
          });
          return;
        }
      }
      
      calc.inputDigit(e.key);
      return;
    }

    // Gestione hex digits A-F (solo programmer mode in HEX)
    if (mode === 'programmer' && calc.baseMode === 16 && /^[a-f]$/i.test(e.key)) {
      if (isEnabled('conversions_prog')) {
        calc.inputHexDigit(e.key.toUpperCase());
      }
      return;
    }

    // Operatori e funzioni base
    switch (e.key.toLowerCase()) {
      case '+':
        calc.performOperation('+');
        break;
      case '-':
        if (e.ctrlKey || e.metaKey) return; // Lascia zoom browser
        calc.performOperation('-');
        break;
      case '*':
        calc.performOperation('×');
        break;
      case '/':
        if (e.ctrlKey || e.metaKey) return; // Lascia ricerca browser
        calc.performOperation('÷');
        break;
      case 'enter':
        calc.performOperation('=');
        break;
      case '.':
        calc.inputDecimal();
        break;
      case 'escape':
        calc.clear();
        break;
      case 'delete':
        calc.clear();
        break;
      case 'backspace':
        calc.backspace();
        break;
      case '%':
        if (isEnabled('percentage')) {
          calc.percentage();
        }
        break;

      // Scientific mode - Constants
      case 'p':
        if (mode === 'scientific' && isEnabled('pi')) {
          calc.insertConstant('pi');
        } else if (!isEnabled('pi')) {
          toast({
            title: "Function disabled",
            description: "π constant is disabled by admin",
            variant: "destructive"
          });
        }
        break;
      case 'e':
        if (mode === 'scientific' && isEnabled('e') && !e.ctrlKey && !e.metaKey) {
          calc.insertConstant('e');
        } else if (!isEnabled('e')) {
          toast({
            title: "Function disabled",
            description: "e constant is disabled by admin",
            variant: "destructive"
          });
        }
        break;

      // Scientific mode - Trigonometric
      case 's':
        if (mode === 'scientific') {
          if (e.shiftKey && isEnabled('asin')) {
            calc.performTrigonometric('asin');
          } else if (isEnabled('sin')) {
            calc.performTrigonometric('sin');
          } else {
            toast({
              title: "Function disabled",
              description: "sin function is disabled by admin",
              variant: "destructive"
            });
          }
        }
        break;
      case 'c':
        if (mode === 'scientific') {
          if (e.shiftKey && isEnabled('acos')) {
            calc.performTrigonometric('acos');
          } else if (isEnabled('cos')) {
            calc.performTrigonometric('cos');
          } else {
            toast({
              title: "Function disabled",
              description: "cos function is disabled by admin",
              variant: "destructive"
            });
          }
        }
        break;
      case 't':
        if (mode === 'scientific') {
          if (e.shiftKey && isEnabled('atan')) {
            calc.performTrigonometric('atan');
          } else if (isEnabled('tan')) {
            calc.performTrigonometric('tan');
          } else {
            toast({
              title: "Function disabled",
              description: "tan function is disabled by admin",
              variant: "destructive"
            });
          }
        }
        break;

      // Scientific mode - Other functions
      case 'q':
        if (mode === 'scientific' && isEnabled('sqrt')) {
          calc.performUnaryOperation('√');
        }
        break;
      case 'r':
        if (mode === 'scientific') {
          if (e.shiftKey && isEnabled('cube')) {
            calc.performUnaryOperation('x³');
          } else if (isEnabled('square_sci')) {
            calc.performUnaryOperation('x²');
          }
        }
        break;
      case '^':
        if (mode === 'scientific' && isEnabled('power')) {
          calc.performOperation('xʸ');
        }
        break;
      case '!':
        if (mode === 'scientific' && isEnabled('factorial')) {
          calc.performUnaryOperation('n!');
        }
        break;
      case 'l':
        if (mode === 'scientific' && isEnabled('log')) {
          calc.performLogarithmic('log');
        }
        break;
      case 'n':
        if (mode === 'scientific' && isEnabled('ln')) {
          calc.performLogarithmic('ln');
        }
        break;
      case 'm':
        if (mode === 'scientific' && isEnabled('mod') && !e.ctrlKey && !e.metaKey) {
          calc.performOperation('mod');
        }
        break;

      // Scientific mode - Hyperbolic
      case 'h':
        if (mode === 'scientific') {
          if (e.shiftKey && isEnabled('cosh')) {
            calc.performTrigonometric('cosh');
          } else if (isEnabled('sinh')) {
            calc.performTrigonometric('sinh');
          }
        }
        break;
      case 'y':
        if (mode === 'scientific' && isEnabled('tanh')) {
          calc.performTrigonometric('tanh');
        }
        break;

      // Programmer mode - Bitwise operations
      case '&':
        if (mode === 'programmer' && isEnabled('and')) {
          calc.performBitwiseOperation('AND');
        }
        break;
      case '|':
        if (mode === 'programmer' && isEnabled('or')) {
          calc.performBitwiseOperation('OR');
        }
        break;
      case '~':
        if (mode === 'programmer' && isEnabled('not')) {
          calc.performBitwiseOperation('NOT');
        }
        break;
      case 'x':
        if (mode === 'programmer' && isEnabled('xor')) {
          calc.performBitwiseOperation('XOR');
        }
        break;
      case '<':
        if (mode === 'programmer' && isEnabled('lsh')) {
          calc.performBitwiseOperation('<<');
        }
        break;
      case '>':
        if (mode === 'programmer' && isEnabled('rsh')) {
          calc.performBitwiseOperation('>>');
        }
        break;

      // Shortcuts con modificatori
      default:
        // Alt shortcuts
        if (e.altKey) {
          if (e.key.toLowerCase() === 'd' && mode === 'scientific') {
            calc.toggleAngleMode();
          }
        }
        
        // Ctrl/Cmd shortcuts
        if (e.ctrlKey || e.metaKey) {
          switch (e.key.toLowerCase()) {
            case 'm':
              if (isEnabled('memory')) {
                calc.memoryStore();
              }
              break;
            case 'r':
              if (isEnabled('memory')) {
                calc.memoryRecall();
              }
              break;
            case 'p':
              if (isEnabled('memory')) {
                calc.memoryAdd();
              }
              break;
            case 'q':
              if (isEnabled('memory')) {
                calc.memorySubtract();
              }
              break;
            case 'l':
              if (isEnabled('memory')) {
                calc.memoryClear();
              }
              break;
            
            // Programmer mode - Base conversions
            case 'h':
              if (mode === 'programmer' && isEnabled('conversions_prog')) {
                calc.convertBase(16);
              }
              break;
            case 'd':
              if (mode === 'programmer' && isEnabled('conversions_prog')) {
                calc.convertBase(10);
              }
              break;
            case 'o':
              if (mode === 'programmer' && isEnabled('conversions_prog')) {
                calc.convertBase(8);
              }
              break;
            case 'b':
              if (mode === 'programmer' && isEnabled('conversions_prog')) {
                calc.convertBase(2);
              }
              break;
            
            // Programmer mode - Word size
            case '1':
              if (mode === 'programmer' && isEnabled('word_size')) {
                calc.setWordSizeMode(8);
              }
              break;
            case '2':
              if (mode === 'programmer' && isEnabled('word_size')) {
                calc.setWordSizeMode(16);
              }
              break;
            case '3':
              if (mode === 'programmer' && isEnabled('word_size')) {
                calc.setWordSizeMode(32);
              }
              break;
            case '4':
              if (mode === 'programmer' && isEnabled('word_size')) {
                calc.setWordSizeMode(64);
              }
              break;
          }
        }
    }
  }, [isActive, mode, settings, calc, isEnabled, onKeyPress]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
