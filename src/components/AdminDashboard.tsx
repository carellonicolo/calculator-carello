import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, Power, ToggleLeft, ToggleRight } from "lucide-react";

type Setting = {
  id: string;
  function_key: string;
  function_name: string;
  category: string;
  is_enabled: boolean;
};

type GroupedSettings = {
  [category: string]: Setting[];
};

export const AdminDashboard = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculatorEnabled, setCalculatorEnabled] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchSettings();
    fetchGlobalSettings();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
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
      setSettings(data || []);
    }
    setLoading(false);
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

  const toggleAllFeatures = async (enableAll: boolean) => {
    const updatePromises = settings.map(setting =>
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
      setSettings(settings.map(s => ({ ...s, is_enabled: enableAll })));
      toast({
        title: enableAll ? "Tutte le Funzionalità Abilitate" : "Tutte le Funzionalità Disabilitate",
        description: enableAll
          ? "Tutte le funzionalità della calcolatrice sono state abilitate"
          : "Tutte le funzionalità della calcolatrice sono state disabilitate",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const groupedSettings: GroupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as GroupedSettings);

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'conversions':
        return 'Conversioni di Base';
      case 'scientific':
        return 'Funzioni Scientifiche';
      default:
        return category;
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'conversions':
        return 'Gestisci le conversioni tra diverse basi numeriche (binario, ottale, esadecimale)';
      case 'scientific':
        return 'Gestisci le funzioni scientifiche avanzate della calcolatrice';
      default:
        return '';
    }
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
        {/* Control Panel */}
        <div className="p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <Settings className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard Admin</h1>
                  <p className="text-sm text-muted-foreground">Gestione Calcolatrice</p>
                </div>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                Esci
              </Button>
            </div>

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
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                  <div className="flex items-center gap-3">
                    <span className={`inline-block w-3 h-3 rounded-full ${calculatorEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <Label className="text-base font-semibold cursor-pointer" htmlFor="global-toggle">
                      {calculatorEnabled ? "🟢 Abilitata" : "🔴 Disabilitata"}
                    </Label>
                  </div>
                  <Switch
                    id="global-toggle"
                    checked={calculatorEnabled}
                    onCheckedChange={toggleGlobalCalculator}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Master Toggle for All Features */}
            <Card className="mb-6 bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))] border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-accent/20">
                    {settings.every(s => s.is_enabled) ? (
                      <ToggleRight className="h-6 w-6 text-accent" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">Gestione Funzionalità</CardTitle>
                    <CardDescription>
                      Attiva o disattiva tutte le funzionalità con un solo click
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                  <div className="flex-1">
                    <Label className="text-base font-semibold cursor-pointer">
                      {settings.every(s => s.is_enabled)
                        ? "Tutte le funzionalità sono attive"
                        : settings.every(s => !s.is_enabled)
                        ? "Tutte le funzionalità sono disattivate"
                        : "Alcune funzionalità sono attive"}
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

            {/* Individual Function Settings */}
            <div className="grid gap-6">
              {Object.entries(groupedSettings).map(([category, categorySettings]) => (
                <Card key={category} className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
                  <CardHeader>
                    <CardTitle className="text-lg">{getCategoryTitle(category)}</CardTitle>
                    <CardDescription className="text-sm">{getCategoryDescription(category)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
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

            <div className="mt-6 p-4 bg-[hsl(var(--admin-card))] rounded-lg border border-[hsl(var(--admin-border))]">
              <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                ℹ️ Informazioni
              </h3>
              <p className="text-xs text-muted-foreground">
                Le modifiche vengono applicate in tempo reale sulla calcolatrice principale.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
