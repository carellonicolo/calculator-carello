import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Calculator as CalcIcon, Atom, Code } from "lucide-react";
import { StandardCalculator } from "./modes/StandardCalculator";
import { ScientificCalculator } from "./modes/ScientificCalculator";
import { ProgrammerCalculator } from "./modes/ProgrammerCalculator";

type CalculatorSettings = {
  [key: string]: boolean;
};

type CalculatorMode = {
  mode_key: string;
  mode_name: string;
  is_enabled: boolean;
  display_order: number;
};

export const Calculator = () => {
  const [settings, setSettings] = useState<CalculatorSettings>({});
  const [modes, setModes] = useState<CalculatorMode[]>([]);
  const [calculatorEnabled, setCalculatorEnabled] = useState(true);
  const [currentMode, setCurrentMode] = useState<string>("standard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    fetchModes();
    fetchGlobalSettings();

    // Subscribe to real-time changes
    const settingsChannel = supabase
      .channel("calculator_settings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calculator_settings" },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    const modesChannel = supabase
      .channel("calculator_modes_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calculator_modes" },
        () => {
          fetchModes();
        }
      )
      .subscribe();

    const globalChannel = supabase
      .channel("global_settings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "global_settings" },
        () => {
          fetchGlobalSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(modesChannel);
      supabase.removeChannel(globalChannel);
    };
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("calculator_settings")
      .select("function_key, is_enabled, mode");

    if (error) {
      console.error("Error fetching settings:", error);
      return;
    }

    const settingsMap: CalculatorSettings = {};
    data?.forEach((item) => {
      settingsMap[item.function_key] = item.is_enabled;
    });
    setSettings(settingsMap);
    setLoading(false);
  };

  const fetchModes = async () => {
    const { data, error } = await supabase
      .from("calculator_modes")
      .select("*")
      .order("display_order");

    if (error) {
      console.error("Error fetching modes:", error);
      return;
    }

    setModes(data || []);
  };

  const fetchGlobalSettings = async () => {
    const { data, error } = await supabase
      .from("global_settings")
      .select("setting_value")
      .eq("setting_key", "calculator_enabled")
      .single();

    if (error) {
      console.error("Error fetching global settings:", error);
    } else {
      setCalculatorEnabled(data?.setting_value ?? true);
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

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl p-6 bg-[hsl(var(--calculator-bg))]/95 backdrop-blur-xl border-2 border-primary/20 shadow-2xl relative overflow-hidden animate-slide-in-up">
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
                <StandardCalculator settings={settings} />
              )}
              {enabledModes[0].mode_key === "scientific" && (
                <ScientificCalculator settings={settings} />
              )}
              {enabledModes[0].mode_key === "programmer" && (
                <ProgrammerCalculator settings={settings} />
              )}
            </div>
          ) : (
            // Multiple modes enabled, show tabs
            <Tabs value={currentMode} onValueChange={setCurrentMode}>
              <TabsList className="grid w-full mb-4 bg-[hsl(var(--calculator-display))]" style={{ gridTemplateColumns: `repeat(${enabledModes.length}, 1fr)` }}>
                {enabledModes.map((mode) => (
                  <TabsTrigger
                    key={mode.mode_key}
                    value={mode.mode_key}
                    className="data-[state=active]:bg-[hsl(var(--calculator-operator))] data-[state=active]:text-white flex items-center gap-2"
                  >
                    {getModeIcon(mode.mode_key)}
                    {mode.mode_name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {enabledModes.map((mode) => (
                <TabsContent key={mode.mode_key} value={mode.mode_key}>
                  {mode.mode_key === "standard" && (
                    <StandardCalculator settings={settings} />
                  )}
                  {mode.mode_key === "scientific" && (
                    <ScientificCalculator settings={settings} />
                  )}
                  {mode.mode_key === "programmer" && (
                    <ProgrammerCalculator settings={settings} />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </Card>
    </div>
  );
};
