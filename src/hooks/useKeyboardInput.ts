/**
 * ============================================================================
 * useKeyboardInput.ts
 * ============================================================================
 * 
 * Hook per gestire l'input da tastiera fisica sulla calcolatrice.
 * Supporta tutte le modalità (Standard, Scientific, Programmer) con
 * shortcut contestuali e feedback visivo.
 * 
 * FEATURES:
 * - Mapping tasti numerici 0-9 e A-F (hex)
 * - Operatori aritmetici (+, -, *, /)
 * - Funzioni scientifiche (sin, cos, tan, log, etc.)
 * - Operazioni bitwise per modalità programmer
 * - Shortcut con modificatori (Ctrl, Alt, Shift)
 * - Rispetta le impostazioni admin (funzioni disabilitate)
 * - Previene azioni browser predefinite per tasti calcolatrice
 * 
 * @author Prof. Nicolò Carello
 * ============================================================================
 */

import { useEffect, useCallback, useRef } from 'react';
import { useCalculatorState } from './useCalculatorState';
import { toast } from '@/hooks/use-toast';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Opzioni di configurazione per l'hook
 */
interface KeyboardInputOptions {
  /** Modalità calcolatrice corrente */
  mode: 'standard' | 'scientific' | 'programmer';
  
  /** Mappa delle funzioni abilitate/disabilitate */
  settings: { [key: string]: boolean };
  
  /** Istanza del calculator state hook */
  calc: ReturnType<typeof useCalculatorState>;
  
  /** Flag: se true, l'hook processa gli eventi */
  isActive: boolean;
  
