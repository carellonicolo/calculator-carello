import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, Power, ToggleLeft, ToggleRight, Calculator, Atom, Code, Calculator as CalcIcon, HelpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpModal } from "@/components/HelpModal";

type Setting = {
  id: string;
  function_key: string;
  function_name: string;
  category: string;
  mode?: string;
  is_enabled: boolean;
};

type Mode = {
  id: string;
  mode_key: string;
  mode_name: string;
  description: string;
  is_enabled: boolean;
  display_order: number;
};

type GroupedSettings = {
  [category: string]: Setting[];
};

// Default modes if table doesn't exist
const DEFAULT_MODES: Mode[] = [
  {
    id: 'default-standard',
    mode_key: 'standard',
    mode_name: 'Standard',
    description: 'Calcolatrice base con operazioni aritmetiche fondamentali',
    is_enabled: true,
    display_order: 1,
  },
  {
    id: 'default-scientific',
    mode_key: 'scientific',
    mode_name: 'Scientifica',
    description: 'Calcolatrice scientifica con funzioni trigonometriche, logaritmi e altro',
    is_enabled: true,
    display_order: 2,
  },
  {
    id: 'default-programmer',
    mode_key: 'programmer',
    mode_name: 'Programmatore',
    description: 'Calcolatrice per programmatori con operazioni bitwise e conversioni di base',
    is_enabled: true,
    display_order: 3,
  },
];

