import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

type CalculatorSettings = {
  [key: string]: boolean;
};

export const Calculator = () => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [settings, setSettings] = useState<CalculatorSettings>({});
  const [calculatorEnabled, setCalculatorEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
    fetchGlobalSettings();
    
    // Subscribe to real-time changes
    const settingsChannel = supabase
      .channel('calculator_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calculator_settings' },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    const globalChannel = supabase
      .channel('global_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'global_settings' },
        () => {
          fetchGlobalSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(globalChannel);
    };
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('calculator_settings')
      .select('function_key, is_enabled');
    
    if (error) {
      console.error('Error fetching settings:', error);
      return;
    }
    
    const settingsMap: CalculatorSettings = {};
    data?.forEach(item => {
      settingsMap[item.function_key] = item.is_enabled;
    });
    setSettings(settingsMap);
  };

  const fetchGlobalSettings = async () => {
    const { data, error } = await supabase
      .from('global_settings')
      .select('setting_value')
      .eq('setting_key', 'calculator_enabled')
      .single();
    
    if (error) {
      console.error('Error fetching global settings:', error);
    } else {
      setCalculatorEnabled(data?.setting_value ?? true);
    }
  };

  const isEnabled = (key: string) => settings[key] !== false;

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(String(digit));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? String(digit) : display + digit);
    }
  };

  const inputDecimal = () => {
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
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
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
          newValue = currentValue * inputValue;
          break;
        case "/":
          newValue = currentValue / inputValue;
          break;
        case "^":
          newValue = Math.pow(currentValue, inputValue);
          break;
      }

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const performScientific = (func: string) => {
    const value = parseFloat(display);
    let result = 0;

    switch (func) {
      case "sin":
        result = Math.sin(value);
        break;
      case "cos":
        result = Math.cos(value);
        break;
      case "tan":
        result = Math.tan(value);
        break;
      case "asin":
        result = Math.asin(value);
        break;
      case "acos":
        result = Math.acos(value);
        break;
      case "atan":
        result = Math.atan(value);
        break;
      case "log":
        result = Math.log10(value);
        break;
      case "ln":
        result = Math.log(value);
        break;
      case "exp":
        result = Math.exp(value);
        break;
      case "sqrt":
        result = Math.sqrt(value);
        break;
      case "cbrt":
        result = Math.cbrt(value);
        break;
      case "factorial":
        result = factorial(Math.floor(value));
        break;
      case "pi":
        result = Math.PI;
        break;
      case "e":
        result = Math.E;
        break;
    }

    setDisplay(String(result));
    setWaitingForOperand(true);
  };

  const factorial = (n: number): number => {
    if (n < 0) return 0;
    if (n === 0 || n === 1) return 1;
    return n * factorial(n - 1);
  };

  const convertBase = (from: number, to: number) => {
    const value = parseInt(display, from);
    if (isNaN(value)) {
      toast({
        title: "Errore",
        description: "Valore non valido per la conversione",
        variant: "destructive",
      });
      return;
    }
    setDisplay(value.toString(to).toUpperCase());
    setWaitingForOperand(true);
  };

  const toggleSign = () => {
    const value = parseFloat(display);
    setDisplay(String(value * -1));
  };

  const percentage = () => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

  const buttonClass = "h-14 text-lg font-semibold transition-all active:scale-95";
  const numberClass = `${buttonClass} bg-[hsl(var(--calculator-button))] hover:bg-[hsl(var(--calculator-button-hover))] text-[hsl(var(--calculator-text))]`;
  const operatorClass = `${buttonClass} bg-[hsl(var(--calculator-operator))] hover:bg-[hsl(var(--calculator-operator-hover))] text-white`;
  const specialClass = `${buttonClass} bg-[hsl(var(--calculator-special))] hover:bg-[hsl(var(--calculator-special-hover))] text-white`;
  const disabledClass = `${buttonClass} bg-[hsl(var(--calculator-disabled))] text-muted-foreground cursor-not-allowed opacity-50`;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md p-6 bg-[hsl(var(--calculator-bg))] border-none shadow-2xl relative">
        {!calculatorEnabled && (
          <div className="absolute inset-0 bg-[hsl(var(--calculator-bg))]/95 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center p-8">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-[hsl(var(--calculator-operator))] mx-auto mb-4" />
              <h3 className="text-[hsl(var(--calculator-text))] text-xl font-bold mb-2">
                Calcolatrice Temporaneamente Non Disponibile
              </h3>
              <p className="text-[hsl(var(--calculator-text))]/70">
                Le funzionalità sono state disabilitate dall'amministratore
              </p>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <div className="bg-[hsl(var(--calculator-display))] rounded-lg p-6 text-right">
            <div className="text-4xl font-bold text-[hsl(var(--calculator-text))] break-all">
              {display}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* Row 1: Clear, Sign, Percentage, Division */}
          <div className="grid grid-cols-4 gap-3">
            <Button onClick={clear} className={specialClass}>AC</Button>
            <Button onClick={toggleSign} className={specialClass}>+/-</Button>
            <Button onClick={percentage} className={specialClass}>%</Button>
            <Button onClick={() => performOperation("/")} className={operatorClass}>÷</Button>
          </div>

          {/* Row 2: 7, 8, 9, Multiply */}
          <div className="grid grid-cols-4 gap-3">
            <Button onClick={() => inputDigit("7")} className={numberClass}>7</Button>
            <Button onClick={() => inputDigit("8")} className={numberClass}>8</Button>
            <Button onClick={() => inputDigit("9")} className={numberClass}>9</Button>
            <Button onClick={() => performOperation("*")} className={operatorClass}>×</Button>
          </div>

          {/* Row 3: 4, 5, 6, Subtract */}
          <div className="grid grid-cols-4 gap-3">
            <Button onClick={() => inputDigit("4")} className={numberClass}>4</Button>
            <Button onClick={() => inputDigit("5")} className={numberClass}>5</Button>
            <Button onClick={() => inputDigit("6")} className={numberClass}>6</Button>
            <Button onClick={() => performOperation("-")} className={operatorClass}>−</Button>
          </div>

          {/* Row 4: 1, 2, 3, Add */}
          <div className="grid grid-cols-4 gap-3">
            <Button onClick={() => inputDigit("1")} className={numberClass}>1</Button>
            <Button onClick={() => inputDigit("2")} className={numberClass}>2</Button>
            <Button onClick={() => inputDigit("3")} className={numberClass}>3</Button>
            <Button onClick={() => performOperation("+")} className={operatorClass}>+</Button>
          </div>

          {/* Row 5: 0, Decimal, Equals */}
          <div className="grid grid-cols-4 gap-3">
            <Button onClick={() => inputDigit("0")} className={`${numberClass} col-span-2`}>0</Button>
            <Button onClick={inputDecimal} className={numberClass}>.</Button>
            <Button onClick={() => performOperation("=")} className={operatorClass}>=</Button>
          </div>

          {/* Scientific Functions */}
          {isEnabled('trigonometric') && (
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[hsl(var(--calculator-button))]">
              <Button 
                onClick={() => performScientific("sin")} 
                className={isEnabled('sin') ? specialClass : disabledClass}
                disabled={!isEnabled('sin')}
              >
                sin
              </Button>
              <Button 
                onClick={() => performScientific("cos")} 
                className={isEnabled('cos') ? specialClass : disabledClass}
                disabled={!isEnabled('cos')}
              >
                cos
              </Button>
              <Button 
                onClick={() => performScientific("tan")} 
                className={isEnabled('tan') ? specialClass : disabledClass}
                disabled={!isEnabled('tan')}
              >
                tan
              </Button>
            </div>
          )}

          {isEnabled('logarithms') && (
            <div className="grid grid-cols-4 gap-3">
              <Button 
                onClick={() => performScientific("log")} 
                className={isEnabled('log') ? specialClass : disabledClass}
                disabled={!isEnabled('log')}
              >
                log
              </Button>
              <Button 
                onClick={() => performScientific("ln")} 
                className={isEnabled('ln') ? specialClass : disabledClass}
                disabled={!isEnabled('ln')}
              >
                ln
              </Button>
              <Button 
                onClick={() => performScientific("exp")} 
                className={isEnabled('exp') ? specialClass : disabledClass}
                disabled={!isEnabled('exp')}
              >
                e^x
              </Button>
              <Button 
                onClick={() => performOperation("^")} 
                className={isEnabled('power') ? specialClass : disabledClass}
                disabled={!isEnabled('power')}
              >
                x^y
              </Button>
            </div>
          )}

          {isEnabled('advanced_ops') && (
            <div className="grid grid-cols-3 gap-3">
              <Button 
                onClick={() => performScientific("sqrt")} 
                className={isEnabled('sqrt') ? specialClass : disabledClass}
                disabled={!isEnabled('sqrt')}
              >
                √
              </Button>
              <Button 
                onClick={() => performScientific("cbrt")} 
                className={isEnabled('cbrt') ? specialClass : disabledClass}
                disabled={!isEnabled('cbrt')}
              >
                ∛
              </Button>
              <Button 
                onClick={() => performScientific("factorial")} 
                className={isEnabled('factorial') ? specialClass : disabledClass}
                disabled={!isEnabled('factorial')}
              >
                n!
              </Button>
            </div>
          )}

          {isEnabled('constants') && (
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => performScientific("pi")} 
                className={isEnabled('pi') ? specialClass : disabledClass}
                disabled={!isEnabled('pi')}
              >
                π
              </Button>
              <Button 
                onClick={() => performScientific("e")} 
                className={isEnabled('e') ? specialClass : disabledClass}
                disabled={!isEnabled('e')}
              >
                e
              </Button>
            </div>
          )}

          {/* Base Conversions */}
          {isEnabled('base_conversions') && (
            <div className="space-y-3 pt-3 border-t border-[hsl(var(--calculator-button))]">
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  onClick={() => convertBase(10, 2)} 
                  className={isEnabled('base_10_to_2') ? specialClass : disabledClass}
                  disabled={!isEnabled('base_10_to_2')}
                >
                  BIN
                </Button>
                <Button 
                  onClick={() => convertBase(10, 8)} 
                  className={isEnabled('base_10_to_8') ? specialClass : disabledClass}
                  disabled={!isEnabled('base_10_to_8')}
                >
                  OCT
                </Button>
                <Button 
                  onClick={() => convertBase(10, 16)} 
                  className={isEnabled('base_10_to_16') ? specialClass : disabledClass}
                  disabled={!isEnabled('base_10_to_16')}
                >
                  HEX
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  onClick={() => convertBase(2, 10)} 
                  className={isEnabled('base_2_to_10') ? specialClass : disabledClass}
                  disabled={!isEnabled('base_2_to_10')}
                >
                  →DEC
                </Button>
                <Button 
                  onClick={() => convertBase(8, 10)} 
                  className={isEnabled('base_8_to_10') ? specialClass : disabledClass}
                  disabled={!isEnabled('base_8_to_10')}
                >
                  →DEC
                </Button>
                <Button 
                  onClick={() => convertBase(16, 10)} 
                  className={isEnabled('base_16_to_10') ? specialClass : disabledClass}
                  disabled={!isEnabled('base_16_to_10')}
                >
                  →DEC
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