  /** Callback opzionale per feedback visivo sui tasti */
  onKeyPress?: (key: string) => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook per gestire input da tastiera fisica
 * 
 * @param options - Configurazione dell'hook
 * 
 * @example
 * ```tsx
 * useKeyboardInput({
 *   mode: 'scientific',
 *   settings: settingsFromDB,
 *   calc: useCalculatorState(),
 *   isActive: true,
 *   onKeyPress: (key) => highlightButton(key)
 * });
 * ```
 */
export const useKeyboardInput = ({
  mode,
  settings,
  calc,
  isActive,
  onKeyPress
}: KeyboardInputOptions) => {
  // -------------------------------------------------------------------------
  // REFS per prevenire ripetizioni troppo rapide
  // -------------------------------------------------------------------------
  
  /** Ultimo tasto premuto */
  const lastKeyPressRef = useRef<string>('');
  
  /** Timestamp ultimo tasto */
  const lastKeyTimeRef = useRef<number>(0);

  // -------------------------------------------------------------------------
  // UTILITY FUNCTIONS
  // -------------------------------------------------------------------------
  
  /**
   * Verifica se una funzione è abilitata nelle impostazioni
   * @param key - Chiave della funzione
   * @returns true se abilitata (default se non definita)
   */
  const isEnabled = useCallback((key: string) => {
    return settings[key] !== false;
  }, [settings]);

  // -------------------------------------------------------------------------
  // MAIN HANDLER
  // -------------------------------------------------------------------------
  
  /**
   * Handler principale per eventi keydown
   * Processa tutti i tasti e dispensa l'azione appropriata
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip se hook non attivo
    if (!isActive) return;

    const target = e.target as HTMLElement;
    
    // -----------------------------------------------------------------------
    // IGNORA INPUT FIELDS
    // Permette digitazione normale in campi di testo
    // -----------------------------------------------------------------------
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable) {
      return;
    }

    // -----------------------------------------------------------------------
    // DEBOUNCE: previene ripetizioni troppo rapide
    // Utile per evitare input multipli accidentali
    // -----------------------------------------------------------------------
    const now = Date.now();
    if (lastKeyPressRef.current === e.key && now - lastKeyTimeRef.current < 100) {
      return;
    }
    lastKeyPressRef.current = e.key;
    lastKeyTimeRef.current = now;

    // -----------------------------------------------------------------------
    // IDENTIFICA TASTI CALCOLATRICE
    // Previene azioni browser default per questi tasti
    // -----------------------------------------------------------------------
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

    // Callback per feedback visivo (es. highlight pulsante)
    onKeyPress?.(e.key);

    // -----------------------------------------------------------------------
    // GESTIONE NUMERI 0-9
    // -----------------------------------------------------------------------
    if (/^[0-9]$/.test(e.key)) {
      const digit = parseInt(e.key);
      
      // Validazione per base corrente in programmer mode
      if (mode === 'programmer') {
        // Binario: solo 0-1
        if (calc.baseMode === 2 && digit > 1) {
          toast({
            title: "Cifra non valida",
            description: `Solo 0-1 sono valide in modalità binaria`,
            variant: "destructive"
          });
          return;
        }
        // Ottale: solo 0-7
        if (calc.baseMode === 8 && digit > 7) {
          toast({
            title: "Cifra non valida",
            description: `Solo 0-7 sono valide in modalità ottale`,
            variant: "destructive"
          });
          return;
        }
      }
      
      calc.inputDigit(e.key);
      return;
    }

    // -----------------------------------------------------------------------
    // GESTIONE HEX DIGITS A-F (solo programmer mode in base 16)
    // -----------------------------------------------------------------------
    if (mode === 'programmer' && calc.baseMode === 16 && /^[a-f]$/i.test(e.key)) {
      if (isEnabled('conversions_prog')) {
        calc.inputHexDigit(e.key.toUpperCase());
      }
      return;
    }

    // -----------------------------------------------------------------------
    // OPERATORI E FUNZIONI
    // -----------------------------------------------------------------------
    switch (e.key.toLowerCase()) {
      // Operatori aritmetici base
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
        
      // Controlli
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

      // =====================================================================
      // SCIENTIFIC MODE - Costanti
      // =====================================================================
      case 'p':
        if (mode === 'scientific' && isEnabled('pi')) {
          calc.insertConstant('pi');
        } else if (!isEnabled('pi')) {
          toast({
            title: "Funzione disabilitata",
            description: "La costante π è disabilitata dall'amministratore",
            variant: "destructive"
          });
        }
        break;
      case 'e':
        if (mode === 'scientific' && isEnabled('e') && !e.ctrlKey && !e.metaKey) {
          calc.insertConstant('e');
        } else if (!isEnabled('e')) {
          toast({
            title: "Funzione disabilitata",
            description: "La costante e è disabilitata dall'amministratore",
            variant: "destructive"
          });
        }
        break;

      // =====================================================================
      // SCIENTIFIC MODE - Trigonometria
      // =====================================================================
      case 's':
        if (mode === 'scientific') {
          if (e.shiftKey && isEnabled('asin')) {
            calc.performTrigonometric('asin');
          } else if (isEnabled('sin')) {
            calc.performTrigonometric('sin');
          } else {
            toast({
              title: "Funzione disabilitata",
              description: "La funzione sin è disabilitata dall'amministratore",
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
              title: "Funzione disabilitata",
              description: "La funzione cos è disabilitata dall'amministratore",
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
              title: "Funzione disabilitata",
              description: "La funzione tan è disabilitata dall'amministratore",
              variant: "destructive"
            });
          }
        }
        break;

      // =====================================================================
      // SCIENTIFIC MODE - Altre funzioni
      // =====================================================================
      
      // FIX: usa 'sqrt' invece di '√' per matchare il nome funzione corretto
      case 'q':
        if (mode === 'scientific' && isEnabled('sqrt')) {
          calc.performUnaryOperation('sqrt');
        }
        break;
      case 'r':
        if (mode === 'scientific') {
          if (e.shiftKey && isEnabled('cube')) {
            calc.performUnaryOperation('cube');
          } else if (isEnabled('square_sci')) {
            calc.performUnaryOperation('square');
          }
        }
        break;
      case '^':
        if (mode === 'scientific' && isEnabled('power')) {
          calc.performOperation('^');
        }
        break;
      case '!':
        if (mode === 'scientific' && isEnabled('factorial')) {
          calc.performUnaryOperation('factorial');
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

      // =====================================================================
      // SCIENTIFIC MODE - Iperboliche
      // =====================================================================
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

      // =====================================================================
      // PROGRAMMER MODE - Operazioni Bitwise
      // =====================================================================
      case '&':
        if (mode === 'programmer' && isEnabled('and')) {
          calc.performBitwiseOperation('and');
        }
        break;
      case '|':
        if (mode === 'programmer' && isEnabled('or')) {
          calc.performBitwiseOperation('or');
        }
        break;
      case '~':
        if (mode === 'programmer' && isEnabled('not')) {
          calc.performBitwiseOperation('not');
        }
        break;
      case 'x':
        if (mode === 'programmer' && isEnabled('xor')) {
          calc.performBitwiseOperation('xor');
        }
        break;
      case '<':
        if (mode === 'programmer' && isEnabled('lsh')) {
          calc.performBitwiseOperation('lsh', 1);
        }
        break;
      case '>':
        if (mode === 'programmer' && isEnabled('rsh')) {
          calc.performBitwiseOperation('rsh', 1);
        }
        break;

      // =====================================================================
      // SHORTCUT CON MODIFICATORI
      // =====================================================================
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
            // Memory operations
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
            
            // Programmer mode - Conversioni base
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

  // -------------------------------------------------------------------------
  // EFFECT: Registra/deregistra event listener
  // -------------------------------------------------------------------------
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