export const AdminDashboard = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [modes, setModes] = useState<Mode[]>(DEFAULT_MODES);
  const [loading, setLoading] = useState(true);
  const [calculatorEnabled, setCalculatorEnabled] = useState(true);
  const [modesTableExists, setModesTableExists] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // SECURITY NOTE: This component is protected by ProtectedAdminRoute wrapper.
  // Authentication and admin authorization are enforced at the route level and
  // by database RLS policies. All database operations automatically verify admin
  // status via the is_admin() SECURITY DEFINER function. Client-side checks are
  // for UX only - actual security is enforced server-side.

  // Define fetch functions BEFORE useEffect to avoid ReferenceError
  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('calculator_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('function_name', { ascending: true });

      if (error) {
        toast({
          title: "Errore",
          description: "Impossibile caricare le impostazioni",
          variant: "destructive",
        });
        console.error(error);
      } else {
        // Make sure each setting has a mode field, default to 'scientific' if not present
        const settingsWithMode = (data || []).map(s => ({
          ...s,
          mode: s.mode || 'scientific'
        }));
        setSettings(settingsWithMode);
      }
    } catch (err) {
      console.error("Exception fetching settings:", err);
    }
  }, [toast]);

  const fetchModes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('calculator_modes')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        // Table doesn't exist, use defaults
        console.log("Modes table not found, using defaults");
        setModes(DEFAULT_MODES);
        setModesTableExists(false);
      } else if (data && data.length > 0) {
        setModes(data);
        setModesTableExists(true);
      } else {
        setModes(DEFAULT_MODES);
        setModesTableExists(false);
      }
    } catch (err) {
      console.error("Exception fetching modes:", err);
      setModes(DEFAULT_MODES);
      setModesTableExists(false);
    }
  }, []);

  const fetchGlobalSettings = useCallback(async () => {
    try {
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
    } catch (err) {
      console.error('Exception fetching global settings:', err);
    }
  }, []);

  useEffect(() => {
    const initDashboard = async () => {
      try {
        // Load all dashboard data
        // Note: RLS policies automatically enforce admin-only access
        await Promise.all([
          fetchSettings(),
          fetchModes(),
          fetchGlobalSettings(),
        ]);
      } catch (err) {
        console.error("Error initializing dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, [fetchSettings, fetchModes, fetchGlobalSettings]);

  const toggleSetting = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('calculator_settings')
      .update({ is_enabled: !currentValue })
      .eq('id', id);

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'impostazione",
        variant: "destructive",
      });
      console.error(error);
    } else {
      setSettings(settings.map(s =>
        s.id === id ? { ...s, is_enabled: !currentValue } : s
      ));
      toast({
        title: "Aggiornato",
        description: "Impostazione modificata con successo",
      });
    }
  };

  const toggleMode = async (id: string, currentValue: boolean) => {
    if (!modesTableExists) {
      toast({
        title: "Funzionalità non disponibile",
        description: "La tabella delle modalità non è ancora stata creata. Le migrazioni del database devono essere eseguite.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('calculator_modes')
      .update({ is_enabled: !currentValue })
      .eq('id', id);

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la modalità",
        variant: "destructive",
      });
      console.error(error);
    } else {
      setModes(modes.map(m =>
        m.id === id ? { ...m, is_enabled: !currentValue } : m
      ));
      toast({
        title: !currentValue ? "Modalità Abilitata" : "Modalità Disabilitata",
        description: !currentValue
          ? "La modalità è stata abilitata con successo"
          : "La modalità è stata disabilitata",
      });
    }
  };

  const toggleGlobalCalculator = async () => {
    const newValue = !calculatorEnabled;
    const { error } = await supabase
      .from('global_settings')
      .update({ setting_value: newValue })
      .eq('setting_key', 'calculator_enabled');

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare lo stato della calcolatrice",
        variant: "destructive",
      });
      console.error(error);
    } else {
      setCalculatorEnabled(newValue);
      toast({
        title: newValue ? "Calcolatrice Abilitata" : "Calcolatrice Disabilitata",
        description: newValue
          ? "La calcolatrice è ora visibile e utilizzabile dagli utenti"
          : "La calcolatrice è stata disabilitata per tutti gli utenti",
      });
    }
  };

  const toggleAllFeatures = async (enableAll: boolean, modeFilter?: string) => {
    const settingsToUpdate = modeFilter
      ? settings.filter(s => s.mode === modeFilter)
      : settings;

    const updatePromises = settingsToUpdate.map(setting =>
      supabase
        .from('calculator_settings')
        .update({ is_enabled: enableAll })
        .eq('id', setting.id)
    );

    const results = await Promise.all(updatePromises);
    const hasError = results.some(result => result.error);

    if (hasError) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare alcune impostazioni",
        variant: "destructive",
      });
    } else {
      setSettings(settings.map(s =>
        (!modeFilter || s.mode === modeFilter)
          ? { ...s, is_enabled: enableAll }
          : s
      ));
      toast({
        title: enableAll ? "Funzionalità Abilitate" : "Funzionalità Disabilitate",
        description: enableAll
          ? "Tutte le funzionalità selezionate sono state abilitate"
          : "Tutte le funzionalità selezionate sono state disabilitate",
      });
    }
  };

  const toggleCategoryFeatures = async (mode: string, category: string, enableAll: boolean) => {
    const settingsToUpdate = settings.filter(s => s.mode === mode && s.category === category);
    
    const updatePromises = settingsToUpdate.map(setting =>
      supabase
        .from('calculator_settings')
        .update({ is_enabled: enableAll })
        .eq('id', setting.id)
    );

    const results = await Promise.all(updatePromises);
    const hasError = results.some(result => result.error);

    if (hasError) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare alcune impostazioni della categoria",
        variant: "destructive",
      });
    } else {
      setSettings(settings.map(s =>
        (s.mode === mode && s.category === category)
          ? { ...s, is_enabled: enableAll }
          : s
      ));
      toast({
        title: enableAll ? "Categoria Abilitata" : "Categoria Disabilitata",
        description: enableAll
          ? `Tutte le funzioni di "${getCategoryTitle(category)}" sono state abilitate`
          : `Tutte le funzioni di "${getCategoryTitle(category)}" sono state disabilitate`,
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getModeIcon = (modeKey: string) => {
    switch (modeKey) {
      case 'standard':
        return <Calculator className="h-6 w-6" />;
      case 'scientific':
        return <Atom className="h-6 w-6" />;
      case 'programmer':
        return <Code className="h-6 w-6" />;
      default:
        return <Settings className="h-6 w-6" />;
    }
  };

  const groupSettingsByMode = (mode: string): GroupedSettings => {
    const modeSettings = settings.filter(s => s.mode === mode);
    return modeSettings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {} as GroupedSettings);
  };

  const getCategoryTitle = (category: string) => {
    const titles: { [key: string]: string } = {
      'conversions': 'Conversioni di Base',
      'scientific': 'Funzioni Scientifiche',
      'standard': 'Funzioni Standard',
      'programmer': 'Funzioni Programmatore',
    };
    return titles[category] || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(var(--admin-bg))]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--admin-bg))]">
      <div className="min-h-screen">
        <div className="p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <Settings className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard Admin</h1>
                  <p className="text-sm text-muted-foreground">Gestione Calcolatrice Multi-Modale</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setHelpModalOpen(true)}
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Guida</span>
                </Button>
                <Button 
                  onClick={() => navigate('/')} 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                >
                  <CalcIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Calcolatrice</span>
                </Button>
                <Button 
                  onClick={handleLogout} 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Esci</span>
                </Button>
              </div>
            </div>

            {!modesTableExists && (
              <Card className="mb-6 bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
                <CardContent className="pt-6">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ <strong>Nota:</strong> La tabella delle modalità non è ancora stata creata. Le funzionalità di gestione modalità saranno limitate fino all'esecuzione delle migrazioni del database. Le 3 modalità (Standard, Scientifica, Programmatore) sono comunque disponibili e funzionanti.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Global Toggle Card */}
            <Card className="mb-6 bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))] border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${calculatorEnabled ? 'bg-primary/20' : 'bg-destructive/20'}`}>
                    <Power className={`h-6 w-6 ${calculatorEnabled ? 'text-primary' : 'text-destructive'}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">Stato Calcolatrice</CardTitle>
                    <CardDescription>
                      {calculatorEnabled
                        ? "La calcolatrice è attiva e disponibile per tutti gli utenti"
                        : "La calcolatrice è disabilitata per tutti gli utenti"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                  <div className="flex items-center gap-3">
                    <span className={`inline-block w-3 h-3 rounded-full ${calculatorEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <Label className="text-base font-semibold cursor-pointer" htmlFor="global-toggle">
                      {calculatorEnabled ? "Abilitata" : "Disabilitata"}
                    </Label>
                  </div>
                  <Switch
                    id="global-toggle"
                    checked={calculatorEnabled}
                    onCheckedChange={toggleGlobalCalculator}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                  <div className="flex-1">
                    <Label className="text-base font-semibold">
                      Gestione Globale Funzionalità
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {settings.filter(s => s.is_enabled).length} di {settings.length} funzionalità attive
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAllFeatures(false)}
                      disabled={settings.every(s => !s.is_enabled)}
                      className="text-xs"
                    >
                      Disattiva Tutto
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAllFeatures(true)}
                      disabled={settings.every(s => s.is_enabled)}
                      className="text-xs"
                    >
                      Attiva Tutto
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modes Management */}
            <Card className="mb-6 bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))] border-2">
              <CardHeader>
                <CardTitle className="text-xl">Gestione Modalità</CardTitle>
                <CardDescription>
                  {modesTableExists
                    ? "Abilita o disabilita le diverse modalità della calcolatrice"
                    : "Le modalità sono visualizzate ma non modificabili (tabella database non creata)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {modes.map((mode) => (
                    <div
                      key={mode.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${mode.is_enabled ? 'bg-primary/20' : 'bg-muted'}`}>
                          {getModeIcon(mode.mode_key)}
                        </div>
                        <div>
                          <Label className="text-sm font-semibold cursor-pointer">
                            {mode.mode_name}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {mode.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={mode.is_enabled}
                        onCheckedChange={() => toggleMode(mode.id, mode.is_enabled)}
                        disabled={!modesTableExists}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mode-specific Function Settings */}
            <Card className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
              <CardHeader>
                <CardTitle className="text-xl">Funzionalità per Modalità</CardTitle>
                <CardDescription>
                  Configura le funzioni specifiche di ogni modalità
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="standard" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="standard">Standard</TabsTrigger>
                    <TabsTrigger value="scientific">Scientifica</TabsTrigger>
                    <TabsTrigger value="programmer">Programmatore</TabsTrigger>
                  </TabsList>

                  {['standard', 'scientific', 'programmer'].map((mode) => {
                    const modeSettings = settings.filter(s => s.mode === mode);
                    const groupedSettings = groupSettingsByMode(mode);

                    return (
                      <TabsContent key={mode} value={mode} className="space-y-4">
                        {/* Mode-specific master toggle */}
                        <div className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-border">
                          <div className="flex-1">
                            <Label className="text-sm font-semibold">
                              {modeSettings.every(s => s.is_enabled)
                                ? "Tutte le funzioni di questa modalità sono attive"
                                : modeSettings.every(s => !s.is_enabled)
                                ? "Tutte le funzioni di questa modalità sono disattivate"
                                : "Alcune funzioni sono attive"}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              {modeSettings.filter(s => s.is_enabled).length} di {modeSettings.length} attive
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleAllFeatures(false, mode)}
                              disabled={modeSettings.every(s => !s.is_enabled)}
                            >
                              Disattiva Tutte
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleAllFeatures(true, mode)}
                              disabled={modeSettings.every(s => s.is_enabled)}
                            >
                              Attiva Tutte
                            </Button>
                          </div>
                        </div>

                        {/* Individual functions */}
                        <div className="grid gap-4">
                          {Object.entries(groupedSettings).map(([category, categorySettings]) => (
                            <Card key={category} className="bg-background/30">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-base">{getCategoryTitle(category)}</CardTitle>
                                  <Switch
                                    checked={categorySettings.every(s => s.is_enabled)}
                                    onCheckedChange={(checked) => toggleCategoryFeatures(mode, category, checked)}
                                  />
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  {categorySettings.map((setting) => (
                                    <div
                                      key={setting.id}
                                      className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                                    >
                                      <div className="flex-1">
                                        <Label
                                          htmlFor={setting.id}
                                          className="text-sm font-medium cursor-pointer"
                                        >
                                          {setting.function_name}
                                        </Label>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          {setting.function_key}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`text-xs font-semibold ${
                                            setting.is_enabled ? "text-green-600" : "text-red-600"
                                          }`}
                                        >
                                          {setting.is_enabled ? "ON" : "OFF"}
                                        </span>
                                        <Switch
                                          id={setting.id}
                                          checked={setting.is_enabled}
                                          onCheckedChange={() => toggleSetting(setting.id, setting.is_enabled)}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </CardContent>
            </Card>

            <div className="mt-6 p-4 bg-[hsl(var(--admin-card))] rounded-lg border border-[hsl(var(--admin-border))]">
              <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                Informazioni
              </h3>
              <p className="text-xs text-muted-foreground">
                Le modifiche sono salvate automaticamente e si applicano immediatamente a tutti gli utenti. 
                Usa il pulsante "Guida" in alto per maggiori informazioni.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <HelpModal 
        open={helpModalOpen} 
        onOpenChange={setHelpModalOpen}
        defaultTab="teachers"
      />
    </div>
  );
};
