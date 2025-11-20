import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Calculator as CalcIcon, Atom, Code } from "lucide-react";
import { StandardCalculator } from "./modes/StandardCalculator";
import { ScientificCalculator } from "./modes/ScientificCalculator";
import { ProgrammerCalculator } from "./modes/ProgrammerCalculator";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";

type CalculatorSettings = {
  [key: string]: boolean;
};

type CalculatorMode = {
  mode_key: string;
  mode_name: string;
  is_enabled: boolean;
  display_order: number;
};

// Default modes if database table doesn't exist yet
const DEFAULT_MODES: CalculatorMode[] = [
  {
    mode_key: "standard",
    mode_name: "Standard",
    is_enabled: true,
    display_order: 1,
  },
  {
    mode_key: "scientific",
    mode_name: "Scientifica",
    is_enabled: true,
    display_order: 2,
  },
  {
    mode_key: "programmer",
    mode_name: "Programmatore",
    is_enabled: true,
    display_order: 3,
  },
];

export const Calculator = () => {
  const [settings, setSettings] = useState<CalculatorSettings>({});
  const [modes, setModes] = useState<CalculatorMode[]>(DEFAULT_MODES);
  const [calculatorEnabled, setCalculatorEnabled] = useState(true);
  const [currentMode, setCurrentMode] = useState<string>("standard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isKeyboardActive, setIsKeyboardActive] = useState(true);

  // Listen for "?" key to show shortcuts modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '?' || (e.shiftKey && e.key === '/')) && !showShortcuts) {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts]);

  useEffect(() => {
    const initCalculator = async () => {
      try {
        await Promise.all([
          fetchSettings(),
          fetchModes(),
          fetchGlobalSettings(),
        ]);
      } catch (err) {
        console.error("Error initializing calculator:", err);
        setError("Errore nel caricamento della calcolatrice");
      } finally {
        setLoading(false);
      }
    };

    initCalculator();

    // Use polling instead of realtime to prevent WebSocket errors that affect SEO
    // Poll every 30 seconds for settings updates
    const pollInterval = setInterval(() => {
      fetchSettings();
      fetchGlobalSettings();
      fetchModes();
    }, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("calculator_settings")
        .select("function_key, is_enabled");

      if (error) {
        console.error("Error fetching settings:", error);
        return;
      }

      const settingsMap: CalculatorSettings = {};
      data?.forEach((item) => {
        settingsMap[item.function_key] = item.is_enabled;
      });
      setSettings(settingsMap);
    } catch (err) {
      console.error("Exception fetching settings:", err);
    }
  };

  const fetchModes = async () => {
    try {
      const { data, error } = await supabase
        .from("calculator_modes")
        .select("*")
        .order("display_order");

      if (error) {
        // Table might not exist yet, use default modes
        console.log("Calculator modes table not found, using defaults:", error);
        setModes(DEFAULT_MODES);
        return;
      }

      if (data && data.length > 0) {
        setModes(data);
      } else {
        // No data, use defaults
        setModes(DEFAULT_MODES);
      }
    } catch (err) {
      console.error("Exception fetching modes:", err);
      setModes(DEFAULT_MODES);
    }
  };

  const fetchGlobalSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("global_settings")
        .select("setting_value")
        .eq("setting_key", "calculator_enabled")
        .single();

      if (error) {
        console.error("Error fetching global settings:", error);
        return;
      }

      setCalculatorEnabled(data?.setting_value ?? true);
    } catch (err) {
      console.error("Exception fetching global settings:", err);
    }
  };

  const getModeIcon = (modeKey: string) => {
    switch (modeKey) {
      case "standard":
        return <CalcIcon className="h-4 w-4" />;
      case "scientific":
        return <Atom className="h-4 w-4" />;
      case "programmer":
        return <Code className="h-4 w-4" />;
      default:
        return <CalcIcon className="h-4 w-4" />;
    }
  };

  const enabledModes = modes.filter((mode) => mode.is_enabled);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Errore</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center sm:min-h-screen p-4 pt-6 sm:pt-4 pb-24 sm:pb-4">
      <Card className="w-full max-w-2xl p-3 sm:p-6 bg-[hsl(var(--calculator-bg))]/95 backdrop-blur-xl border-2 border-primary/20 shadow-2xl relative overflow-hidden animate-slide-in-up">
        {/* Animated border glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 animate-pulse opacity-50 pointer-events-none" />

        {!calculatorEnabled && (
          <div className="absolute inset-0 bg-[hsl(var(--calculator-bg))]/95 backdrop-blur-sm rounded-lg z-20 flex items-center justify-center p-8">
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

        <div className="relative z-10">
          {enabledModes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[hsl(var(--calculator-text))]/70">
                Nessuna modalità della calcolatrice è abilitata
              </p>
            </div>
          ) : enabledModes.length === 1 ? (
            // If only one mode is enabled, show it directly without tabs
            <div>
              {enabledModes[0].mode_key === "standard" && (
                <StandardCalculator 
                  settings={settings} 
                  isKeyboardActive={isKeyboardActive}
                  onShowShortcuts={() => setShowShortcuts(true)}
                />
              )}
              {enabledModes[0].mode_key === "scientific" && (
                <ScientificCalculator 
                  settings={settings}
                  isKeyboardActive={isKeyboardActive}
                  onShowShortcuts={() => setShowShortcuts(true)}
                />
              )}
              {enabledModes[0].mode_key === "programmer" && (
                <ProgrammerCalculator 
                  settings={settings}
                  isKeyboardActive={isKeyboardActive}
                  onShowShortcuts={() => setShowShortcuts(true)}
                />
              )}
            </div>
          ) : (
            // Multiple modes enabled, show tabs
            <Tabs value={currentMode} onValueChange={setCurrentMode}>
              <TabsList
                className="grid w-full mb-4 bg-[hsl(var(--calculator-display))] gap-0 p-0 sm:gap-1 sm:p-1"
                style={{
                  gridTemplateColumns: `repeat(${enabledModes.length}, 1fr)`,
                }}
              >
                {enabledModes.map((mode) => (
                  <TabsTrigger
                    key={mode.mode_key}
                    value={mode.mode_key}
                    className="data-[state=active]:bg-[hsl(var(--calculator-operator))] data-[state=active]:text-white data-[state=inactive]:text-[hsl(var(--calculator-text))] flex items-center justify-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm"
                    aria-label={`Modalità ${mode.mode_name}`}
                  >
                    {getModeIcon(mode.mode_key)}
                    <span className="hidden md:inline">{mode.mode_name}</span>
                    <span className="hidden sm:inline md:hidden">{mode.mode_name.substring(0, 3)}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {enabledModes.map((mode) => (
                <TabsContent key={mode.mode_key} value={mode.mode_key}>
                  {mode.mode_key === "standard" && (
                    <StandardCalculator 
                      settings={settings}
                      isKeyboardActive={isKeyboardActive}
                      onShowShortcuts={() => setShowShortcuts(true)}
                    />
                  )}
                  {mode.mode_key === "scientific" && (
                    <ScientificCalculator 
                      settings={settings}
                      isKeyboardActive={isKeyboardActive}
                      onShowShortcuts={() => setShowShortcuts(true)}
                    />
                  )}
                  {mode.mode_key === "programmer" && (
                    <ProgrammerCalculator 
                      settings={settings}
                      isKeyboardActive={isKeyboardActive}
                      onShowShortcuts={() => setShowShortcuts(true)}
                    />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>

        <KeyboardShortcutsModal
          open={showShortcuts}
          onOpenChange={setShowShortcuts}
          currentMode={currentMode}
        />
        
        {/* Footer with contact information */}
        <footer className="mt-6 pt-4 border-t border-border/20">
          <p className="text-xs text-muted-foreground text-center">
            Sviluppato da{' '}
            <a 
              href="https://www.nicolocarello.it" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Prof. Nicolò Carello
            </a>
            {' • '}
            <a 
              href="mailto:info@nicolocarello.it"
              className="hover:text-primary transition-colors"
            >
              info@nicolocarello.it
            </a>
          </p>
        </footer>
      </Card>
    </div>
  );
};
